import { describe, expect, it } from "vitest";
import {
	formatAcceptedTranslations,
	getAcceptedRomajiAnswers,
	getPrimaryRomajiAnswer,
	isRomajiCorrect,
	isTranslationCorrect,
	normalizeRomaji,
	normalizeText,
} from "../../shared/utils/answer-validation";

describe("normalizeText", () => {
	it("trims whitespace and lowercases", () => {
		expect(normalizeText("  Bonjour  ")).toBe("bonjour");
	});

	it("strips diacritics", () => {
		expect(normalizeText("Café")).toBe("cafe");
		expect(normalizeText("être")).toBe("etre");
	});

	it("removes parenthetical content", () => {
		expect(normalizeText("mot (familier)")).toBe("mot");
	});

	it("applies all normalizations together", () => {
		expect(normalizeText("  Être (verbe)  ")).toBe("etre");
	});
});

describe("normalizeRomaji", () => {
	it("returns empty string for blank input", () => {
		expect(normalizeRomaji("")).toBe("");
		expect(normalizeRomaji("   ")).toBe("");
	});

	it("normalizes latin romaji", () => {
		expect(normalizeRomaji("  Neko  ")).toBe("neko");
	});

	it("converts kana input to normalized romaji", () => {
		expect(normalizeRomaji("ねこ")).toBe("neko");
	});
});

describe("getAcceptedRomajiAnswers", () => {
	it("deduplicates equivalent readings", () => {
		const accepted = getAcceptedRomajiAnswers(["ねこ", "ネコ"]);
		expect(accepted).toEqual(["neko"]);
	});

	it("returns multiple distinct romaji forms", () => {
		const accepted = getAcceptedRomajiAnswers(["はし", "ばし"]);
		expect(accepted).toContain("hashi");
		expect(accepted).toContain("bashi");
		expect(accepted).toHaveLength(2);
	});
});

describe("getPrimaryRomajiAnswer", () => {
	it("returns normalized romaji from a display reading", () => {
		expect(getPrimaryRomajiAnswer("いぬ")).toBe("inu");
	});
});

describe("isRomajiCorrect", () => {
	const readings = ["ねこ", "ネコ"];

	it("accepts a correct romaji answer", () => {
		expect(isRomajiCorrect("neko", readings)).toBe(true);
	});

	it("is case-insensitive", () => {
		expect(isRomajiCorrect("NEKO", readings)).toBe(true);
	});

	it("accepts kana input converted to romaji", () => {
		expect(isRomajiCorrect("ねこ", readings)).toBe(true);
	});

	it("rejects empty input", () => {
		expect(isRomajiCorrect("", readings)).toBe(false);
		expect(isRomajiCorrect("   ", readings)).toBe(false);
	});

	it("rejects an incorrect answer", () => {
		expect(isRomajiCorrect("inu", readings)).toBe(false);
	});
});

describe("isTranslationCorrect", () => {
	const translations = ["chat", "félin"];

	it("accepts an exact translation", () => {
		expect(isTranslationCorrect("chat", translations)).toBe(true);
	});

	it("is accent-insensitive on input", () => {
		expect(isTranslationCorrect("félin", translations)).toBe(true);
	});

	it("is accent-insensitive on expected translations", () => {
		expect(isTranslationCorrect("felin", ["félin"])).toBe(true);
	});

	it("accepts any translation from the list", () => {
		expect(isTranslationCorrect("felin", translations)).toBe(true);
	});

	it("rejects empty input", () => {
		expect(isTranslationCorrect("", translations)).toBe(false);
	});

	it("rejects an incorrect translation", () => {
		expect(isTranslationCorrect("chien", translations)).toBe(false);
	});
});

describe("formatAcceptedTranslations", () => {
	it("joins translations with a comma and space", () => {
		expect(formatAcceptedTranslations(["chat", "félin"])).toBe("chat, félin");
	});
});
