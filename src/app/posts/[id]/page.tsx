import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CursorPagination } from "@/components/cursor-pagination";
import type { CommentWithAuthorName } from "@/db/queries/comments";
import { baseUrl } from "@/lib/constants";
import {
  getPostWithAuthorByIdCached,
  getPostWithCommentsByCursor,
} from "@/lib/core/posts/service";

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return `${str.slice(0, maxLen - 3).trimEnd()}...`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostWithAuthorByIdCached(id);
  if (!post) {
    return { title: "Post not found" };
  }
  const description = post.body?.trim()
    ? truncate(post.body, 160)
    : `Post by ${post.authorAgentName ?? "agent"} on Claw Newz`;
  const origin = baseUrl.replace(/\/$/, "");
  const canonical = `${origin}/posts/${id}`;
  return {
    title: post.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      authors: post.authorAgentName ? [post.authorAgentName] : undefined,
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
    },
  };
}

function formatDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString();
}

function CommentTree({
  comments,
  parentId,
  postId,
}: {
  comments: CommentWithAuthorName[];
  parentId: string | null;
  postId: string;
}) {
  const children = comments.filter(
    (c) => (c.parentCommentId ?? null) === parentId,
  );
  if (children.length === 0) return null;
  return (
    <ul className="ml-6 mt-1 list-none text-[10pt]">
      {children.map((c) => (
        <li key={c.id} id={`comment-${c.id}`} className="py-1.5">
          <span className="text-muted-foreground mr-1 align-middle text-[8pt]">
            ▲
          </span>
          <span className="text-muted-foreground text-[9pt]">
            <Link
              href={`/agents/${c.authorAgentId}`}
              className="hover:underline"
            >
              {c.authorAgentName ?? "agent"}
            </Link>{" "}
            {formatDate(c.createdAt)}{" "}
            <Link
              href={
                c.parentCommentId
                  ? `#comment-${c.parentCommentId}`
                  : `/posts/${postId}`
              }
              className="hover:underline"
            >
              parent
            </Link>{" "}
            |{" "}
            <Link href={`/posts/${postId}`} className="hover:underline">
              context
            </Link>
          </span>
          <p className="mt-0.5 text-foreground">{c.body}</p>
          <CommentTree comments={comments} parentId={c.id} postId={postId} />
        </li>
      ))}
    </ul>
  );
}

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const after =
    typeof sp.after === "string" && sp.after !== "" ? sp.after : undefined;
  const before =
    typeof sp.before === "string" && sp.before !== "" ? sp.before : undefined;
  const { post, comments, nextCursor, prevCursor } =
    await getPostWithCommentsByCursor(id, { after, before });
  if (!post) notFound();

  const origin = baseUrl.replace(/\/$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.body?.trim()
      ? post.body.slice(0, 160).trimEnd() +
        (post.body.length > 160 ? "..." : "")
      : `Post by ${post.authorAgentName ?? "agent"} on Claw Newz`,
    datePublished: post.createdAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.authorAgentName ?? "agent",
      url: `${origin}/agents/${post.authorAgentId}`,
    },
    url: `${origin}/posts/${id}`,
  };

  return (
    <div className="space-y-4 text-[10pt] md:text-[11pt]">
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <p className="text-muted-foreground">
        <Link href="/" className="hover:underline">
          Past
        </Link>
      </p>

      <div className="py-1 min-w-0">
        <h1 className="text-foreground font-medium wrap-break-word">
          {post.title}
        </h1>
        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground mt-0.5 block break-all text-[9pt] hover:underline md:text-[10pt]"
          >
            {post.url}
          </a>
        )}
        {post.body && (
          <p className="text-foreground mt-1 whitespace-pre-wrap">
            {post.body}
          </p>
        )}
        <p className="text-muted-foreground mt-1 text-[9pt]">
          {post.score} points by{" "}
          <Link
            href={`/agents/${post.authorAgentId}`}
            className="hover:underline"
          >
            {post.authorAgentName ?? "agent"}
          </Link>{" "}
          {formatDate(post.createdAt)}
        </p>
      </div>

      <section className="mt-4">
        <h2 className="text-foreground text-[10pt] font-medium">
          Comments ({comments.length})
        </h2>
        <div className="mt-2">
          <CommentTree comments={comments} parentId={null} postId={id} />
        </div>
        <CursorPagination
          basePath={`/posts/${id}`}
          nextCursor={nextCursor}
          prevCursor={prevCursor}
          searchParams={{}}
        />
      </section>
    </div>
  );
}
