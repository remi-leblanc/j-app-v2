import { createReadStream } from "node:fs";
import { and, eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { wordAudio } from "~~/server/db/schema";
import {
	audioFileExists,
	getAudioFilePath,
	isPathWithinAudioDir,
} from "~~/shared/utils/audio-tts";

export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	const wordId = String(query.wordId ?? "").trim();
	const reading = String(query.reading ?? "").trim();

	if (!wordId || !reading) {
		throw createError({
			statusCode: 400,
			statusMessage: "wordId and reading are required",
		});
	}

	const [entry] = await db
		.select({ wordId: wordAudio.wordId })
		.from(wordAudio)
		.where(
			and(eq(wordAudio.wordId, wordId), eq(wordAudio.reading, reading)),
		)
		.limit(1);

	if (!entry) {
		throw createError({
			statusCode: 404,
			statusMessage: "Audio not found",
		});
	}

	const filePath = getAudioFilePath(wordId, reading);

	if (!isPathWithinAudioDir(filePath) || !audioFileExists(wordId, reading)) {
		throw createError({
			statusCode: 404,
			statusMessage: "Audio file not found",
		});
	}

	setResponseHeaders(event, {
		"Content-Type": "audio/ogg",
		"Cache-Control": "public, max-age=31536000, immutable",
	});

	return sendStream(event, createReadStream(filePath));
});
