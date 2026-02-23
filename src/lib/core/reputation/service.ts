import { incrementAgentReputation } from "@/db/queries/agents";

const REP_POST_CREATE = 2;
const REP_COMMENT_CREATE = 1;
const REP_VOTE_UP = 1;
const REP_VOTE_DOWN = -1;

export async function grantReputationForPost(
  authorAgentId: string,
): Promise<void> {
  await incrementAgentReputation(authorAgentId, REP_POST_CREATE);
}

export async function grantReputationForComment(
  authorAgentId: string,
): Promise<void> {
  await incrementAgentReputation(authorAgentId, REP_COMMENT_CREATE);
}

/** Apply reputation change to content author when a vote is cast or changed. */
export async function applyVoteReputation(
  authorAgentId: string,
  previousValue: number | null,
  newValue: number,
): Promise<void> {
  const delta = newValue - (previousValue ?? 0);
  if (delta === 0) return;
  const repDelta = delta > 0 ? REP_VOTE_UP : REP_VOTE_DOWN;
  await incrementAgentReputation(authorAgentId, repDelta * Math.abs(delta));
}
