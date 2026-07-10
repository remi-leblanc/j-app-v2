import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { parseArgs } from "node:util";
import { and, eq } from "drizzle-orm";
import { closeDb, drizzleDb } from "../server/db/import/insert-batch";
import { wordAudio, wordKana, words } from "../server/db/schema";
import type { JlptLevel } from "../server/db/import/types";
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
import {
	createAudioQueries,
	getStorageFormat,
	getTtsProvider,
	getVoicevoxConfigForLog,
	initializeTtsProvider,
	synthesizeJapaneseAudio,
	synthesizeQueryBatch,
	type TtsProvider,
} from "../server/utils/tts";

interface GenerateOptions {
	levels: JlptLevel[];
	glossLangs: string[];
	limit: number | null;
	wordId: string | null;
	force: boolean;
	delayMs: number;
	provider: TtsProvider;
	batchSize: number;
}

interface PendingReading {
	wordId: string;
	reading: string;
}

function parseProvider(value: string | undefined): TtsProvider {
	const normalized = value?.trim().toLowerCase();
	if (normalized === "google") return "google";
	if (normalized === "voicevox") return "voicevox";
	return getTtsProvider();
}

function parseOptions(): GenerateOptions {
	const { values } = parseArgs({
		options: {
			levels: { type: "string" },
			langs: { type: "string", default: "fre" },
			limit: { type: "string" },
			"word-id": { type: "string" },
			force: { type: "boolean", default: false },
			"delay-ms": { type: "string", default: "100" },
			provider: { type: "string" },
			"batch-size": { type: "string", default: "10" },
		},
		allowPositionals: false,
	});

	const levels = parseLevels(values.levels);
	const glossLangs = parseGlossLangs(values.langs);
	const parsedLimit = values.limit ? Number.parseInt(values.limit, 10) : null;
	const delayMs = Number.parseInt(values["delay-ms"] ?? "100", 10);
	const batchSize = Number.parseInt(values["batch-size"] ?? "10", 10);

	return {
		levels,
		glossLangs,
		limit:
			parsedLimit !== null && !Number.isNaN(parsedLimit) && parsedLimit > 0
				? parsedLimit
				: null,
		wordId: values["word-id"]?.trim() || null,
		force: values.force ?? false,
		delayMs: Number.isNaN(delayMs) ? 100 : delayMs,
		provider: parseProvider(values.provider),
		batchSize:
			Number.isNaN(batchSize) || batchSize < 1 ? 10 : Math.min(batchSize, 50),
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

async function isReadingAlreadyGenerated(
	wordId: string,
	reading: string,
	force: boolean,
): Promise<boolean> {
	if (force) return false;

	const existsInDb = await drizzleDb
		.select({ wordId: wordAudio.wordId })
		.from(wordAudio)
		.where(and(eq(wordAudio.wordId, wordId), eq(wordAudio.reading, reading)))
		.limit(1);

	return existsInDb.length > 0 && audioFileExists(wordId, reading);
}

async function writeReadingAudio(
	wordId: string,
	reading: string,
	audioBuffer: Buffer,
): Promise<void> {
	await ensureAudioDir(wordId, reading);
	const filePath = getAudioFilePath(wordId, reading);
	await writeFile(filePath, audioBuffer);
	await upsertAudioRecord(wordId, reading);
}

async function fetchWordIds(options: GenerateOptions): Promise<string[]> {
	if (options.wordId) {
		return [options.wordId];
	}

	const conditions = buildWordFilterConditions(
		[],
		options.levels,
		options.glossLangs,
	);

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

async function collectPendingReadings(
	wordIds: string[],
	force: boolean,
): Promise<{ pending: PendingReading[]; skipped: number }> {
	const pending: PendingReading[] = [];
	let skipped = 0;

	for (const wordId of wordIds) {
		const readings = await fetchKanaReadings(wordId);
		if (readings.length === 0) {
			console.warn(`  [${wordId}] No kana readings — skipped`);
			continue;
		}

		for (const reading of readings) {
			if (await isReadingAlreadyGenerated(wordId, reading, force)) {
				skipped += 1;
				continue;
			}
			pending.push({ wordId, reading });
		}
	}

	return { pending, skipped };
}

function chunkArray<T>(items: T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < items.length; i += size) {
		chunks.push(items.slice(i, i + size));
	}
	return chunks;
}

async function generateWithVoicevox(
	pending: PendingReading[],
	options: GenerateOptions,
): Promise<{ generated: number; errors: number }> {
	const voicevoxConfig = getVoicevoxConfigForLog();
	let generated = 0;
	let errors = 0;

	const chunks = chunkArray(pending, options.batchSize);

	for (const chunk of chunks) {
		const uniqueReadings = [...new Set(chunk.map((item) => item.reading))];
		try {
			const queryItems = await createAudioQueries(uniqueReadings, voicevoxConfig);
			const audioByReading = await synthesizeQueryBatch(
				queryItems,
				voicevoxConfig,
			);

			for (const item of chunk) {
				const audioBuffer = audioByReading.get(item.reading);
				if (!audioBuffer) {
					errors += 1;
					console.error(
						`  [${item.wordId}] Missing audio for "${item.reading}"`,
					);
					continue;
				}

				await writeReadingAudio(item.wordId, item.reading, audioBuffer);
				generated += 1;
				console.log(`  [${item.wordId}] Generated: ${item.reading}`);
			}
		} catch (error) {
			errors += chunk.length;
			const message =
				error instanceof Error ? error.message : String(error);
			console.error(`  Batch error (${chunk.length} reading(s)): ${message}`);
		}

		if (options.delayMs > 0) {
			await sleep(options.delayMs);
		}
	}

	return { generated, errors };
}

async function generateWithGoogle(
	pending: PendingReading[],
	options: GenerateOptions,
): Promise<{ generated: number; errors: number }> {
	let generated = 0;
	let errors = 0;

	for (const item of pending) {
		try {
			const audioBuffer = await synthesizeJapaneseAudio(item.reading);
			await writeReadingAudio(item.wordId, item.reading, audioBuffer);
			generated += 1;
			console.log(`  [${item.wordId}] Generated: ${item.reading}`);

			if (options.delayMs > 0) {
				await sleep(options.delayMs);
			}
		} catch (error) {
			errors += 1;
			const message =
				error instanceof Error ? error.message : String(error);
			console.error(
				`  [${item.wordId}] Error for "${item.reading}": ${message}`,
			);
		}
	}

	return { generated, errors };
}

async function main(): Promise<void> {
	const options = parseOptions();

	console.log("Audio TTS generation");
	console.log(`  Directory: ${resolveAudioDir()}`);
	console.log(`  Provider: ${options.provider}`);
	console.log(`  Format: ${getStorageFormat()}`);
	if (options.provider === "voicevox") {
		const config = getVoicevoxConfigForLog();
		console.log(`  VOICEVOX URL: ${config.baseUrl}`);
		console.log(`  VOICEVOX speaker: ${config.speaker}`);
		console.log(`  Batch size: ${options.batchSize}`);
	}
	if (options.levels.length > 0) {
		console.log(`  JLPT levels: ${options.levels.join(", ")}`);
	} else {
		console.log("  JLPT levels: (all — including words without level)");
	}
	if (options.glossLangs.length > 0) {
		console.log(`  Gloss languages: ${options.glossLangs.join(", ")}`);
	} else {
		console.log("  Gloss languages: (none — all words)");
	}
	if (options.limit) console.log(`  Limit: ${options.limit} words`);
	if (options.wordId) console.log(`  Word ID: ${options.wordId}`);
	console.log(`  Force: ${options.force}`);

	await initializeTtsProvider(options.provider);

	const wordIds = await fetchWordIds(options);
	console.log(`Found ${wordIds.length} word(s) to process`);

	const { pending, skipped: skippedCount } = await collectPendingReadings(
		wordIds,
		options.force,
	);
	console.log(`Pending: ${pending.length}, skipped: ${skippedCount}`);

	let generated = 0;
	let errors = 0;

	if (pending.length > 0) {
		const result =
			options.provider === "voicevox"
				? await generateWithVoicevox(pending, options)
				: await generateWithGoogle(pending, options);
		generated = result.generated;
		errors = result.errors;
	}

	console.log("\nDone.");
	console.log(`  Words scanned: ${wordIds.length}`);
	console.log(`  Audio generated: ${generated}`);
	console.log(`  Audio skipped: ${skippedCount}`);
	console.log(`  Errors: ${errors}`);
}

main()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(() => closeDb());
