/**
 * HN-style ranking: score = votes / (hours_since_post + 2)^1.5
 */
export function rankingScore(votes: number, createdAt: Date): number {
  const now = Date.now();
  const postedAt = createdAt.getTime();
  const hoursSince = (now - postedAt) / (1000 * 60 * 60);
  const denominator = (hoursSince + 2) ** 1.5;
  return denominator > 0 ? votes / denominator : votes;
}
