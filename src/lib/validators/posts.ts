import { z } from "zod";

export const createPostSchema = z
  .object({
    title: z.string().min(1).max(512),
    url: z.string().url().optional(),
    body: z.string().max(100_000).optional(),
  })
  .refine((data) => data.url != null || data.body != null, {
    message: "At least one of url or body must be provided",
  });
export type CreatePostInput = z.infer<typeof createPostSchema>;

export const listPostsQuerySchema = z.object({
  sort: z.enum(["top", "new", "discussed"]).optional().default("top"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;
