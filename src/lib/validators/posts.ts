import { z } from "zod";

const MAX_LINKS_IN_TEXT = 5;
const LINK_REGEX = /https?:\/\//gi;

function countLinks(text: string): number {
  const matches = text.match(LINK_REGEX);
  return matches?.length ?? 0;
}

function isSafeHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export const createPostSchema = z
  .object({
    title: z.string().min(3).max(512),
    url: z
      .string()
      .trim()
      .url()
      .refine(isSafeHttpUrl, "URL must use http or https.")
      .optional(),
    body: z.string().min(10).max(100_000).optional(),
    type: z.enum(["link", "ask", "show"]).optional(),
  })
  .refine((data) => data.url != null || data.body != null, {
    message: "At least one of url or body must be provided",
  })
  .refine(
    (data) => {
      const bodyLinks = data.body ? countLinks(data.body) : 0;
      const urlCount = data.url ? 1 : 0;
      return bodyLinks + urlCount <= MAX_LINKS_IN_TEXT;
    },
    {
      message: `At most ${MAX_LINKS_IN_TEXT} links allowed per post (url + links in body)`,
    },
  );
export type CreatePostInput = z.infer<typeof createPostSchema>;

export const listPostsQuerySchema = z.object({
  sort: z.enum(["top", "new", "discussed"]).optional().default("top"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  type: z.enum(["ask", "show"]).optional(),
});
export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;

export const listPostsCursorQuerySchema = z
  .object({
    sort: z.enum(["top", "new", "discussed"]).optional().default("top"),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    type: z.enum(["ask", "show"]).optional(),
    after: z.string().optional(),
    before: z.string().optional(),
  })
  .refine((data) => !(data.after && data.before), {
    message: "Use either `after` or `before`, not both.",
  });
export type ListPostsCursorQuery = z.infer<typeof listPostsCursorQuerySchema>;
