ALTER TABLE "word_kana" ADD COLUMN "tags" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "word_kana" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "word_kanji" ADD COLUMN "tags" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "word_kanji" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "words" DROP COLUMN "has_kanji";--> statement-breakpoint
ALTER TABLE "words" DROP COLUMN "primary_writing";--> statement-breakpoint
ALTER TABLE "words" DROP COLUMN "primary_reading";