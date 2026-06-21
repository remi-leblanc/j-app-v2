import {
	and,
	arrayOverlaps,
	eq,
	exists,
	inArray,
	type SQL,
} from "drizzle-orm";
import { db } from "~~/server/db";
import { wordGlosses, words, wordSenses } from "~~/server/db/schema";
import type { JlptLevel, WordCategory } from "~~/server/db/import/types";

const VALID_CATEGORIES: WordCategory[] = [
	"nom",
	"verbe",
	"adjectif",
	"adverbe",
	"autre",
];

const VALID_LEVELS: JlptLevel[] = [1, 2, 3, 4, 5];

export const MAX_WORDS_LIMIT = 100;

function parseCsvParam(value: string): string[] {
	if (!value.trim()) return [];
	return value
		.split(",")
		.map((item) => item.trim())
		.filter((item) => item.length > 0);
}

function parseArrayParam(value: string | string[] | undefined): string[] {
	if (value === undefined) return [];
	if (Array.isArray(value)) {
		return value.flatMap((item) => parseCsvParam(item));
	}
	return parseCsvParam(value);
}

export function parseCategories(
	raw: string | string[] | undefined,
): WordCategory[] {
	return parseArrayParam(raw).filter((item): item is WordCategory =>
		VALID_CATEGORIES.includes(item as WordCategory),
	);
}

export function parseLevels(raw: string | string[] | undefined): JlptLevel[] {
	return parseArrayParam(raw)
		.map((item) => Number.parseInt(item, 10))
		.filter(
			(item): item is JlptLevel =>
				!Number.isNaN(item) && VALID_LEVELS.includes(item as JlptLevel),
		);
}

export function parseMaxWords(raw: string | string[] | undefined): number {
	if (raw === undefined) return 0;
	const value = Array.isArray(raw) ? raw[0] : raw;
	const parsed = Number.parseInt(String(value), 10);
	if (Number.isNaN(parsed) || parsed <= 0) return 0;
	return Math.min(parsed, MAX_WORDS_LIMIT);
}

export function parseWordQueryParams(query: Record<string, unknown>) {
	return {
		categories: parseCategories(
			(query.categories ?? query.types) as string | string[] | undefined,
		),
		levels: parseLevels(
			(query.levels ?? query.jlpt) as string | string[] | undefined,
		),
		maxWords: parseMaxWords(
			query.maxWords as string | string[] | undefined,
		),
	};
}

export function buildWordFilterConditions(
	categories: WordCategory[],
	levels: JlptLevel[],
): SQL[] {
	const conditions: SQL[] = [
		exists(
			db
				.select()
				.from(wordSenses)
				.innerJoin(wordGlosses, eq(wordGlosses.senseId, wordSenses.id))
				.where(
					and(
						eq(wordSenses.wordId, words.id),
						eq(wordGlosses.lang, "fre"),
					),
				),
		),
	];

	if (categories.length > 0) {
		conditions.push(arrayOverlaps(words.categories, categories));
	}

	if (levels.length > 0) {
		conditions.push(inArray(words.jlptLevel, levels));
	}

	return conditions;
}
