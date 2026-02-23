import { sql } from "drizzle-orm";

import { db } from "@/db";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Limits: [posts, comments, votes, registration-by-IP]
const POSTS_PER_HOUR = 5;
const COMMENTS_PER_HOUR = 30;
const VOTES_PER_HOUR = 100;
const REGISTRATIONS_PER_HOUR_PER_IP = 5;

function floorToBucket(date: Date, windowMs: number): Date {
  const ms = Math.floor(date.getTime() / windowMs) * windowMs;
  return new Date(ms);
}

async function consumeLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const now = new Date();
  const bucketStart = floorToBucket(now, windowMs);

  const result = await db.execute<{ count: number }>(sql`
    INSERT INTO rate_limits ("key", "bucket_start", "count")
    VALUES (${key}, ${bucketStart}, 1)
    ON CONFLICT ("key", "bucket_start")
    DO UPDATE SET "count" = rate_limits."count" + 1
    RETURNING "count"
  `);
  const current = result.rows[0]?.count ?? 0;

  // Lightweight periodic cleanup for old buckets.
  if (Math.random() < 0.01) {
    const cutoff = new Date(now.getTime() - windowMs * 2);
    void db.execute(
      sql`DELETE FROM rate_limits WHERE "bucket_start" < ${cutoff}`,
    );
  }

  return current <= limit;
}

function sanitizeIp(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  if (!first) return null;
  return first.slice(0, 64);
}

/**
 * Prefer trusted platform headers. `x-forwarded-for` is used only as a local/dev fallback.
 */
export function getClientIp(request: Request): string {
  const trusted =
    sanitizeIp(request.headers.get("x-vercel-ip")) ??
    sanitizeIp(request.headers.get("cf-connecting-ip")) ??
    sanitizeIp(request.headers.get("fly-client-ip")) ??
    sanitizeIp(request.headers.get("x-real-ip"));
  if (trusted) return trusted;

  if (process.env.NODE_ENV !== "production") {
    return sanitizeIp(request.headers.get("x-forwarded-for")) ?? "unknown";
  }
  return "unknown";
}

// --- Posts (per agent) ---
export async function consumePostRateLimit(agentId: string): Promise<boolean> {
  return consumeLimit(`post:${agentId}`, POSTS_PER_HOUR, WINDOW_MS);
}

// --- Comments (per agent) ---
export async function consumeCommentRateLimit(
  agentId: string,
): Promise<boolean> {
  return consumeLimit(`comment:${agentId}`, COMMENTS_PER_HOUR, WINDOW_MS);
}

// --- Votes (per agent) ---
export async function consumeVoteRateLimit(agentId: string): Promise<boolean> {
  return consumeLimit(`vote:${agentId}`, VOTES_PER_HOUR, WINDOW_MS);
}

// --- Registration (per IP) ---
export async function consumeRegistrationRateLimitByIp(
  ip: string,
): Promise<boolean> {
  return consumeLimit(`reg:${ip}`, REGISTRATIONS_PER_HOUR_PER_IP, WINDOW_MS);
}
