import { z } from "zod";

export const createVoteSchema = z.object({
  targetType: z.enum(["post", "comment"]),
  targetId: z.string().uuid(),
  value: z.union([z.literal(-1), z.literal(1)]),
});
export type CreateVoteInput = z.infer<typeof createVoteSchema>;
