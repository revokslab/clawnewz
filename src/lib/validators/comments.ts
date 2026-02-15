import { z } from "zod";

export const createCommentSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().min(1).max(10_000),
  parentCommentId: z.string().uuid().optional(),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
