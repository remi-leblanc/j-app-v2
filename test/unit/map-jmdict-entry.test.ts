import { describe, expect, it } from "vitest";
import type { JmdictEntry } from "../../server/db/import/types";
import {
	extractJlptLevel,
	mapJmdictEntry,
	mapPartOfSpeechToCategory,
} from "../../server/db/import/map-jmdict-entry";

describe("mapPartOfSpeechToCategory", () => {
	it("maps JMDict POS codes to app categories", () => {
		expect(mapPartOfSpeechToCategory("v5u")).toBe("verbe");
		expect(mapPartOfSpeechToCategory("n")).toBe("nom");
		expect(mapPartOfSpeechToCategory("adj-i")).toBe("adjectif");
		expect(mapPartOfSpeechToCategory("adv")).toBe("adverbe");
		expect(mapPartOfSpeechToCategory("int")).toBe("autre");
	});
});

describe("extractJlptLevel", () => {
	it("reads JLPT level from common kanji first", () => {
		const entry: JmdictEntry = {
			id: "1",
			kanji: [
				{ text: "猫", common: true, jlptLevel: 5 },
				{ text: "稀", jlptLevel: 1 },
			],
			kana: [{ text: "ねこ", common: true, appliesToKanji: ["*"], jlptLevel: 4 }],
		};

		expect(extractJlptLevel(entry)).toBe(5);
	});

	it("accepts numeric level formats", () => {
		expect(
			extractJlptLevel({
				id: "1",
				kanji: [{ text: "犬", jlptLevel: 4 }],
			}),
		).toBe(4);

		expect(
			extractJlptLevel({
				id: "1",
				kana: [{ text: "いぬ", jlptLevel: "4" }],
			}),
		).toBe(4);
	});

	it("rejects N-prefixed level formats", () => {
		expect(
			extractJlptLevel({
				id: "1",
				kana: [{ text: "いぬ", jlptLevel: "N4" }],
			}),
		).toBeNull();
	});

	it("falls back to kana when kanji has no level", () => {
		const entry: JmdictEntry = {
			id: "1",
			kanji: [{ text: "猫" }],
			kana: [{ text: "ねこ", common: true, appliesToKanji: ["*"], jlptLevel: 3 }],
		};

		expect(extractJlptLevel(entry)).toBe(3);
	});

	it("returns null when no level is available", () => {
		expect(extractJlptLevel({ id: "1", kana: [{ text: "ねこ" }] })).toBeNull();
	});
});

describe("mapJmdictEntry", () => {
	it("returns null when id or forms are missing", () => {
		expect(mapJmdictEntry({ id: "" })).toBeNull();
		expect(mapJmdictEntry({ id: "1" })).toBeNull();
	});

	it("maps senses, glosses, POS and form positions", () => {
		const entry: JmdictEntry = {
			id: "1000280",
			kanji: [{ text: "猫", common: true, tags: [] }],
			kana: [{ text: "ねこ", common: true, appliesToKanji: ["*"], tags: [] }],
			sense: [
				{
					partOfSpeech: ["n"],
					gloss: [
						{ lang: "fra", text: "chat" },
						{ lang: "eng", text: "cat" },
					],
					misc: ["uk"],
				},
				{
					partOfSpeech: ["v5u", "vt"],
					gloss: [{ lang: "fra", text: "caresser" }],
				},
			],
		};

		const mapped = mapJmdictEntry(entry);

		expect(mapped).not.toBeNull();
		expect(mapped!.word).toEqual({
			id: "1000280",
			categories: ["nom", "verbe"],
			jlptLevel: null,
		});
		expect(mapped!.kanji[0]).toMatchObject({
			wordId: "1000280",
			text: "猫",
			common: true,
			position: 0,
		});
		expect(mapped!.kana[0]).toMatchObject({
			wordId: "1000280",
			text: "ねこ",
			appliesToKanji: ["*"],
			position: 0,
		});
		expect(mapped!.senses).toEqual([
			{
				wordId: "1000280",
				position: 0,
				field: [],
				misc: ["uk"],
			},
			{
				wordId: "1000280",
				position: 1,
				field: [],
				misc: [],
			},
		]);
		expect(mapped!.glosses).toEqual([
			{ wordId: "1000280", sensePosition: 0, lang: "fra", text: "chat" },
			{ wordId: "1000280", sensePosition: 0, lang: "eng", text: "cat" },
			{
				wordId: "1000280",
				sensePosition: 1,
				lang: "fra",
				text: "caresser",
			},
		]);
		expect(mapped!.pos).toEqual([
			{ wordId: "1000280", sensePosition: 0, value: "n" },
			{ wordId: "1000280", sensePosition: 1, value: "v5u" },
			{ wordId: "1000280", sensePosition: 1, value: "vt" },
		]);
	});
});
