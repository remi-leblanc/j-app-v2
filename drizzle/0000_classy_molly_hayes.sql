CREATE TYPE "public"."jlpt_level" AS ENUM('n1', 'n2', 'n3', 'n4', 'n5');--> statement-breakpoint
CREATE TYPE "public"."word_category" AS ENUM('nom', 'verbe', 'adjectif', 'adverbe', 'autre');--> statement-breakpoint
CREATE TABLE "word_glosses" (
	"id" serial PRIMARY KEY NOT NULL,
	"sense_id" integer NOT NULL,
	"lang" text NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "word_kana" (
	"id" serial PRIMARY KEY NOT NULL,
	"word_id" text NOT NULL,
	"text" text NOT NULL,
	"common" boolean DEFAULT false NOT NULL,
	"applies_to_kanji" text[] DEFAULT '{}' NOT NULL,
	CONSTRAINT "word_kana_word_id_text_unique" UNIQUE("word_id","text")
);
--> statement-breakpoint
CREATE TABLE "word_kanji" (
	"id" serial PRIMARY KEY NOT NULL,
	"word_id" text NOT NULL,
	"text" text NOT NULL,
	"common" boolean DEFAULT false NOT NULL,
	CONSTRAINT "word_kanji_word_id_text_unique" UNIQUE("word_id","text")
);
--> statement-breakpoint
CREATE TABLE "word_pos" (
	"id" serial PRIMARY KEY NOT NULL,
	"sense_id" integer NOT NULL,
	"value" text NOT NULL,
	CONSTRAINT "word_pos_sense_id_value_unique" UNIQUE("sense_id","value")
);
--> statement-breakpoint
CREATE TABLE "word_senses" (
	"id" serial PRIMARY KEY NOT NULL,
	"word_id" text NOT NULL,
	"position" integer NOT NULL,
	"field" text[] DEFAULT '{}' NOT NULL,
	"misc" text[] DEFAULT '{}' NOT NULL,
	CONSTRAINT "word_senses_word_id_position_unique" UNIQUE("word_id","position")
);
--> statement-breakpoint
CREATE TABLE "words" (
	"id" text PRIMARY KEY NOT NULL,
	"has_kanji" boolean NOT NULL,
	"primary_writing" text NOT NULL,
	"primary_reading" text NOT NULL,
	"categories" "word_category"[] DEFAULT '{}' NOT NULL,
	"jlpt_level" "jlpt_level",
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "word_glosses" ADD CONSTRAINT "word_glosses_sense_id_word_senses_id_fk" FOREIGN KEY ("sense_id") REFERENCES "public"."word_senses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "word_kana" ADD CONSTRAINT "word_kana_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "word_kanji" ADD CONSTRAINT "word_kanji_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "word_pos" ADD CONSTRAINT "word_pos_sense_id_word_senses_id_fk" FOREIGN KEY ("sense_id") REFERENCES "public"."word_senses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "word_senses" ADD CONSTRAINT "word_senses_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "word_glosses_sense_id_idx" ON "word_glosses" USING btree ("sense_id");--> statement-breakpoint
CREATE INDEX "word_glosses_sense_lang_idx" ON "word_glosses" USING btree ("sense_id","lang");--> statement-breakpoint
CREATE INDEX "word_kana_word_id_idx" ON "word_kana" USING btree ("word_id");--> statement-breakpoint
CREATE INDEX "word_kanji_word_id_idx" ON "word_kanji" USING btree ("word_id");--> statement-breakpoint
CREATE INDEX "word_pos_sense_id_idx" ON "word_pos" USING btree ("sense_id");--> statement-breakpoint
CREATE INDEX "word_senses_word_id_idx" ON "word_senses" USING btree ("word_id");--> statement-breakpoint
CREATE INDEX "words_categories_idx" ON "words" USING gin ("categories");--> statement-breakpoint
CREATE INDEX "words_jlpt_level_idx" ON "words" USING btree ("jlpt_level");