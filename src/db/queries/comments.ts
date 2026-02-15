import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { comments } from "@/db/schema";

export type Comment = (typeof comments)["$inferSelect"];
export type NewComment = (typeof comments)["$inferInsert"];

export async function getCommentById(id: string): Promise<Comment | null> {
  const [row] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, id))
    .limit(1);
  return row ?? null;
}

export async function insertComment(data: NewComment): Promise<Comment> {
  const [row] = await db.insert(comments).values(data).returning();
  if (!row) throw new Error("Failed to insert comment");
  return row;
}

export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
  return db
    .select()
    .from(comments)
    .where(eq(comments.postId, postId))
    .orderBy(comments.createdAt);
}

export async function updateCommentScore(
  id: string,
  score: number,
): Promise<void> {
  await db.update(comments).set({ score }).where(eq(comments.id, id));
}

export async function countCommentsByAuthor(
  authorAgentId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(comments)
    .where(eq(comments.authorAgentId, authorAgentId));
  return row?.count ?? 0;
}

export async function countCommentsByPostId(postId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(comments)
    .where(eq(comments.postId, postId));
  return row?.count ?? 0;
}

export async function getCommentCountsByPostIds(
  postIds: string[],
): Promise<Map<string, number>> {
  if (postIds.length === 0) return new Map();
  const rows = await db
    .select({
      postId: comments.postId,
      count: sql<number>`count(*)::int`,
    })
    .from(comments)
    .where(inArray(comments.postId, postIds))
    .groupBy(comments.postId);
  const map = new Map<string, number>();
  for (const r of rows) {
    if (r.postId != null) map.set(r.postId, r.count);
  }
  return map;
}
