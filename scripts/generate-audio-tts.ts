import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { parseArgs } from "node:util";
import { and, eq, isNotNull } from "drizzle-orm";
import { closeDb, drizzleDb } from "../server/db/import/insert-batch";
import { wordAudio, wordKana, words } from "../server/db/schema";
import type { JlptLevel } from "../server/db/import/types";
import { synthesizeJapaneseOgg } from "../server/utils/google-tts";
import {
	audioFileExists,
	getAudioFilePath,
	resolveAudioDir,
} from "../shared/utils/audio-tts";
import {
	buildWordFilterConditions,
	parseGlossLangs,
	parseLevels,
} from "../server/utils/word-filters";

interface GenerateOptions {
	levels: JlptLevel[];
	glossLangs: string[];
	limit: number | null;
	wordId: string | null;
	force: boolean;
	delayMs: number;
}

function parseOptions(): GenerateOptions {
	const { values } = parseArgs({
		options: {
			levels: { type: "string", default: "5" },
			langs: { type: "string", default: "fre" },
			limit: { type: "string" },
			"word-id": { type: "string" },
			force: { type: "boolean", default: false },
			"delay-ms": { type: "string", default: "100" },
		},
		allowPositionals: false,
	});

	const levels = parseLevels(values.levels);
	const glossLangs = parseGlossLangs(values.langs);
	const parsedLimit = values.limit ? Number.parseInt(values.limit, 10) : null;
	const delayMs = Number.parseInt(values["delay-ms"] ?? "100", 10);

	return {
		levels: levels.length > 0 ? levels : [5],
		glossLangs,
		limit:
			parsedLimit !== null && !Number.isNaN(parsedLimit) && parsedLimit > 0
				? parsedLimit
				: null,
		wordId: values["word-id"]?.trim() || null,
		force: values.force ?? false,
		delayMs: Number.isNaN(delayMs) ? 100 : delayMs,
	};
}

function isSearchOnlyKana(tags: string[]): boolean {
	return tags.includes("sk");
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureAudioDir(wordId: string, reading: string): Promise<void> {
	await mkdir(dirname(getAudioFilePath(wordId, reading)), { recursive: true });
}

async function upsertAudioRecord(wordId: string, reading: string): Promise<void> {
	await drizzleDb
		.insert(wordAudio)
		.values({ wordId, reading })
		.onConflictDoNothing();
}

async function generateReadingAudio(
	wordId: string,
	reading: string,
	force: boolean,
): Promise<"skipped" | "generated"> {
	const existsInDb = await drizzleDb
		.select({ wordId: wordAudio.wordId })
		.from(wordAudio)
		.where(
			and(eq(wordAudio.wordId, wordId), eq(wordAudio.reading, reading)),
		)
		.limit(1);

	const fileExists = audioFileExists(wordId, reading);

	if (!force && existsInDb.length > 0 && fileExists) {
		return "skipped";
	}

	await ensureAudioDir(wordId, reading);

	const audioBuffer = await synthesizeJapaneseOgg(reading);
	const filePath = getAudioFilePath(wordId, reading);
	await writeFile(filePath, audioBuffer);
	await upsertAudioRecord(wordId, reading);

	return "generated";
}

async function fetchWordIds(options: GenerateOptions): Promise<string[]> {
	if (options.wordId) {
		return [options.wordId];
	}

	const conditions = [
		...buildWordFilterConditions([], options.levels, options.glossLangs),
		isNotNull(words.jlptLevel),
	];

	const rows = await drizzleDb
		.select({ id: words.id })
		.from(words)
		.where(and(...conditions))
		.limit(options.limit ?? 1_000_000);

	return rows.map((row) => row.id);
}

async function fetchKanaReadings(wordId: string): Promise<string[]> {
	const rows = await drizzleDb
		.select({ text: wordKana.text, tags: wordKana.tags })
		.from(wordKana)
		.where(eq(wordKana.wordId, wordId));

	const readings = new Set<string>();
	for (const row of rows) {
		if (isSearchOnlyKana(row.tags)) continue;
		readings.add(row.text);
	}
	return [...readings];
}

async function main(): Promise<void> {
	const options = parseOptions();

	console.log("Audio TTS generation");
	console.log(`  Directory: ${resolveAudioDir()}`);
	console.log(`  JLPT levels: ${options.levels.join(", ")}`);
	if (options.glossLangs.length > 0) {
		console.log(`  Gloss languages: ${options.glossLangs.join(", ")}`);
	} else {
		console.log("  Gloss languages: (none — all words)");
	}
	if (options.limit) console.log(`  Limit: ${options.limit} words`);
	if (options.wordId) console.log(`  Word ID: ${options.wordId}`);
	console.log(`  Force: ${options.force}`);

	const wordIds = await fetchWordIds(options);
	console.log(`Found ${wordIds.length} word(s) to process`);

	let wordsProcessed = 0;
	let generated = 0;
	let skipped = 0;
	let errors = 0;

	for (const wordId of wordIds) {
		const readings = await fetchKanaReadings(wordId);
		if (readings.length === 0) {
			console.warn(`  [${wordId}] No kana readings — skipped`);
			continue;
		}

		wordsProcessed += 1;

		for (const reading of readings) {
			try {
				const result = await generateReadingAudio(
					wordId,
					reading,
					options.force,
				);
				if (result === "generated") {
					generated += 1;
					console.log(`  [${wordId}] Generated: ${reading}`);
				} else {
					skipped += 1;
				}
				if (options.delayMs > 0) {
					await sleep(options.delayMs);
				}
			} catch (error) {
				errors += 1;
				const message =
					error instanceof Error ? error.message : String(error);
				console.error(`  [${wordId}] Error for "${reading}": ${message}`);
			}
		}
	}

	console.log("\nDone.");
	console.log(`  Words processed: ${wordsProcessed}`);
	console.log(`  Audio generated: ${generated}`);
	console.log(`  Audio skipped: ${skipped}`);
	console.log(`  Errors: ${errors}`);
}

main()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(() => closeDb());
