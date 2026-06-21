import { relations } from "drizzle-orm";
import {
	wordGlosses,
	wordKanji,
	wordKana,
	wordPos,
	wordSenses,
	words,
} from "./schema";

export const wordsRelations = relations(words, ({ many }) => ({
	kanji: many(wordKanji),
	kana: many(wordKana),
	senses: many(wordSenses),
}));

export const wordKanjiRelations = relations(wordKanji, ({ one }) => ({
	word: one(words, {
		fields: [wordKanji.wordId],
		references: [words.id],
	}),
}));

export const wordKanaRelations = relations(wordKana, ({ one }) => ({
	word: one(words, {
		fields: [wordKana.wordId],
		references: [words.id],
	}),
}));

export const wordSensesRelations = relations(wordSenses, ({ one, many }) => ({
	word: one(words, {
		fields: [wordSenses.wordId],
		references: [words.id],
	}),
	glosses: many(wordGlosses),
	pos: many(wordPos),
}));

export const wordGlossesRelations = relations(wordGlosses, ({ one }) => ({
	sense: one(wordSenses, {
		fields: [wordGlosses.senseId],
		references: [wordSenses.id],
	}),
}));

export const wordPosRelations = relations(wordPos, ({ one }) => ({
	sense: one(wordSenses, {
		fields: [wordPos.senseId],
		references: [wordSenses.id],
	}),
}));
