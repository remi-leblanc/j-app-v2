import { and, count } from "drizzle-orm";
import { db } from "~~/server/db";
import { words } from "~~/server/db/schema";
import {
	buildAudioExistsCondition,
	buildWordFilterConditions,
	parseWordQueryParams,
} from "~~/server/utils/word-filters";

export default defineEventHandler(async (event) => {
	const { categories, levels, maxWords, requireAudio } = parseWordQueryParams(
		getQuery(event),
	);

	const conditions = buildWordFilterConditions(categories, levels);

	if (requireAudio) {
		conditions.push(buildAudioExistsCondition());
	}

	const [result] = await db
		.select({ count: count() })
		.from(words)
		.where(and(...conditions));

	const totalCount = Number(result?.count ?? 0);
	const effectiveCount = Math.min(totalCount, maxWords);

	return { count: effectiveCount, totalCount };
});
