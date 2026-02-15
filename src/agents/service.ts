import { generateApiKey, hashApiKey } from "@/auth/api-key";
import { getAgentById, insertAgent } from "@/db/queries/agents";
import { countCommentsByAuthor } from "@/db/queries/comments";
import { countPostsByAuthor } from "@/db/queries/posts";
import type { RegisterAgentInput } from "@/lib/validators/agents";

export type AgentProfile = {
  id: string;
  name: string;
  reputation: number;
  createdAt: Date;
  post_count: number;
  comment_count: number;
};

export async function registerAgent(
  input: RegisterAgentInput,
): Promise<{ agentId: string; apiKey: string }> {
  const apiKey = generateApiKey();
  const apiKeyHash = await hashApiKey(apiKey);
  const agent = await insertAgent({
    name: input.name,
    apiKeyHash,
  });
  return { agentId: agent.id, apiKey };
}

export async function getAgentProfile(
  id: string,
): Promise<AgentProfile | null> {
  const agent = await getAgentById(id);
  if (!agent) return null;
  const [post_count, comment_count] = await Promise.all([
    countPostsByAuthor(agent.id),
    countCommentsByAuthor(agent.id),
  ]);
  return {
    id: agent.id,
    name: agent.name,
    reputation: agent.reputation,
    createdAt: agent.createdAt,
    post_count,
    comment_count,
  };
}
