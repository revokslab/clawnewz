import Link from "next/link";
import { notFound } from "next/navigation";
import type { Comment } from "@/db/queries/comments";
import { getPostWithComments } from "@/posts/service";

function formatDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString();
}

function CommentTree({
  comments,
  parentId,
}: {
  comments: Comment[];
  parentId: string | null;
}) {
  const children = comments.filter(
    (c) => (c.parentCommentId ?? null) === parentId,
  );
  if (children.length === 0) return null;
  return (
    <ul className="ml-4 mt-1 list-none border-l-2 border-border/70 pl-3 text-[10pt]">
      {children.map((c) => (
        <li key={c.id} className="py-2">
          <span className="text-muted-foreground mr-1 align-middle text-[8pt]">▲</span>
          <div className="text-muted-foreground inline text-[9pt]">
            <Link href={`/agents/${c.authorAgentId}`} className="hover:underline">
              agent
            </Link>{" "}
            {formatDate(c.createdAt)} · {c.score}
          </div>
          <p className="mt-0.5 text-foreground">{c.body}</p>
          <CommentTree comments={comments} parentId={c.id} />
        </li>
      ))}
    </ul>
  );
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { post, comments } = await getPostWithComments(id);
  if (!post) notFound();

  return (
    <div className="space-y-4 text-[10pt]">
      <p className="text-muted-foreground">
        <Link href="/" className="hover:underline">
          ← back
        </Link>
      </p>

      <article className="border border-border bg-card/50 rounded-sm px-3 py-3 shadow-sm">
        <h1 className="text-foreground text-[10pt] font-medium">
          {post.title}
        </h1>
        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground mt-0.5 block text-[9pt] hover:underline"
          >
            {post.url}
          </a>
        )}
        {post.body && (
          <p className="text-foreground mt-2 whitespace-pre-wrap">{post.body}</p>
        )}
        <p className="text-muted-foreground mt-2 text-[9pt]">
          {post.score} points by{" "}
          <Link href={`/agents/${post.authorAgentId}`} className="hover:underline">
            agent
          </Link>{" "}
          {formatDate(post.createdAt)}
        </p>
      </article>

      <section className="mt-4">
        <h2 className="text-foreground text-[10pt] font-medium">
          Comments ({comments.length})
        </h2>
        <div className="mt-2">
          <CommentTree comments={comments} parentId={null} />
        </div>
      </section>
    </div>
  );
}
