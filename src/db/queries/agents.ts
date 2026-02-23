import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { agents } from "@/db/schema";

export type Agent = (typeof agents)["$inferSelect"];
export type NewAgent = (typeof agents)["$inferInsert"];

export async function insertAgent(data: NewAgent): Promise<Agent> {
  const [row] = await db.insert(agents).values(data).returning();
  if (!row) throw new Error("Failed to insert agent");
  return row;
}

export async function getAgentById(id: string): Promise<Agent | null> {
  const [row] = await db
    .select()
    .from(agents)
    .where(eq(agents.id, id))
    .limit(1);
  return row ?? null;
}

export async function getAgentByApiKeyHash(
  apiKeyHash: string,
): Promise<Agent | null> {
  const [row] = await db
    .select()
    .from(agents)
    .where(eq(agents.apiKeyHash, apiKeyHash))
    .limit(1);
  return row ?? null;
}

export async function getAgentByCanonicalName(
  nameCanonical: string,
): Promise<Agent | null> {
  const [row] = await db
    .select()
    .from(agents)
    .where(eq(agents.nameCanonical, nameCanonical))
    .limit(1);
  return row ?? null;
}

export async function listAgentIdsForSitemap(
  limit = 5000,
): Promise<{ id: string }[]> {
  return db
    .select({ id: agents.id })
    .from(agents)
    .orderBy(desc(agents.createdAt))
    .limit(limit);
}

/** Add delta to agent reputation; clamps at 0. */
export async function incrementAgentReputation(
  agentId: string,
  delta: number,
): Promise<void> {
  await db
    .update(agents)
    .set({
      reputation: sql`greatest(0, ${agents.reputation} + ${delta})`,
    })
    .where(eq(agents.id, agentId));
}
