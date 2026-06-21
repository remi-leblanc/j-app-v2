import type {
	JlptLevel,
	JmdictEntry,
	MappedEntry,
	WordCategory,
} from "./types";

const VALID_JLPT_LEVELS = new Set<JlptLevel>([1, 2, 3, 4, 5]);

function isJlptLevel(value: number): value is JlptLevel {
	return VALID_JLPT_LEVELS.has(value as JlptLevel);
}

// Verbs: all v* codes + aux-v
const VERB_POS = new Set([
	// Modern verbs
	"v-unspec",
	"v1",
	"v1-s",
	"vi",
	"vk",
	"vn",
	"vr",
	"vt",
	"vz",
	// Suru verbs
	"vs",
	"vs-c",
	"vs-i",
	"vs-s",
	// Godan (v5*)
	"v5aru",
	"v5b",
	"v5g",
	"v5k",
	"v5k-s",
	"v5m",
	"v5n",
	"v5r",
	"v5r-i",
	"v5s",
	"v5t",
	"v5u",
	"v5u-s",
	"v5uru",
	// Archaic Nidan (v2*)
	"v2a-s",
	"v2b-k",
	"v2b-s",
	"v2d-k",
	"v2d-s",
	"v2g-k",
	"v2g-s",
	"v2h-k",
	"v2h-s",
	"v2k-k",
	"v2k-s",
	"v2m-k",
	"v2m-s",
	"v2n-s",
	"v2r-k",
	"v2r-s",
	"v2s-s",
	"v2t-k",
	"v2t-s",
	"v2w-s",
	"v2y-k",
	"v2y-s",
	"v2z-s",
	// Archaic Yodan (v4*)
	"v4b",
	"v4g",
	"v4h",
	"v4k",
	"v4m",
	"v4n",
	"v4r",
	"v4s",
	"v4t",
	// Auxiliary verb
	"aux-v",
]);

// Nouns: n* codes + adj-no (nouns taking genitive 'no')
const NOUN_POS = new Set([
	"n",
	"n-adv",
	"n-pr",
	"n-pref",
	"n-suf",
	"n-t",
	"adj-no", // "nouns which may take the genitive case particle 'no'"
]);

// Adjectives: adj-* codes (except adj-no, handled above) + aux-adj
const ADJECTIVE_POS = new Set([
	"adj-f",
	"adj-i",
	"adj-ix",
	"adj-na",
	"adj-pn",
	"adj-t",
	// Archaic adjective forms
	"adj-kari",
	"adj-ku",
	"adj-nari",
	"adj-shiku",
	// Auxiliary adjective
	"aux-adj",
]);

// Adverbs
const ADVERB_POS = new Set(["adv", "adv-to"]);

function normalizeJlptLevel(
	value: string | number | null | undefined,
): JlptLevel | null {
	if (value === null || value === undefined) return null;

	if (typeof value === "number") {
		return isJlptLevel(value) ? value : null;
	}

	const trimmed = value.trim();
	if (/^[1-5]$/.test(trimmed)) {
		return Number.parseInt(trimmed, 10) as JlptLevel;
	}

	const match = trimmed.match(/^N([1-5])$/i);
	if (match?.[1]) {
		return Number.parseInt(match[1], 10) as JlptLevel;
	}

	return null;
}

export function extractJlptLevel(entry: JmdictEntry): JlptLevel | null {
	const kanji = entry.kanji ?? [];
	const kana = entry.kana ?? [];

	const commonKanji = kanji.find((k) => k.common);
	const commonKanjiLevel = normalizeJlptLevel(commonKanji?.jlptLevel);
	if (commonKanjiLevel) return commonKanjiLevel;

	for (const k of kanji) {
		const level = normalizeJlptLevel(k.jlptLevel);
		if (level) return level;
	}

	const commonUniversalKana = kana.find(
		(k) => k.common && k.appliesToKanji?.includes("*"),
	);
	const commonKanaLevel = normalizeJlptLevel(commonUniversalKana?.jlptLevel);
	if (commonKanaLevel) return commonKanaLevel;

	for (const k of kana) {
		const level = normalizeJlptLevel(k.jlptLevel);
		if (level) return level;
	}

	return null;
}

export function mapPartOfSpeechToCategory(pos: string): WordCategory {
	if (VERB_POS.has(pos)) return "verbe";
	if (NOUN_POS.has(pos)) return "nom";
	if (ADJECTIVE_POS.has(pos)) return "adjectif";
	if (ADVERB_POS.has(pos)) return "adverbe";
	return "autre";
}

function collectCategories(senses: JmdictEntry["sense"]): WordCategory[] {
	const categories = new Set<WordCategory>();

	for (const sense of senses ?? []) {
		for (const pos of sense.partOfSpeech ?? []) {
			if (pos.length > 0) {
				categories.add(mapPartOfSpeechToCategory(pos));
			}
		}
	}

	return [...categories];
}

export function mapJmdictEntry(entry: JmdictEntry): MappedEntry | null {
	if (!entry.id) return null;

	const kanji = entry.kanji ?? [];
	const kana = entry.kana ?? [];
	const senses = entry.sense ?? [];

	if (kana.length === 0 && kanji.length === 0) return null;

	const wordId = entry.id;

	return {
		word: {
			id: wordId,
			categories: collectCategories(senses),
			jlptLevel: null,
		},
		kanji: kanji.map((k, position) => ({
			wordId,
			text: k.text,
			common: k.common ?? false,
			tags: k.tags ?? [],
			position,
		})),
		kana: kana.map((k, position) => ({
			wordId,
			text: k.text,
			common: k.common ?? false,
			tags: k.tags ?? [],
			appliesToKanji: k.appliesToKanji ?? [],
			position,
		})),
		senses: senses.map((sense, position) => ({
			wordId,
			position,
			field: sense.field ?? [],
			misc: sense.misc ?? [],
		})),
		glosses: senses.flatMap((sense, sensePosition) =>
			(sense.gloss ?? []).map((gloss) => ({
				wordId,
				sensePosition,
				lang: gloss.lang,
				text: gloss.text,
			})),
		),
		pos: senses.flatMap((sense, sensePosition) =>
			(sense.partOfSpeech ?? [])
				.filter((value) => value.length > 0)
				.map((value) => ({
					wordId,
					sensePosition,
					value,
				})),
		),
	};
}
