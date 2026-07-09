import { describe, expect, it } from "vitest";

import { isPronunciationCorrect } from "../../shared/utils/pronunciation-validation";

function createWord(
	overrides: Partial<{
		displayWriting: string;
		displayReading: string;
		readings: string[];
		kanjiWritings: string[];
	}> = {},
) {
	return {
		displayWriting: overrides.displayWriting ?? "猫",
		displayReading: overrides.displayReading ?? "ねこ",
		readings: overrides.readings ?? ["ねこ", "ネコ"],
		kanjiWritings: overrides.kanjiWritings ?? ["猫"],
	};
}

describe("isPronunciationCorrect", () => {
	it("accepts hiragana transcript", () => {
		expect(isPronunciationCorrect(["ねこ"], createWord())).toBe(true);
	});

	it("accepts katakana transcript", () => {
		expect(isPronunciationCorrect(["ネコ"], createWord())).toBe(true);
	});

	it("accepts romaji transcript", () => {
		expect(isPronunciationCorrect(["neko"], createWord())).toBe(true);
	});

	it("accepts kanji transcript matching display writing", () => {
		expect(isPronunciationCorrect(["猫"], createWord())).toBe(true);
	});

	it("accepts kanji transcript when the current word is displayed in hiragana", () => {
		const word = createWord({
			displayWriting: "ねこ",
			displayReading: "ねこ",
			readings: ["ねこ"],
			kanjiWritings: ["猫"],
		});

		expect(isPronunciationCorrect(["猫"], word)).toBe(true);
		expect(isPronunciationCorrect(["猫。"], word)).toBe(true);
	});

	it("accepts any valid reading for words with multiple readings", () => {
		const word = createWord({
			displayWriting: "橋",
			displayReading: "はし",
			readings: ["はし", "ばし"],
			kanjiWritings: ["橋"],
		});

		expect(isPronunciationCorrect(["はし"], word)).toBe(true);
		expect(isPronunciationCorrect(["ばし"], word)).toBe(true);
		expect(isPronunciationCorrect(["hashi"], word)).toBe(true);
		expect(isPronunciationCorrect(["bashi"], word)).toBe(true);
	});

	it("checks all speech recognition alternatives", () => {
		expect(
			isPronunciationCorrect(["いぬ", "neko", "犬"], createWord()),
		).toBe(true);
	});

	it("normalizes spacing and punctuation in transcripts", () => {
		expect(isPronunciationCorrect([" ねこ。"], createWord())).toBe(true);
		expect(isPronunciationCorrect([" neko "], createWord())).toBe(true);
	});

	it("rejects empty transcripts", () => {
		expect(isPronunciationCorrect([], createWord())).toBe(false);
		expect(isPronunciationCorrect(["", "   "], createWord())).toBe(false);
	});

	it("rejects incorrect pronunciation", () => {
		expect(isPronunciationCorrect(["いぬ"], createWord())).toBe(false);
		expect(isPronunciationCorrect(["inu"], createWord())).toBe(false);
	});
});
