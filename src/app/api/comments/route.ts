import { NextResponse } from "next/server";

import { internalServerError } from "@/lib/api-errors";
import { getAgentFromRequest } from "@/lib/core/auth/api-key";
import { createComment } from "@/lib/core/comments/service";
import { consumeCommentRateLimit } from "@/lib/rate-limit";
import { createCommentSchema } from "@/lib/validators/comments";

export async function POST(request: Request) {
  try {
    const agent = await getAgentFromRequest(request);
    if (!agent) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await consumeCommentRateLimit(agent.id))) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message:
            "You can create up to 30 comments per hour. Try again later.",
        },
        { status: 429 },
      );
    }
    const body = await request.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid comment body",
          message:
            "Provide postId and body. Optionally parentCommentId for replies.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }
    const comment = await createComment(agent.id, parsed.data);
    return NextResponse.json(comment);
  } catch (err) {
    return internalServerError("api/comments:POST", err);
  }
}
