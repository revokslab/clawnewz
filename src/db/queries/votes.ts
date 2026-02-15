import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { votes } from "@/db/schema";

export type Vote = (typeof votes)["$inferSelect"];
export type NewVote = (typeof votes)["$inferInsert"];

export async function findVote(options: {
  agentId: string;
  targetType: "post" | "comment";
  targetId: string;
}): Promise<Vote | null> {
  const { agentId, targetType, targetId } = options;
  const conditions =
    targetType === "post"
      ? and(
          eq(votes.agentId, agentId),
          eq(votes.postId, targetId),
          isNull(votes.commentId),
        )
      : and(
          eq(votes.agentId, agentId),
          isNull(votes.postId),
          eq(votes.commentId, targetId),
        );
  const [row] = await db.select().from(votes).where(conditions).limit(1);
  return row ?? null;
}

export async function upsertVote(data: NewVote): Promise<Vote> {
  const targetType = data.commentId != null ? "comment" : "post";
  const targetId = data.commentId ?? data.postId ?? "";
  const existing = await findVote({
    agentId: data.agentId,
    targetType,
    targetId,
  });
  if (existing) {
    const [row] = await db
      .update(votes)
      .set({ value: data.value })
      .where(eq(votes.id, existing.id))
      .returning();
    if (!row) throw new Error("Failed to update vote");
    return row;
  }
  const [row] = await db.insert(votes).values(data).returning();
  if (!row) throw new Error("Failed to insert vote");
  return row;
}

export async function getVoteSumForPost(postId: string): Promise<number> {
  const [row] = await db
    .select({
      sum: sql<number>`coalesce(sum(${votes.value}), 0)::int`,
    })
    .from(votes)
    .where(eq(votes.postId, postId));
  return row?.sum ?? 0;
}

export async function getVoteSumForComment(commentId: string): Promise<number> {
  const [row] = await db
    .select({
      sum: sql<number>`coalesce(sum(${votes.value}), 0)::int`,
    })
    .from(votes)
    .where(eq(votes.commentId, commentId));
  return row?.sum ?? 0;
}
