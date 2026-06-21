import "dotenv/config";
import { createReadStream } from "node:fs";
import path from "node:path";
import { createGunzip } from "node:zlib";
import { chain } from "stream-chain";
import Pick from "stream-json/filters/Pick.js";
import Parser from "stream-json/Parser.js";
import StreamArray from "stream-json/streamers/StreamArray.js";
import { Parser as TarParser } from "tar";
import {
	extractJlptLevel,
	mapJmdictEntry,
} from "../server/db/import/map-jmdict-entry";
import type { JlptLevel, JmdictEntry, MappedEntry } from "../server/db/import/types";
import {
	clearWordTables,
	closeDb,
	insertBatch,
	updateJlptBatch,
} from "../server/db/import/insert-batch";

const JMDICT_FILENAME = "jmdict-all-3.6.2+20260615170427.json.tgz";
const JMDICT_EXTENDED_FILENAME = "jmdictExtended-2026-06-16.json.tar.gz";
const BATCH_SIZE = 500;
const PROGRESS_INTERVAL = 5_000;

async function processJsonEntry(
	stream: NodeJS.ReadableStream,
	onEntry: (entry: JmdictEntry) => Promise<void>,
): Promise<void> {
	const pipeline = chain([
		stream,
		new Parser(),
		new Pick({ filter: "words" }),
		new StreamArray(),
	]);

	for await (const chunk of pipeline) {
		const { value } = chunk as { value: JmdictEntry };
		await onEntry(value);
	}
}

async function processTarJsonFile(
	tgzPath: string,
	onEntry: (entry: JmdictEntry) => Promise<void>,
): Promise<void> {
	await new Promise<void>((resolve, reject) => {
		const tarParser = new TarParser();

		tarParser.on("entry", (entryStream) => {
			if (!entryStream.path.endsWith(".json")) {
				entryStream.resume();
				return;
			}

			processJsonEntry(entryStream, onEntry).then(resolve).catch(reject);
		});

		tarParser.on("error", reject);

		createReadStream(tgzPath).pipe(createGunzip()).pipe(tarParser);
	});
}

async function importSimplified(): Promise<void> {
	const tgzPath = path.resolve(import.meta.dirname, "..", JMDICT_FILENAME);
	const startTime = Date.now();

	let processed = 0;
	let skipped = 0;
	let batch: MappedEntry[] = [];

	const flushBatch = async (): Promise<void> => {
		if (batch.length === 0) return;
		await insertBatch(batch);
		batch = [];
	};

	const handleEntry = async (entry: JmdictEntry): Promise<void> => {
		const mapped = mapJmdictEntry(entry);
		if (!mapped) {
			skipped++;
			if (!entry.id) {
				console.warn("Skipping entry without id");
			}
			return;
		}

		batch.push(mapped);
		processed++;

		if (batch.length >= BATCH_SIZE) {
			await flushBatch();
		}

		if (processed % PROGRESS_INTERVAL === 0) {
			console.log(`Processed ${processed.toLocaleString()} entries…`);
		}
	};

	console.log("Importing jmdict-simplified…");
	await processTarJsonFile(tgzPath, handleEntry);
	await flushBatch();

	const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
	console.log(
		`Simplified import complete: ${processed.toLocaleString()} entries imported, ${skipped.toLocaleString()} skipped in ${durationSec}s`,
	);
}

async function importJlptLevels(): Promise<void> {
	const tgzPath = path.resolve(
		import.meta.dirname,
		"..",
		JMDICT_EXTENDED_FILENAME,
	);
	const startTime = Date.now();

	let processed = 0;
	let updated = 0;
	let skipped = 0;
	let batch: { id: string; jlptLevel: JlptLevel }[] = [];

	const flushBatch = async (): Promise<void> => {
		if (batch.length === 0) return;
		await updateJlptBatch(batch);
		updated += batch.length;
		batch = [];
	};

	const handleEntry = async (entry: JmdictEntry): Promise<void> => {
		if (!entry.id) {
			skipped++;
			return;
		}

		const jlptLevel = extractJlptLevel(entry);
		if (!jlptLevel) {
			skipped++;
			return;
		}

		batch.push({ id: entry.id, jlptLevel });
		processed++;

		if (batch.length >= BATCH_SIZE) {
			await flushBatch();
		}

		if (processed % PROGRESS_INTERVAL === 0) {
			console.log(`JLPT: processed ${processed.toLocaleString()} entries…`);
		}
	};

	console.log("Importing JLPT levels from jmdictExtended…");
	await processTarJsonFile(tgzPath, handleEntry);
	await flushBatch();

	const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
	console.log(
		`JLPT import complete: ${updated.toLocaleString()} levels updated, ${skipped.toLocaleString()} skipped in ${durationSec}s`,
	);
}

async function importJmdict(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL is not set");
	}

	console.log("Clearing existing word data…");
	await clearWordTables();

	await importSimplified();
	await importJlptLevels();
}

importJmdict()
	.catch((error: unknown) => {
		console.error("Import failed:", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await closeDb();
	});
