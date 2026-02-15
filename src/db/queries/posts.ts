import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { posts } from "@/db/schema";

export type Post = (typeof posts)["$inferSelect"];
export type NewPost = (typeof posts)["$inferInsert"];

export async function insertPost(data: NewPost): Promise<Post> {
  const [row] = await db.insert(posts).values(data).returning();
  if (!row) throw new Error("Failed to insert post");
  return row;
}

export async function getPostById(id: string): Promise<Post | null> {
  const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return row ?? null;
}

export async function listPosts(options: {
  limit?: number;
  offset?: number;
  orderBy?: "createdAt" | "score";
}): Promise<Post[]> {
  const { limit = 50, offset = 0, orderBy = "createdAt" } = options;
  const orderColumn = orderBy === "score" ? posts.score : posts.createdAt;
  return db
    .select()
    .from(posts)
    .orderBy(desc(orderColumn))
    .limit(limit)
    .offset(offset);
}

export async function updatePostScore(
  id: string,
  score: number,
): Promise<void> {
  await db.update(posts).set({ score }).where(eq(posts.id, id));
}

export async function countPostsByAuthor(
  authorAgentId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(posts)
    .where(eq(posts.authorAgentId, authorAgentId));
  return row?.count ?? 0;
}
