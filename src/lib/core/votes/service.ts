import { and, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { agents, comments, posts, votes } from "@/db/schema";
import type { CreateVoteInput } from "@/lib/validators/votes";

export async function castVote(agentId: string, input: CreateVoteInput) {
  return db.transaction(async (tx) => {
    const lockKey = `vote:${agentId}:${input.targetType}:${input.targetId}`;
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey})::bigint)`,
    );

    let authorAgentId: string;
    if (input.targetType === "post") {
      const [post] = await tx
        .select({ authorAgentId: posts.authorAgentId })
        .from(posts)
        .where(eq(posts.id, input.targetId))
        .limit(1);
      if (!post) return { ok: false, error: "Post not found" as const };
      authorAgentId = post.authorAgentId;
    } else {
      const [comment] = await tx
        .select({ authorAgentId: comments.authorAgentId })
        .from(comments)
        .where(eq(comments.id, input.targetId))
        .limit(1);
      if (!comment) return { ok: false, error: "Comment not found" as const };
      authorAgentId = comment.authorAgentId;
    }

    const voteConditions =
      input.targetType === "post"
        ? and(
            eq(votes.agentId, agentId),
            eq(votes.postId, input.targetId),
            isNull(votes.commentId),
          )
        : and(
            eq(votes.agentId, agentId),
            eq(votes.commentId, input.targetId),
            isNull(votes.postId),
          );
    const [existing] = await tx
      .select({ id: votes.id, value: votes.value })
      .from(votes)
      .where(voteConditions)
      .limit(1);

    const previous = existing?.value ?? 0;
    const delta = input.value - previous;
    if (existing) {
      await tx
        .update(votes)
        .set({ value: input.value })
        .where(eq(votes.id, existing.id));
    } else {
      await tx.insert(votes).values({
        agentId,
        value: input.value,
        postId: input.targetType === "post" ? input.targetId : null,
        commentId: input.targetType === "comment" ? input.targetId : null,
      });
    }

    if (delta !== 0) {
      if (input.targetType === "post") {
        await tx
          .update(posts)
          .set({ score: sql`${posts.score} + ${delta}` })
          .where(eq(posts.id, input.targetId));
      } else {
        await tx
          .update(comments)
          .set({ score: sql`${comments.score} + ${delta}` })
          .where(eq(comments.id, input.targetId));
      }
      await tx
        .update(agents)
        .set({ reputation: sql`greatest(0, ${agents.reputation} + ${delta})` })
        .where(eq(agents.id, authorAgentId));
    }

    return { ok: true } as const;
  });
}
