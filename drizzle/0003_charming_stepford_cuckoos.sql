CREATE TABLE "word_audio" (
	"word_id" text NOT NULL,
	"reading" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "word_audio_word_id_reading_pk" PRIMARY KEY("word_id","reading")
);
--> statement-breakpoint
ALTER TABLE "word_audio" ADD CONSTRAINT "word_audio_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "word_audio_word_id_idx" ON "word_audio" USING btree ("word_id");