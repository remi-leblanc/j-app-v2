import { and, eq, inArray } from "drizzle-orm";
import type { GameWord } from "~/types/game";
import { db } from "~~/server/db";
import {
	wordGlosses,
	wordKana,
	wordKanji,
	wordSenses,
} from "~~/server/db/schema";
import { pickDisplayForm } from "~~/server/utils/pick-display-form";

function uniqueStrings(values: string[]): string[] {
	return [...new Set(values)];
}

export async function hydrateGameWords(wordIds: string[]): Promise<GameWord[]> {
	if (wordIds.length === 0) return [];

	const [kanjiRows, kanaRows, senseRows, glossRows] = await Promise.all([
		db
			.select({
				wordId: wordKanji.wordId,
				text: wordKanji.text,
				common: wordKanji.common,
				tags: wordKanji.tags,
				position: wordKanji.position,
			})
			.from(wordKanji)
			.where(inArray(wordKanji.wordId, wordIds)),
		db
			.select({
				wordId: wordKana.wordId,
				text: wordKana.text,
				common: wordKana.common,
				tags: wordKana.tags,
				appliesToKanji: wordKana.appliesToKanji,
				position: wordKana.position,
			})
			.from(wordKana)
			.where(inArray(wordKana.wordId, wordIds)),
		db
			.select({ wordId: wordSenses.wordId, misc: wordSenses.misc })
			.from(wordSenses)
			.where(inArray(wordSenses.wordId, wordIds)),
		db
			.select({
				wordId: wordSenses.wordId,
				position: wordSenses.position,
				text: wordGlosses.text,
			})
			.from(wordGlosses)
			.innerJoin(wordSenses, eq(wordGlosses.senseId, wordSenses.id))
			.where(
				and(
					inArray(wordSenses.wordId, wordIds),
					eq(wordGlosses.lang, "fre"),
				),
			),
	]);

	const kanjiByWordId = new Map<string, typeof kanjiRows>();
	for (const row of kanjiRows) {
		const existing = kanjiByWordId.get(row.wordId) ?? [];
		existing.push(row);
		kanjiByWordId.set(row.wordId, existing);
	}

	const kanaByWordId = new Map<string, typeof kanaRows>();
	for (const row of kanaRows) {
		const existing = kanaByWordId.get(row.wordId) ?? [];
		existing.push(row);
		kanaByWordId.set(row.wordId, existing);
	}

	const senseMiscByWordId = new Map<string, string[]>();
	for (const row of senseRows) {
		const existing = senseMiscByWordId.get(row.wordId) ?? [];
		existing.push(...row.misc);
		senseMiscByWordId.set(row.wordId, existing);
	}

	const glossesByWordAndPosition = new Map<
		string,
		Map<number, string[]>
	>();
	for (const row of glossRows) {
		let byPosition = glossesByWordAndPosition.get(row.wordId);
		if (!byPosition) {
			byPosition = new Map();
			glossesByWordAndPosition.set(row.wordId, byPosition);
		}
		const existing = byPosition.get(row.position) ?? [];
		existing.push(row.text);
		byPosition.set(row.position, existing);
	}

	function buildSenses(wordId: string) {
		const byPosition = glossesByWordAndPosition.get(wordId);
		if (!byPosition) return [];

		return [...byPosition.entries()]
			.sort(([a], [b]) => a - b)
			.map(([, glosses]) => ({ glosses: uniqueStrings(glosses) }))
			.filter((sense) => sense.glosses.length > 0);
	}

	const gameWords: GameWord[] = [];

	for (const wordId of wordIds) {
		const kanji = kanjiByWordId.get(wordId) ?? [];
		const kana = kanaByWordId.get(wordId) ?? [];
		const senseMisc = uniqueStrings(senseMiscByWordId.get(wordId) ?? []);

		const display = pickDisplayForm({ kanji, kana, senseMisc });
		if (!display) continue;

		const readings = uniqueStrings(kana.map((k) => k.text));
		const senses = buildSenses(wordId);
		const translations = uniqueStrings(
			senses.flatMap((sense) => sense.glosses),
		);

		if (readings.length === 0 || translations.length === 0 || senses.length === 0) {
			continue;
		}

		gameWords.push({
			id: wordId,
			displayWriting: display.writing,
			displayReading: display.reading,
			readings,
			translations,
			senses,
		});
	}

	return gameWords;
}
