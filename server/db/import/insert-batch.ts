import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
	wordGlosses,
	wordKana,
	wordKanji,
	wordPos,
	wordSenses,
	words,
} from "../schema";
import type { JlptLevel, MappedEntry } from "./types";

const client = postgres(process.env.DATABASE_URL!);
export const db = client;
export const drizzleDb = drizzle(client);

export async function closeDb(): Promise<void> {
	await client.end();
}

export async function clearWordTables(): Promise<void> {
	await drizzleDb.execute(sql`TRUNCATE TABLE words CASCADE`);
}

export async function updateJlptBatch(
	updates: { id: string; jlptLevel: JlptLevel }[],
): Promise<void> {
	if (updates.length === 0) return;

	await drizzleDb.transaction(async (tx) => {
		await Promise.all(
			updates.map((update) =>
				tx
					.update(words)
					.set({ jlptLevel: update.jlptLevel })
					.where(eq(words.id, update.id)),
			),
		);
	});
}

export async function insertBatch(entries: MappedEntry[]): Promise<void> {
	if (entries.length === 0) return;

	await drizzleDb.transaction(async (tx) => {
		await tx.insert(words).values(entries.map((e) => e.word));

		const kanjiRows = entries.flatMap((e) => e.kanji);
		if (kanjiRows.length > 0) {
			await tx.insert(wordKanji).values(kanjiRows);
		}

		const kanaRows = entries.flatMap((e) => e.kana);
		if (kanaRows.length > 0) {
			await tx.insert(wordKana).values(kanaRows);
		}

		const senseRows = entries.flatMap((e) => e.senses);
		if (senseRows.length === 0) return;

		const insertedSenses = await tx
			.insert(wordSenses)
			.values(senseRows)
			.returning({
				id: wordSenses.id,
				wordId: wordSenses.wordId,
				position: wordSenses.position,
			});

		const senseIdByKey = new Map<string, number>();
		for (const sense of insertedSenses) {
			senseIdByKey.set(`${sense.wordId}:${sense.position}`, sense.id);
		}

		const glossRows = entries.flatMap((e) =>
			e.glosses
				.map((g) => {
					const senseId = senseIdByKey.get(`${g.wordId}:${g.sensePosition}`);
					if (senseId === undefined) return null;
					return { senseId, lang: g.lang, text: g.text };
				})
				.filter((row) => row !== null),
		);
		if (glossRows.length > 0) {
			await tx.insert(wordGlosses).values(glossRows);
		}

		const posRows = entries.flatMap((e) =>
			e.pos
				.map((p) => {
					const senseId = senseIdByKey.get(`${p.wordId}:${p.sensePosition}`);
					if (senseId === undefined) return null;
					return { senseId, value: p.value };
				})
				.filter((row) => row !== null),
		);
		if (posRows.length > 0) {
			await tx.insert(wordPos).values(posRows);
		}
	});
}
