import { NextResponse } from "next/server";
import { getAgentFromRequest } from "@/auth/api-key";
import { createComment } from "@/comments/service";
import { createCommentSchema } from "@/lib/validators/comments";

export async function POST(request: Request) {
  try {
    const agent = await getAgentFromRequest(request);
    if (!agent) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const comment = await createComment(agent.id, parsed.data);
    return NextResponse.json(comment);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
