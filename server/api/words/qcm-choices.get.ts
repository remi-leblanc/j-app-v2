import { and, ne, sql } from "drizzle-orm";
import type { QcmChoicesResponse } from "~/types/game";
import { db } from "~~/server/db";
import { words } from "~~/server/db/schema";
import { hydrateGameWords } from "~~/server/utils/hydrate-game-words";
import {
	buildWordFilterConditions,
	parseWordQueryParams,
} from "~~/server/utils/word-filters";
import {
	buildRomajiChoices,
	buildTranslationChoices,
	pickRandomSense,
} from "~~/shared/utils/qcm-choices";
import { resolveAudioUrl } from "~~/server/utils/resolve-audio-url";

const DISTRACTOR_POOL_SIZE = 100;

export default defineEventHandler(async (event): Promise<QcmChoicesResponse> => {
	const query = getQuery(event);
	const wordId = String(query.wordId ?? "").trim();

	if (!wordId) {
		throw createError({
			statusCode: 400,
			statusMessage: "wordId is required",
		});
	}

	const { categories, levels } = parseWordQueryParams(query);
	const conditions = buildWordFilterConditions(categories, levels);

	const [currentWord] = await hydrateGameWords([wordId]);
	if (!currentWord) {
		throw createError({
			statusCode: 404,
			statusMessage: "Word not found",
		});
	}

	const distractorRows = await db
		.select({ id: words.id })
		.from(words)
		.where(and(...conditions, ne(words.id, wordId)))
		.orderBy(sql`random()`)
		.limit(DISTRACTOR_POOL_SIZE);

	const distractorWords = await hydrateGameWords(
		distractorRows.map((row) => row.id),
	);

	const targetSense = pickRandomSense(currentWord);
	const spokenReading = currentWord.displayReading;
	const audioUrl = await resolveAudioUrl(currentWord.id, spokenReading);

	return {
		romajiChoices: buildRomajiChoices(currentWord, distractorWords),
		translationChoices: buildTranslationChoices(
			currentWord,
			distractorWords,
			targetSense,
		),
		spokenReading,
		audioUrl,
	};
});
