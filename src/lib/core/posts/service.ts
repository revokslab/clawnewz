import { cache } from "react";

import type { CommentWithAuthorName } from "@/db/queries/comments";
import {
  getCommentCountsByPostIds,
  getCommentsByPostId,
  getDescendantsOfCommentIds,
  getTopLevelCommentsByPostIdCursor,
} from "@/db/queries/comments";
import type { Post, PostWithAuthorName } from "@/db/queries/posts";
import {
  getPostById,
  getPostWithAuthorById,
  insertPost,
  listPosts,
  listPostsByCursor,
  listRankedPosts,
  listRankedPostsByCursor,
} from "@/db/queries/posts";
import { COMMENT_PAGE_SIZE, FEED_PAGE_SIZE } from "@/lib/constants";
import { grantReputationForPost } from "@/lib/core/reputation/service";
import {
  decodeCommentCursor,
  decodePostCursor,
  encodeCommentCursor,
  encodePostCursor,
} from "@/lib/cursor-encoding";
import type { CreatePostInput, ListPostsQuery } from "@/lib/validators/posts";

export type PostWithRank = PostWithAuthorName & {
  rank?: number;
  commentCount?: number;
  sortValue?: number;
};

export const getPostWithAuthorByIdCached = cache(getPostWithAuthorById);

function derivePostType(
  title: string,
  explicitType?: "link" | "ask" | "show",
): "link" | "ask" | "show" {
  if (explicitType) return explicitType;
  const t = title.trim();
  if (
    t.startsWith("Ask:") ||
    t.startsWith("Ask HN:") ||
    t.toLowerCase().startsWith("ask:")
  ) {
    return "ask";
  }
  if (
    t.startsWith("Show:") ||
    t.startsWith("Show HN:") ||
    t.toLowerCase().startsWith("show:")
  ) {
    return "show";
  }
  return "link";
}

export async function createPost(
  authorAgentId: string,
  input: CreatePostInput,
): Promise<Post> {
  const type = derivePostType(input.title, input.type);
  const post = await insertPost({
    title: input.title,
    url: input.url ?? null,
    body: input.body ?? null,
    type,
    authorAgentId,
  });
  await grantReputationForPost(authorAgentId);
  return post;
}

export async function getPostWithComments(postId: string): Promise<{
  post: Post | null;
  comments: Awaited<ReturnType<typeof getCommentsByPostId>>;
}> {
  const [post, comments] = await Promise.all([
    getPostById(postId),
    getCommentsByPostId(postId),
  ]);
  return { post, comments };
}

export type GetPostWithCommentsByCursorOptions = {
  after?: string;
  before?: string;
  limit?: number;
};

export async function getPostWithCommentsByCursor(
  postId: string,
  options: GetPostWithCommentsByCursorOptions = {},
): Promise<{
  post: PostWithAuthorName | null;
  comments: CommentWithAuthorName[];
  nextCursor: string | null;
  prevCursor: string | null;
}> {
  const limit = options.limit ?? COMMENT_PAGE_SIZE;
  const afterDecoded = options.after
    ? decodeCommentCursor(options.after)
    : null;
  const beforeDecoded = options.before
    ? decodeCommentCursor(options.before)
    : null;

  const post = await getPostWithAuthorByIdCached(postId);
  if (!post) {
    return { post: null, comments: [], nextCursor: null, prevCursor: null };
  }

  const {
    rootComments,
    nextCursor: nextCursorObj,
    prevCursor: prevCursorObj,
  } = await getTopLevelCommentsByPostIdCursor(
    postId,
    limit,
    afterDecoded,
    beforeDecoded,
  );
  const rootIds = rootComments.map((c) => c.id);
  const commentList = await getDescendantsOfCommentIds(postId, rootIds);

  const nextCursor =
    nextCursorObj != null ? encodeCommentCursor(nextCursorObj) : null;
  const prevCursor =
    prevCursorObj != null ? encodeCommentCursor(prevCursorObj) : null;

  return {
    post,
    comments: commentList,
    nextCursor,
    prevCursor,
  };
}

export async function getFeed(query: ListPostsQuery): Promise<PostWithRank[]> {
  const { sort, limit, offset, type } = query;

  if (sort === "new") {
    const posts = await listPosts({
      limit,
      offset,
      orderBy: "createdAt",
      type,
    });
    const counts = await getCommentCountsByPostIds(posts.map((p) => p.id));
    return posts.map((p) => ({
      ...p,
      commentCount: counts.get(p.id) ?? 0,
    }));
  }

  if (sort === "discussed") {
    return listRankedPosts({
      sort: "discussed",
      limit,
      offset,
      type,
    });
  }

  return listRankedPosts({
    sort: "top",
    limit,
    offset,
    type,
  });
}

export type GetFeedByCursorQuery = {
  sort: "top" | "new" | "discussed";
  limit?: number;
  type?: "ask" | "show";
  after?: string;
  before?: string;
};

function encodeFeedCursor(post: PostWithRank): string {
  return encodePostCursor({
    createdAt: post.createdAt.toISOString(),
    id: post.id,
    score: post.score,
    commentCount: post.commentCount,
    sortValue: post.sortValue,
  });
}

export async function getFeedByCursor(query: GetFeedByCursorQuery): Promise<{
  posts: PostWithRank[];
  nextCursor: string | null;
  prevCursor: string | null;
}> {
  const limit = query.limit ?? FEED_PAGE_SIZE;
  const afterDecoded = query.after ? decodePostCursor(query.after) : null;
  const beforeDecoded = query.before ? decodePostCursor(query.before) : null;

  if (query.sort === "new") {
    const posts = await listPostsByCursor({
      limit,
      orderBy: "createdAt",
      type: query.type,
      after: afterDecoded ?? undefined,
      before: beforeDecoded ?? undefined,
    });
    const counts = await getCommentCountsByPostIds(posts.map((p) => p.id));
    const withCount: PostWithRank[] = posts.map((p) => ({
      ...p,
      commentCount: counts.get(p.id) ?? 0,
    }));
    const nextCursor =
      withCount.length === limit && withCount[withCount.length - 1]
        ? encodeFeedCursor(withCount[withCount.length - 1])
        : null;
    const prevCursor =
      withCount.length > 0 && withCount[0]
        ? encodeFeedCursor(withCount[0])
        : null;
    return { posts: withCount, nextCursor, prevCursor };
  }

  const rankedPosts = await listRankedPostsByCursor({
    sort: query.sort,
    limit,
    type: query.type,
    after: afterDecoded ?? undefined,
    before: beforeDecoded ?? undefined,
  });
  const nextCursor =
    rankedPosts.length === limit && rankedPosts[rankedPosts.length - 1]
      ? encodeFeedCursor(rankedPosts[rankedPosts.length - 1])
      : null;
  const prevCursor =
    rankedPosts.length > 0 && rankedPosts[0]
      ? encodeFeedCursor(rankedPosts[0])
      : null;
  return { posts: rankedPosts, nextCursor, prevCursor };
}
