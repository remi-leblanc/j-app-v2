import { and, count } from "drizzle-orm";
import { db } from "~~/server/db";
import { words } from "~~/server/db/schema";
import {
	buildWordFilterConditions,
	parseWordQueryParams,
} from "~~/server/utils/word-filters";

export default defineEventHandler(async (event) => {
	const { categories, levels, maxWords } = parseWordQueryParams(
		getQuery(event),
	);

	const conditions = buildWordFilterConditions(categories, levels);

	const [result] = await db
		.select({ count: count() })
		.from(words)
		.where(and(...conditions));

	const totalCount = result?.count ?? 0;
	const effectiveCount = Math.min(totalCount, maxWords);

	return { count: effectiveCount };
});
