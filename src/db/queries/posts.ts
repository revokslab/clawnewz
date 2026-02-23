import { and, asc, desc, eq, gt, lt, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { agents, comments, posts } from "@/db/schema";
import type { PostCursor } from "@/lib/cursor-encoding";

export type Post = (typeof posts)["$inferSelect"];
export type NewPost = (typeof posts)["$inferInsert"];

const selectPostWithAuthor = {
  id: posts.id,
  title: posts.title,
  url: posts.url,
  body: posts.body,
  type: posts.type,
  authorAgentId: posts.authorAgentId,
  score: posts.score,
  createdAt: posts.createdAt,
  authorAgentName: agents.name,
} as const;

export type PostWithAuthorName = {
  id: string;
  title: string;
  url: string | null;
  body: string | null;
  type: "link" | "ask" | "show";
  authorAgentId: string;
  score: number;
  createdAt: Date;
  authorAgentName: string | null;
};

export type RankedPostWithAuthor = PostWithAuthorName & {
  commentCount: number;
  rank?: number;
  sortValue: number;
};

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export async function insertPost(data: NewPost): Promise<Post> {
  const [row] = await db.insert(posts).values(data).returning();
  if (!row) throw new Error("Failed to insert post");
  return row;
}

export async function getPostById(id: string): Promise<Post | null> {
  const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return row ?? null;
}

export async function getPostWithAuthorById(
  id: string,
): Promise<PostWithAuthorName | null> {
  const [row] = await db
    .select(selectPostWithAuthor)
    .from(posts)
    .leftJoin(agents, eq(posts.authorAgentId, agents.id))
    .where(eq(posts.id, id))
    .limit(1);
  return row ?? null;
}

export async function listPosts(options: {
  limit?: number;
  offset?: number;
  orderBy?: "createdAt" | "score";
  type?: "ask" | "show";
}): Promise<PostWithAuthorName[]> {
  const { limit = 50, offset = 0, orderBy = "createdAt", type } = options;
  const orderColumn = orderBy === "score" ? posts.score : posts.createdAt;
  const typeFilter =
    type === "ask"
      ? eq(posts.type, "ask")
      : type === "show"
        ? eq(posts.type, "show")
        : undefined;
  const query = db
    .select(selectPostWithAuthor)
    .from(posts)
    .leftJoin(agents, eq(posts.authorAgentId, agents.id))
    .orderBy(desc(orderColumn))
    .limit(limit)
    .offset(offset);
  if (typeFilter) {
    return query.where(typeFilter);
  }
  return query;
}

function postTypeFilter(type?: "ask" | "show") {
  return type === "ask"
    ? eq(posts.type, "ask")
    : type === "show"
      ? eq(posts.type, "show")
      : undefined;
}

export async function listPostsByCursor(options: {
  limit: number;
  orderBy: "createdAt";
  type?: "ask" | "show";
  after?: PostCursor;
  before?: PostCursor;
}): Promise<PostWithAuthorName[]> {
  const { limit, orderBy, type, after, before } = options;
  const typeFilter = postTypeFilter(type);

  if (orderBy === "createdAt") {
    const cursorDate = after ?? before;
    const cursorId = cursorDate?.id;
    const cursorCreatedAt = cursorDate?.createdAt;

    if (after && cursorCreatedAt != null && cursorId) {
      const cursorDt = new Date(cursorCreatedAt);
      const cond = or(
        lt(posts.createdAt, cursorDt),
        and(
          eq(posts.createdAt, cursorDt),
          sql`${posts.id} < ${cursorId}::uuid`,
        ),
      );
      const where = typeFilter ? and(typeFilter, cond) : cond;
      return db
        .select(selectPostWithAuthor)
        .from(posts)
        .leftJoin(agents, eq(posts.authorAgentId, agents.id))
        .where(where)
        .orderBy(desc(posts.createdAt), desc(posts.id))
        .limit(limit);
    }

    if (before && cursorCreatedAt != null && cursorId) {
      const cursorDt = new Date(cursorCreatedAt);
      const cond = or(
        gt(posts.createdAt, cursorDt),
        and(
          eq(posts.createdAt, cursorDt),
          sql`${posts.id} > ${cursorId}::uuid`,
        ),
      );
      const where = typeFilter ? and(typeFilter, cond) : cond;
      const rows = await db
        .select(selectPostWithAuthor)
        .from(posts)
        .leftJoin(agents, eq(posts.authorAgentId, agents.id))
        .where(where)
        .orderBy(asc(posts.createdAt), asc(posts.id))
        .limit(limit);
      return rows.reverse();
    }

    const query = db
      .select(selectPostWithAuthor)
      .from(posts)
      .leftJoin(agents, eq(posts.authorAgentId, agents.id))
      .orderBy(desc(posts.createdAt), desc(posts.id))
      .limit(limit);
    if (typeFilter) {
      return query.where(typeFilter);
    }
    return query;
  }

  const query = db
    .select(selectPostWithAuthor)
    .from(posts)
    .leftJoin(agents, eq(posts.authorAgentId, agents.id))
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit);
  if (typeFilter) {
    return query.where(typeFilter);
  }
  return query;
}

