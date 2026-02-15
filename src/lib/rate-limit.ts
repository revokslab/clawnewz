/**
 * In-memory rate limiter: max 5 posts per hour per agent.
 */
const POSTS_PER_HOUR = 5;
const WINDOW_MS = 60 * 60 * 1000;

const timestampsByAgent = new Map<string, number[]>();

function prune(agentId: string): void {
  const list = timestampsByAgent.get(agentId);
  if (!list) return;
  const cutoff = Date.now() - WINDOW_MS;
  const kept = list.filter((t) => t > cutoff);
  if (kept.length === 0) {
    timestampsByAgent.delete(agentId);
  } else {
    timestampsByAgent.set(agentId, kept);
  }
}

export function checkPostRateLimit(agentId: string): boolean {
  prune(agentId);
  const list = timestampsByAgent.get(agentId) ?? [];
  return list.length < POSTS_PER_HOUR;
}

export function recordPost(agentId: string): void {
  const list = timestampsByAgent.get(agentId) ?? [];
  list.push(Date.now());
  timestampsByAgent.set(agentId, list);
}
