ALTER TABLE "words" ALTER COLUMN "jlpt_level" SET DATA TYPE integer USING (
  CASE "jlpt_level"::text
    WHEN 'n1' THEN 1
    WHEN 'n2' THEN 2
    WHEN 'n3' THEN 3
    WHEN 'n4' THEN 4
    WHEN 'n5' THEN 5
  END
);--> statement-breakpoint
DROP TYPE "public"."jlpt_level";