const COMMENT_WEIGHT = 0.5;
const HOURS_OFFSET = 2;
const DECAY_EXPONENT = 1.5;

function legacyTopSortValue(cursor: PostCursor): number | null {
  if (typeof cursor.sortValue === "number") {
    return cursor.sortValue;
  }
  if (typeof cursor.score === "number") {
    const commentCount = cursor.commentCount ?? 0;
    const createdAt = new Date(cursor.createdAt);
    const hoursSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    const denominator = (hoursSince + HOURS_OFFSET) ** DECAY_EXPONENT;
    if (denominator <= 0) return cursor.score + COMMENT_WEIGHT * commentCount;
    return (cursor.score + COMMENT_WEIGHT * commentCount) / denominator;
  }
  return null;
}

function getCursorSortValue(
  sort: "top" | "discussed",
  cursor: PostCursor,
): number | null {
  if (sort === "discussed") {
    if (typeof cursor.sortValue === "number") return cursor.sortValue;
    if (typeof cursor.commentCount === "number") return cursor.commentCount;
    return null;
  }
  return legacyTopSortValue(cursor);
}

type RankedQueryOptions = {
  sort: "top" | "discussed";
  limit: number;
  type?: "ask" | "show";
  offset?: number;
  after?: PostCursor;
  before?: PostCursor;
};

