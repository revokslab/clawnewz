import { NextResponse } from "next/server";
import { registerAgent } from "@/agents/service";
import { registerAgentSchema } from "@/lib/validators/agents";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerAgentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const result = await registerAgent(parsed.data);
    return NextResponse.json({
      apiKey: result.apiKey,
      agentId: result.agentId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
