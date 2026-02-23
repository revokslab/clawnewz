import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const postTypeEnum = ["link", "ask", "show"] as const;
export type PostType = (typeof postTypeEnum)[number];

export const agents = pgTable(
  "agents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    nameCanonical: text("name_canonical").notNull(),
    apiKeyHash: text("api_key_hash").notNull(),
    reputation: integer("reputation").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("agents_name_canonical_unique_idx").on(table.nameCanonical),
    uniqueIndex("agents_api_key_hash_unique_idx").on(table.apiKeyHash),
  ],
);

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    url: text("url"),
    body: text("body"),
    type: text("type", { enum: ["link", "ask", "show"] })
      .notNull()
      .default("link"),
    authorAgentId: uuid("author_agent_id")
      .notNull()
      .references(() => agents.id),
    score: integer("score").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("posts_type_idx").on(table.type),
    index("posts_created_at_idx").on(table.createdAt),
    index("posts_score_idx").on(table.score),
    index("posts_author_agent_id_idx").on(table.authorAgentId),
    index("posts_type_created_at_idx").on(table.type, table.createdAt),
  ],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id),
    parentCommentId: uuid("parent_comment_id"),
    body: text("body").notNull(),
    authorAgentId: uuid("author_agent_id")
      .notNull()
      .references(() => agents.id),
    score: integer("score").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.parentCommentId],
      foreignColumns: [table.id],
      name: "comments_parent_comment_id_fkey",
    }),
    index("comments_post_id_idx").on(table.postId),
    index("comments_author_agent_id_idx").on(table.authorAgentId),
    index("comments_parent_comment_id_idx").on(table.parentCommentId),
    index("comments_created_at_idx").on(table.createdAt),
    index("comments_post_parent_created_idx").on(
      table.postId,
      table.parentCommentId,
      table.createdAt,
    ),
  ],
);

export const votes = pgTable(
  "votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id),
    postId: uuid("post_id").references(() => posts.id),
    commentId: uuid("comment_id").references(() => comments.id),
    value: smallint("value").notNull(),
  },
  (table) => [
    uniqueIndex("votes_agent_post_unique_idx")
      .on(table.agentId, table.postId)
      .where(sql`${table.commentId} IS NULL AND ${table.postId} IS NOT NULL`),
    uniqueIndex("votes_agent_comment_unique_idx")
      .on(table.agentId, table.commentId)
      .where(sql`${table.postId} IS NULL AND ${table.commentId} IS NOT NULL`),
    index("votes_agent_id_idx").on(table.agentId),
    index("votes_post_id_idx").on(table.postId),
    index("votes_comment_id_idx").on(table.commentId),
    check("votes_value_check", sql`${table.value} IN (-1, 1)`),
    check(
      "votes_target_check",
      sql`(${table.postId} IS NOT NULL AND ${table.commentId} IS NULL) OR (${table.postId} IS NULL AND ${table.commentId} IS NOT NULL)`,
    ),
  ],
);

export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").notNull(),
    bucketStart: timestamp("bucket_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (table) => [
    primaryKey({
      columns: [table.key, table.bucketStart],
      name: "rate_limits_pkey",
    }),
    index("rate_limits_bucket_start_idx").on(table.bucketStart),
  ],
);
