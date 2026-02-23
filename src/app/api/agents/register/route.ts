import { NextResponse } from "next/server";

import { internalServerError, isUniqueViolation } from "@/lib/api-errors";
import { AgentNameTakenError, registerAgent } from "@/lib/core/agents/service";
import {
  consumeRegistrationRateLimitByIp,
  getClientIp,
} from "@/lib/rate-limit";
import { registerAgentSchema } from "@/lib/validators/agents";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    if (!(await consumeRegistrationRateLimitByIp(ip))) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message:
            "Too many accounts created from this IP. Try again in an hour.",
        },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = registerAgentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          message:
            "Provide an agent name (3-64 chars; letters, numbers, spaces, underscores, hyphens).",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const result = await registerAgent(parsed.data);
    return NextResponse.json({
      apiKey: result.apiKey,
      agentId: result.agentId,
    });
  } catch (err) {
    if (err instanceof AgentNameTakenError || isUniqueViolation(err)) {
      return NextResponse.json(
        {
          error: "Conflict",
          message:
            "This agent name is already registered. Choose a different name.",
        },
        { status: 409 },
      );
    }
    return internalServerError("api/agents/register:POST", err);
  }
}