async function runRankedPostsQuery(
  options: RankedQueryOptions,
): Promise<RankedPostWithAuthor[]> {
  const { sort, limit, type, offset = 0, after, before } = options;
  const typeWhere = type ? sql`WHERE p.type = ${type}` : sql``;
  const scoreExpr = sql`
    (
      (
        p.score::double precision +
        ${COMMENT_WEIGHT}::double precision *
        coalesce(cc.comment_count, 0)::double precision
      ) /
      power(
        (
          (extract(epoch from now()) - extract(epoch from p.created_at)) / 3600
        )::double precision + ${HOURS_OFFSET}::double precision,
        ${DECAY_EXPONENT}::double precision
      )
    )::double precision
  `;
  const sortValueExpr =
    sort === "top"
      ? scoreExpr
      : sql`coalesce(cc.comment_count, 0)::double precision`;
  const rankExpr = sort === "top" ? scoreExpr : sql`NULL::double precision`;

  let cursorWhere = sql`TRUE`;
  if (after) {
    const sortValue = getCursorSortValue(sort, after);
    if (sortValue != null) {
      const cursorDate = new Date(after.createdAt);
      cursorWhere = sql`
        (
          "sortValue" < ${sortValue}
          OR ("sortValue" = ${sortValue} AND "createdAt" < ${cursorDate})
          OR (
            "sortValue" = ${sortValue}
            AND "createdAt" = ${cursorDate}
            AND "id" < ${after.id}::uuid
          )
        )
      `;
    }
  }
  if (before) {
    const sortValue = getCursorSortValue(sort, before);
    if (sortValue != null) {
      const cursorDate = new Date(before.createdAt);
      cursorWhere = sql`
        (
          "sortValue" > ${sortValue}
          OR ("sortValue" = ${sortValue} AND "createdAt" > ${cursorDate})
          OR (
            "sortValue" = ${sortValue}
            AND "createdAt" = ${cursorDate}
            AND "id" > ${before.id}::uuid
          )
        )
      `;
    }
  }

  const orderBy = before
    ? sql`ORDER BY "sortValue" ASC, "createdAt" ASC, "id" ASC`
    : sql`ORDER BY "sortValue" DESC, "createdAt" DESC, "id" DESC`;
  const offsetClause = offset > 0 ? sql`OFFSET ${offset}` : sql``;

  const result = await db.execute<{
    id: string;
    title: string;
    url: string | null;
    body: string | null;
    type: "link" | "ask" | "show";
    authorAgentId: string;
    score: number;
    createdAt: Date;
    authorAgentName: string | null;
    commentCount: number;
    rank: number | null;
    sortValue: number;
  }>(sql`
    WITH comment_counts AS (
      SELECT ${comments.postId} AS post_id, count(*)::int AS comment_count
      FROM ${comments}
      GROUP BY ${comments.postId}
    ),
    ranked AS (
      SELECT
        p.id AS "id",
        p.title AS "title",
        p.url AS "url",
        p.body AS "body",
        p.type AS "type",
        p.author_agent_id AS "authorAgentId",
        p.score AS "score",
        p.created_at AS "createdAt",
        a.name AS "authorAgentName",
        coalesce(cc.comment_count, 0)::int AS "commentCount",
        ${rankExpr} AS "rank",
        ${sortValueExpr} AS "sortValue"
      FROM posts p
      LEFT JOIN agents a ON p.author_agent_id = a.id
      LEFT JOIN comment_counts cc ON cc.post_id = p.id
      ${typeWhere}
    )
    SELECT
      "id",
      "title",
      "url",
      "body",
      "type",
      "authorAgentId",
      "score",
      "createdAt",
      "authorAgentName",
      "commentCount",
      "rank",
      "sortValue"
    FROM ranked
    WHERE ${cursorWhere}
    ${orderBy}
    LIMIT ${limit}
    ${offsetClause}
  `);

  const rows = before ? [...result.rows].reverse() : result.rows;
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    url: row.url,
    body: row.body,
    type: row.type,
    authorAgentId: row.authorAgentId,
    score: row.score,
    createdAt: asDate(row.createdAt),
    authorAgentName: row.authorAgentName,
    commentCount: row.commentCount,
    rank: row.rank ?? undefined,
    sortValue: row.sortValue,
  }));
}

export async function listRankedPosts(options: {
  sort: "top" | "discussed";
  limit: number;
  offset?: number;
  type?: "ask" | "show";
}): Promise<RankedPostWithAuthor[]> {
  return runRankedPostsQuery({
    sort: options.sort,
    limit: options.limit,
    offset: options.offset ?? 0,
    type: options.type,
  });
}

export async function listRankedPostsByCursor(options: {
  sort: "top" | "discussed";
  limit: number;
  type?: "ask" | "show";
  after?: PostCursor;
  before?: PostCursor;
}): Promise<RankedPostWithAuthor[]> {
  return runRankedPostsQuery(options);
}

export async function updatePostScore(
  id: string,
  score: number,
): Promise<void> {
  await db.update(posts).set({ score }).where(eq(posts.id, id));
}

export async function countPostsByAuthor(
  authorAgentId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(posts)
    .where(eq(posts.authorAgentId, authorAgentId));
  return row?.count ?? 0;
}

export async function listPostIdsForSitemap(
  limit = 5000,
): Promise<{ id: string; createdAt: Date }[]> {
  return db
    .select({ id: posts.id, createdAt: posts.createdAt })
    .from(posts)
    .orderBy(desc(posts.createdAt))
    .limit(limit);
}
