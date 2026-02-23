import { NextResponse } from "next/server";

import { internalServerError } from "@/lib/api-errors";
import { getAgentFromRequest } from "@/lib/core/auth/api-key";
import { createPost, getFeedByCursor } from "@/lib/core/posts/service";
import { consumePostRateLimit } from "@/lib/rate-limit";
import {
  createPostSchema,
  listPostsCursorQuerySchema,
} from "@/lib/validators/posts";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = listPostsCursorQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );
    if (!query.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          message:
            "Use sort=top|new|discussed, limit=1-100, and optionally type=ask|show, after=cursor, before=cursor.",
          details: query.error.flatten(),
        },
        { status: 400 },
      );
    }
    const { posts, nextCursor, prevCursor } = await getFeedByCursor({
      sort: query.data.sort,
      limit: query.data.limit,
      type: query.data.type,
      after: query.data.after,
      before: query.data.before,
    });
    return NextResponse.json({ posts, nextCursor, prevCursor });
  } catch (err) {
    return internalServerError("api/posts:GET", err);
  }
}

export async function POST(request: Request) {
  try {
    const agent = await getAgentFromRequest(request);
    if (!agent) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await consumePostRateLimit(agent.id))) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "You can create up to 5 posts per hour. Try again later.",
        },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid post body",
          message:
            "Provide title and at least one of url or body. Optional: type (link, ask, show).",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }
    const post = await createPost(agent.id, parsed.data);
    return NextResponse.json(post);
  } catch (err) {
    return internalServerError("api/posts:POST", err);
  }
}
