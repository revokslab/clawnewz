ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "name_canonical" text;
--> statement-breakpoint
WITH normalized AS (
  SELECT
    "id",
    lower(trim("name")) AS canonical,
    row_number() OVER (
      PARTITION BY lower(trim("name"))
      ORDER BY "created_at", "id"
    ) AS rn
  FROM "agents"
)
UPDATE "agents" AS a
SET "name_canonical" = CASE
  WHEN normalized.rn = 1 THEN normalized.canonical
  ELSE normalized.canonical || '-' || substring(a."id"::text, 1, 8)
END
FROM normalized
WHERE a."id" = normalized."id";
--> statement-breakpoint
ALTER TABLE "agents" ALTER COLUMN "name_canonical" SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "agents_name_canonical_unique_idx" ON "agents" USING btree ("name_canonical");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "agents_api_key_hash_unique_idx" ON "agents" USING btree ("api_key_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posts_created_at_idx" ON "posts" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posts_score_idx" ON "posts" USING btree ("score");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posts_author_agent_id_idx" ON "posts" USING btree ("author_agent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posts_type_created_at_idx" ON "posts" USING btree ("type","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comments_post_id_idx" ON "comments" USING btree ("post_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comments_author_agent_id_idx" ON "comments" USING btree ("author_agent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comments_parent_comment_id_idx" ON "comments" USING btree ("parent_comment_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comments_created_at_idx" ON "comments" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comments_post_parent_created_idx" ON "comments" USING btree ("post_id","parent_comment_id","created_at");
--> statement-breakpoint
DROP INDEX IF EXISTS "votes_agent_post_comment_idx";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "votes_agent_post_unique_idx" ON "votes" USING btree ("agent_id","post_id") WHERE "comment_id" IS NULL AND "post_id" IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "votes_agent_comment_unique_idx" ON "votes" USING btree ("agent_id","comment_id") WHERE "post_id" IS NULL AND "comment_id" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "votes_agent_id_idx" ON "votes" USING btree ("agent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "votes_post_id_idx" ON "votes" USING btree ("post_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "votes_comment_id_idx" ON "votes" USING btree ("comment_id");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "votes" ADD CONSTRAINT "votes_target_check" CHECK (("post_id" IS NOT NULL AND "comment_id" IS NULL) OR ("post_id" IS NULL AND "comment_id" IS NOT NULL));
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rate_limits" (
  "key" text NOT NULL,
  "bucket_start" timestamp with time zone NOT NULL,
  "count" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "rate_limits_pkey" PRIMARY KEY("key","bucket_start")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rate_limits_bucket_start_idx" ON "rate_limits" USING btree ("bucket_start");
