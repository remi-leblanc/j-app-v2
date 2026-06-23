import { and, eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { wordAudio } from "~~/server/db/schema";
import {
	audioFileExists,
	getAudioUrl,
} from "~~/shared/utils/audio-tts";

export async function resolveAudioUrl(
	wordId: string,
	reading: string,
): Promise<string | null> {
	const [entry] = await db
		.select({ wordId: wordAudio.wordId })
		.from(wordAudio)
		.where(
			and(eq(wordAudio.wordId, wordId), eq(wordAudio.reading, reading)),
		)
		.limit(1);

	if (!entry || !audioFileExists(wordId, reading)) {
		return null;
	}

	return getAudioUrl(wordId, reading);
}
