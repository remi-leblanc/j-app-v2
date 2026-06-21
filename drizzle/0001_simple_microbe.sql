ALTER TABLE "word_jlpt" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "word_jlpt" CASCADE;--> statement-breakpoint
DROP INDEX "word_pos_category_idx";--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "primary_writing" text NOT NULL;--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "primary_reading" text NOT NULL;--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "categories" "word_category"[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "jlpt_level" "jlpt_level";--> statement-breakpoint
CREATE INDEX "word_glosses_sense_lang_idx" ON "word_glosses" USING btree ("sense_id","lang");--> statement-breakpoint
CREATE INDEX "words_categories_idx" ON "words" USING gin ("categories");--> statement-breakpoint
CREATE INDEX "words_jlpt_level_idx" ON "words" USING btree ("jlpt_level");--> statement-breakpoint
ALTER TABLE "word_pos" DROP COLUMN "category";