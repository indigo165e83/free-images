-- AlterTable: Add slug column (nullable initially to handle existing rows)
ALTER TABLE "Tag" ADD COLUMN "slug" TEXT;

-- Step 1: Set slug = id for all rows (guaranteed unique as a safe starting point)
UPDATE "Tag" SET "slug" = "id";

-- Step 2: Try to update to nameEn-based slug, but ONLY for rows where
--         the generated slug is unique across all rows (no conflicts at all).
--         Rows that would produce a duplicate slug keep their id-based slug.
WITH slug_candidates AS (
  SELECT
    "id",
    LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE("nameEn", '[^a-zA-Z0-9\s\-]', '', 'g'),
          '\s+', '-', 'g'
        ),
        '^-+|-+$', '', 'g'
      )
    ) AS candidate_slug
  FROM "Tag"
),
unique_slugs AS (
  -- Only slugs that appear exactly once among all candidates are safe to use
  SELECT candidate_slug
  FROM slug_candidates
  WHERE candidate_slug != ''
  GROUP BY candidate_slug
  HAVING COUNT(*) = 1
)
UPDATE "Tag"
SET "slug" = sc.candidate_slug
FROM slug_candidates sc
JOIN unique_slugs us ON sc.candidate_slug = us.candidate_slug
WHERE "Tag"."id" = sc."id";

-- Make slug NOT NULL
ALTER TABLE "Tag" ALTER COLUMN "slug" SET NOT NULL;

-- Add unique index
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");
