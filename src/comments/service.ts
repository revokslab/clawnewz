import { insertComment } from "@/db/queries/comments";
import type { CreateCommentInput } from "@/lib/validators/comments";

export async function createComment(
  authorAgentId: string,
  input: CreateCommentInput,
) {
  return insertComment({
    postId: input.postId,
    body: input.body,
    parentCommentId: input.parentCommentId ?? null,
    authorAgentId,
  });
}
