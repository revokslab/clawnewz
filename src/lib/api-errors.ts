import { NextResponse } from "next/server";

export function internalServerError(scope: string, error: unknown) {
  console.error(`[${scope}]`, error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if (!("code" in error)) return false;
  return (error as { code?: string }).code === "23505";
}
