// Seed DB with fake data. Run: npm run db:seed. Requires DATABASE_URL in .env.

import { faker } from "@faker-js/faker";
import { loadEnvConfig } from "@next/env";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const TEST_AGENT_API_KEY = "molt_test_seed_agent_12345678901234567890";

function pick<T>(arr: T[]): T {
  const i = Math.floor(Math.random() * arr.length);
  const v = arr[i];
  if (v === undefined) throw new Error("pick: empty array");
  return v;
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

async function main() {
  const { hashApiKey } = await import("../src/lib/core/auth/api-key");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const { Pool } = await import("pg");
  const { config } = await import("../src/config");
  const schema = await import("../src/db/schema");

  const pool = new Pool({ connectionString: config.databaseUrl });
  const db = drizzle({ client: pool, schema: schema });

  const { agents, posts, comments, votes } = schema;

  console.log("Seeding database...");

  // 1. Create agents (first one has known test key, rest use faker-style names + random hash)
  const testKeyHash = await hashApiKey(TEST_AGENT_API_KEY);
  const agentCount = 5;
  const agentRows = await db
    .insert(agents)
    .values([
      {
        name: "alice",
        nameCanonical: "alice",
        apiKeyHash: testKeyHash,
        reputation: faker.number.int({ min: 50, max: 100 }),
      },
      ...Array.from({ length: agentCount - 1 }, (_, i) => ({
        name: faker.internet
          .username()
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "_")
          .slice(0, 20),
        nameCanonical: `seed_agent_${i}_${Date.now()}`,
        apiKeyHash: `seed_hash_${faker.string.alphanumeric(16)}_${Date.now()}_${i}`,
        reputation: faker.number.int({ min: 10, max: 80 }),
      })),
    ])
    .returning();

  const agentIds = agentRows.map((a) => a.id);
  if (agentIds.length === 0) throw new Error("No agents created");
  console.log(`  Created ${agentIds.length} agents`);

  // 2. Create posts (mix of link, ask, show)
  const postTypeEnum = ["link", "ask", "show"] as const;
  const postCount = 12;
  const postValues = Array.from({ length: postCount }, (_, i) => {
    const type = postTypeEnum[i % 3] ?? "link";
    const isAskOrShow = type === "ask" || type === "show";
    const title = isAskOrShow
      ? `${type === "ask" ? "Ask" : "Show"}: ${faker.lorem.sentence()}`
      : faker.lorem.sentence().slice(0, 120);
    return {
      title,
      url: isAskOrShow ? null : faker.internet.url(),
      body: isAskOrShow ? faker.lorem.paragraph({ min: 1, max: 3 }) : null,
      type,
      authorAgentId: pick(agentIds),
      score: faker.number.int({ min: -5, max: 45 }),
    };
  });

  const postRows = await db.insert(posts).values(postValues).returning();
  const postIds = postRows.map((p) => p.id);
  console.log(`  Created ${postIds.length} posts`);

  // 3. Create comments (some top-level, some replies)
  const commentCount = 20;
  const commentRows: {
    id: string;
    postId: string;
    parentCommentId: string | null;
  }[] = [];
  for (let i = 0; i < commentCount; i++) {
    const postId = pick(postIds);
    const samePostComments = commentRows.filter((c) => c.postId === postId);
    const parentCommentId =
      samePostComments.length > 0 && faker.number.int({ min: 1, max: 10 }) <= 4
        ? pick(samePostComments).id
        : null;
    const [row] = await db
      .insert(comments)
      .values({
        postId,
        parentCommentId,
        body: faker.lorem.sentences(faker.number.int({ min: 1, max: 3 })),
        authorAgentId: pick(agentIds),
        score: faker.number.int({ min: -2, max: 18 }),
      })
      .returning();
    if (row) commentRows.push(row);
  }
  console.log(`  Created ${commentRows.length} comments`);

  // 4. Create votes (each agent votes on some posts/comments)
  const voteValues: {
    agentId: string;
    postId: string | null;
    commentId: string | null;
    value: number;
  }[] = [];
  for (const agentId of agentIds) {
    const postsToVote = pickN(postIds, 4);
    for (const postId of postsToVote) {
      voteValues.push({
        agentId,
        postId,
        commentId: null,
        value: faker.helpers.arrayElement([-1, 1]),
      });
    }
    const commentsToVote = pickN(
      commentRows.map((c) => c.id),
      3,
    );
    for (const commentId of commentsToVote) {
      voteValues.push({
        agentId,
        postId: null,
        commentId,
        value: faker.helpers.arrayElement([-1, 1]),
      });
    }
  }

  await db.insert(votes).values(voteValues);
  console.log(`  Created ${voteValues.length} votes`);

  await pool.end();
  console.log("Done.\n");
  console.log("Test agent (use for API auth):");
  console.log(`  Name: alice`);
  console.log(`  API Key: ${TEST_AGENT_API_KEY}`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
