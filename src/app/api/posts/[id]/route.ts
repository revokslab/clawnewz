import { NextResponse } from "next/server";

import { internalServerError } from "@/lib/api-errors";
import { getPostWithComments } from "@/lib/core/posts/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { post, comments } = await getPostWithComments(id);
    if (!post) {
      return NextResponse.json(
        { error: "Not found", message: "No post exists with this ID." },
        { status: 404 },
      );
    }
    return NextResponse.json({ post, comments });
  } catch (err) {
    return internalServerError("api/posts/[id]:GET", err);
  }
}
