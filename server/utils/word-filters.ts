import {
	and,
	arrayOverlaps,
	eq,
	exists,
	inArray,
	type SQL,
} from "drizzle-orm";
import { db } from "../db";
import { wordAudio, wordGlosses, words, wordSenses } from "../db/schema";
import type { JlptLevel, WordCategory } from "../db/import/types";

const VALID_CATEGORIES: WordCategory[] = [
	"nom",
	"verbe",
	"adjectif",
	"adverbe",
	"autre",
];

const VALID_LEVELS: JlptLevel[] = [1, 2, 3, 4, 5];

export const DEFAULT_WORD_COUNT = 20;
export const MAX_WORD_COUNT = 100;

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

export function parseGlossLangs(
	raw: string | string[] | undefined,
): string[] {
	return parseArrayParam(raw).map((item) => item.toLowerCase());
}

export function parseWordCount(raw: string | string[] | undefined): number {
	if (raw === undefined) return DEFAULT_WORD_COUNT;
	const value = Array.isArray(raw) ? raw[0] : raw;
	const parsed = Number.parseInt(String(value), 10);
	if (Number.isNaN(parsed)) return DEFAULT_WORD_COUNT;
	return Math.min(Math.max(0, parsed), MAX_WORD_COUNT);
}

export function parseWordQueryParams(query: Record<string, unknown>) {
	return {
		categories: parseCategories(
			(query.categories ?? query.types) as string | string[] | undefined,
		),
		levels: parseLevels(
			(query.levels ?? query.jlpt) as string | string[] | undefined,
		),
		maxWords: parseWordCount(
			query.maxWords as string | string[] | undefined,
		),
		requireAudio: parseRequireAudio(query.requireAudio),
	};
}

function parseRequireAudio(
	raw: string | string[] | boolean | undefined,
): boolean {
	if (raw === true) return true;
	if (raw === undefined) return false;
	const value = Array.isArray(raw) ? raw[0] : raw;
	return String(value).toLowerCase() === "true";
}

export function buildAudioExistsCondition(): SQL {
	return exists(
		db
			.select()
			.from(wordAudio)
			.where(eq(wordAudio.wordId, words.id)),
	);
}

function buildGlossLangExistsCondition(langs: string[]): SQL {
	const langCondition =
		langs.length === 1
			? eq(wordGlosses.lang, langs[0]!)
			: inArray(wordGlosses.lang, langs);

	return exists(
		db
			.select()
			.from(wordSenses)
			.innerJoin(wordGlosses, eq(wordGlosses.senseId, wordSenses.id))
			.where(and(eq(wordSenses.wordId, words.id), langCondition)),
	);
}

export function buildWordFilterConditions(
	categories: WordCategory[],
	levels: JlptLevel[],
	glossLangs: string[] = ["fre"],
): SQL[] {
	const conditions: SQL[] = [];

	if (glossLangs.length > 0) {
		conditions.push(buildGlossLangExistsCondition(glossLangs));
	}

	if (categories.length > 0) {
		conditions.push(arrayOverlaps(words.categories, categories));
	}

	if (levels.length > 0) {
		conditions.push(inArray(words.jlptLevel, levels));
	}

	return conditions;
}
