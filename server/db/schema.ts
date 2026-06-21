import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
} from "drizzle-orm/pg-core";

export const wordCategoryEnum = pgEnum("word_category", [
	"nom",
	"verbe",
	"adjectif",
	"adverbe",
	"autre",
]);

export const words = pgTable(
	"words",
	{
		id: text("id").primaryKey(),
		categories: wordCategoryEnum("categories").array().notNull().default([]),
		jlptLevel: integer("jlpt_level"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("words_categories_idx").using("gin", table.categories),
		index("words_jlpt_level_idx").on(table.jlptLevel),
	],
);

export const wordKanji = pgTable(
	"word_kanji",
	{
		id: serial("id").primaryKey(),
		wordId: text("word_id")
			.notNull()
			.references(() => words.id, { onDelete: "cascade" }),
		text: text("text").notNull(),
		common: boolean("common").notNull().default(false),
		tags: text("tags").array().notNull().default([]),
		position: integer("position").notNull(),
	},
	(table) => [
		index("word_kanji_word_id_idx").on(table.wordId),
		unique("word_kanji_word_id_text_unique").on(table.wordId, table.text),
	],
);

export const wordKana = pgTable(
	"word_kana",
	{
		id: serial("id").primaryKey(),
		wordId: text("word_id")
			.notNull()
			.references(() => words.id, { onDelete: "cascade" }),
		text: text("text").notNull(),
		common: boolean("common").notNull().default(false),
		tags: text("tags").array().notNull().default([]),
		appliesToKanji: text("applies_to_kanji").array().notNull().default([]),
		position: integer("position").notNull(),
	},
	(table) => [
		index("word_kana_word_id_idx").on(table.wordId),
		unique("word_kana_word_id_text_unique").on(table.wordId, table.text),
	],
);

export const wordSenses = pgTable(
	"word_senses",
	{
		id: serial("id").primaryKey(),
		wordId: text("word_id")
			.notNull()
			.references(() => words.id, { onDelete: "cascade" }),
		position: integer("position").notNull(),
		field: text("field").array().notNull().default([]),
		misc: text("misc").array().notNull().default([]),
	},
	(table) => [
		index("word_senses_word_id_idx").on(table.wordId),
		unique("word_senses_word_id_position_unique").on(
			table.wordId,
			table.position,
		),
	],
);

export const wordGlosses = pgTable(
	"word_glosses",
	{
		id: serial("id").primaryKey(),
		senseId: integer("sense_id")
			.notNull()
			.references(() => wordSenses.id, { onDelete: "cascade" }),
		lang: text("lang").notNull(),
		text: text("text").notNull(),
	},
	(table) => [
		index("word_glosses_sense_id_idx").on(table.senseId),
		index("word_glosses_sense_lang_idx").on(table.senseId, table.lang),
	],
);

export const wordPos = pgTable(
	"word_pos",
	{
		id: serial("id").primaryKey(),
		senseId: integer("sense_id")
			.notNull()
			.references(() => wordSenses.id, { onDelete: "cascade" }),
		value: text("value").notNull(),
	},
	(table) => [
		index("word_pos_sense_id_idx").on(table.senseId),
		unique("word_pos_sense_id_value_unique").on(table.senseId, table.value),
	],
);

export type Word = InferSelectModel<typeof words>;
export type NewWord = InferInsertModel<typeof words>;

export type WordKanji = InferSelectModel<typeof wordKanji>;
export type NewWordKanji = InferInsertModel<typeof wordKanji>;

export type WordKana = InferSelectModel<typeof wordKana>;
export type NewWordKana = InferInsertModel<typeof wordKana>;

export type WordSense = InferSelectModel<typeof wordSenses>;
export type NewWordSense = InferInsertModel<typeof wordSenses>;

export type WordGloss = InferSelectModel<typeof wordGlosses>;
export type NewWordGloss = InferInsertModel<typeof wordGlosses>;

export type WordPos = InferSelectModel<typeof wordPos>;
export type NewWordPos = InferInsertModel<typeof wordPos>;
