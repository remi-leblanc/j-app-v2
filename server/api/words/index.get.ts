import { and, sql } from "drizzle-orm";
import type { GameWordsResponse } from "~/types/game";
import { db } from "~~/server/db";
import { words } from "~~/server/db/schema";
import { hydrateGameWords } from "~~/server/utils/hydrate-game-words";
import {
	buildAudioExistsCondition,
	buildWordFilterConditions,
	parseWordQueryParams,
} from "~~/server/utils/word-filters";

export default defineEventHandler(async (event): Promise<GameWordsResponse> => {
	const { categories, levels, maxWords, requireAudio } = parseWordQueryParams(
		getQuery(event),
	);

	const conditions = buildWordFilterConditions(categories, levels);

	if (requireAudio) {
		conditions.push(buildAudioExistsCondition());
	}

	const wordRows = await db
		.select({ id: words.id })
		.from(words)
		.where(and(...conditions))
		.orderBy(sql`random()`)
		.limit(maxWords);

	if (wordRows.length === 0) {
		return { words: [] };
	}

	const wordIds = wordRows.map((row) => row.id);
	const gameWords = await hydrateGameWords(wordIds);

	return { words: gameWords };
});
