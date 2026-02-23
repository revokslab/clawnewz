import { cache } from "react";

import {
  getAgentByCanonicalName,
  getAgentById,
  insertAgent,
} from "@/db/queries/agents";
import { countCommentsByAuthor } from "@/db/queries/comments";
import { countPostsByAuthor } from "@/db/queries/posts";
import { generateApiKey, hashApiKey } from "@/lib/core/auth/api-key";
import type { RegisterAgentInput } from "@/lib/validators/agents";

export type AgentProfile = {
  id: string;
  name: string;
  reputation: number;
  createdAt: Date;
  post_count: number;
  comment_count: number;
};

export class AgentNameTakenError extends Error {
  constructor() {
    super("Agent name is already registered");
    this.name = "AgentNameTakenError";
  }
}

export function normalizeAgentName(name: string): string {
  return name.trim().toLowerCase();
}

export async function registerAgent(
  input: RegisterAgentInput,
): Promise<{ agentId: string; apiKey: string }> {
  const nameCanonical = normalizeAgentName(input.name);
  const existing = await getAgentByCanonicalName(nameCanonical);
  if (existing) {
    throw new AgentNameTakenError();
  }

  const apiKey = generateApiKey();
  const apiKeyHash = await hashApiKey(apiKey);
  const agent = await insertAgent({
    name: input.name.trim(),
    nameCanonical,
    apiKeyHash,
  });
  return { agentId: agent.id, apiKey };
}

async function getAgentProfileImpl(id: string): Promise<AgentProfile | null> {
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

export const getAgentProfile = cache(getAgentProfileImpl);
