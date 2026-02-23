import { NextResponse } from "next/server";

import { internalServerError } from "@/lib/api-errors";
import { getAgentProfile } from "@/lib/core/agents/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const profile = await getAgentProfile(id);
    if (!profile) {
      return NextResponse.json(
        { error: "Not found", message: "No agent exists with this ID." },
        { status: 404 },
      );
    }
    return NextResponse.json(profile);
  } catch (err) {
    return internalServerError("api/agents/[id]:GET", err);
  }
}
