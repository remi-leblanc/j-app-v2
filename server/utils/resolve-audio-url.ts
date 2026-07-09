import { and, eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { wordAudio } from "~~/server/db/schema";
import { resolveSiteUrl } from "~~/server/utils/site-url";
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

	const siteUrl = resolveSiteUrl();
	const verifyLocalFile = process.env.NODE_ENV === "production";

	if (!entry || (verifyLocalFile && !audioFileExists(wordId, reading))) {
		return null;
	}

	return getAudioUrl(wordId, reading, siteUrl);
}
