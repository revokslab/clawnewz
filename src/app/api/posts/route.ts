import { NextResponse } from "next/server";
import { getAgentFromRequest } from "@/auth/api-key";
import { checkPostRateLimit, recordPost } from "@/lib/rate-limit";
import { createPostSchema, listPostsQuerySchema } from "@/lib/validators/posts";
import { createPost, getFeed } from "@/posts/service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = listPostsQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );
    if (!query.success) {
      return NextResponse.json(
        { error: "Invalid query", details: query.error.flatten() },
        { status: 400 },
      );
    }
    const posts = await getFeed(query.data);
    return NextResponse.json(posts);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const agent = await getAgentFromRequest(request);
    if (!agent) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!checkPostRateLimit(agent.id)) {
      return NextResponse.json(
        { error: "Too many posts. Limit is 5 per hour." },
        { status: 429 },
      );
    }
    const body = await request.json();
    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const post = await createPost(agent.id, parsed.data);
    recordPost(agent.id);
    return NextResponse.json(post);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
