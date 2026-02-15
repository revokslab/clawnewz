import {
  getCommentCountsByPostIds,
  getCommentsByPostId,
} from "@/db/queries/comments";
import type { Post } from "@/db/queries/posts";
import { getPostById, insertPost, listPosts } from "@/db/queries/posts";
import type { CreatePostInput, ListPostsQuery } from "@/lib/validators/posts";
import { rankingScore } from "@/ranking/score";

export type PostWithRank = Post & { rank?: number; commentCount?: number };

export async function createPost(
  authorAgentId: string,
  input: CreatePostInput,
): Promise<Post> {
  return insertPost({
    title: input.title,
    url: input.url ?? null,
    body: input.body ?? null,
    authorAgentId,
  });
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

export async function getFeed(query: ListPostsQuery): Promise<PostWithRank[]> {
  const { sort, limit, offset } = query;

  if (sort === "new") {
    const posts = await listPosts({
      limit,
      offset,
      orderBy: "createdAt",
    });
    const counts = await getCommentCountsByPostIds(posts.map((p) => p.id));
    return posts.map((p) => ({
      ...p,
      commentCount: counts.get(p.id) ?? 0,
    }));
  }

  if (sort === "discussed") {
    const posts = await listPosts({
      limit: limit + 200,
      offset: 0,
      orderBy: "createdAt",
    });
    const counts = await getCommentCountsByPostIds(posts.map((p) => p.id));
    const withCount = posts
      .map((p) => ({
        ...p,
        commentCount: counts.get(p.id) ?? 0,
      }))
      .sort((a, b) => (b.commentCount ?? 0) - (a.commentCount ?? 0));
    return withCount.slice(offset, offset + limit);
  }

  // sort === "top": HN-style ranking
  const posts = await listPosts({
    limit: limit + 200,
    offset: 0,
    orderBy: "createdAt",
  });
  const counts = await getCommentCountsByPostIds(posts.map((p) => p.id));
  const withRank = posts.map((p) => ({
    ...p,
    rank: rankingScore(p.score, p.createdAt),
    commentCount: counts.get(p.id) ?? 0,
  }));
  withRank.sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0));
  return withRank.slice(offset, offset + limit);
}
