import { afterEach, describe, expect, it, vi } from "vitest";
import type { GameWord, GameWordSense } from "../../app/types/game";
import {
	buildRomajiChoices,
	buildTranslationChoices,
	formatSenseText,
	pickRandomSense,
	pickRomajiFromWord,
} from "../../shared/utils/qcm-choices";

function createGameWord(
	overrides: Partial<GameWord> & Pick<GameWord, "id" | "displayReading">,
): GameWord {
	return {
		displayWriting: overrides.displayWriting ?? overrides.displayReading,
		readings: overrides.readings ?? [overrides.displayReading],
		translations: overrides.translations ?? ["traduction"],
		senses: overrides.senses ?? [{ glosses: ["traduction"] }],
		...overrides,
	};
}

describe("formatSenseText", () => {
	it("joins glosses with a comma and space", () => {
		expect(formatSenseText(["chat", "félin"])).toBe("chat, félin");
	});
});

describe("pickRandomSense", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("picks only among the first two senses", () => {
		const word = createGameWord({
			id: "1",
			displayReading: "はし",
			senses: [
				{ glosses: ["pont"] },
				{ glosses: ["baguettes"] },
				{ glosses: ["bord"] },
			],
		});

		vi.spyOn(Math, "random").mockReturnValue(0);
		expect(pickRandomSense(word)).toEqual({ glosses: ["pont"] });

		vi.spyOn(Math, "random").mockReturnValue(0.99);
		expect(pickRandomSense(word)).toEqual({ glosses: ["baguettes"] });
	});

	it("returns an empty sense when no senses exist", () => {
		const word = createGameWord({
			id: "1",
			displayReading: "はし",
			senses: [],
		});

		expect(pickRandomSense(word)).toEqual({ glosses: [] });
	});
});

describe("pickRomajiFromWord", () => {
	it("returns normalized romaji from the display reading", () => {
		const word = createGameWord({
			id: "1",
			displayReading: "ねこ",
		});

		expect(pickRomajiFromWord(word)).toBe("neko");
	});
});

describe("buildRomajiChoices", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns four choices with exactly one correct romaji", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);

		const currentWord = createGameWord({ id: "1", displayReading: "ねこ" });
		const distractorWords = [
			createGameWord({ id: "2", displayReading: "いぬ" }),
			createGameWord({ id: "3", displayReading: "とり" }),
			createGameWord({ id: "4", displayReading: "さる" }),
			createGameWord({ id: "5", displayReading: "うさぎ" }),
		];

		const choices = buildRomajiChoices(currentWord, distractorWords);

		expect(choices).not.toBeNull();
		expect(choices).toHaveLength(4);
		expect(choices!.filter((choice) => choice.isCorrect)).toHaveLength(1);
		expect(choices!.find((choice) => choice.isCorrect)?.text).toBe("neko");
		expect(choices!.map((choice) => choice.id)).toEqual(["a", "b", "c", "d"]);
		expect(choices!.map((choice) => choice.label)).toEqual([
			"A",
			"B",
			"C",
			"D",
		]);
	});

	it("excludes the current word from distractors", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);

		const currentWord = createGameWord({ id: "1", displayReading: "ねこ" });
		const distractorWords = [
			currentWord,
			createGameWord({ id: "2", displayReading: "いぬ" }),
			createGameWord({ id: "3", displayReading: "とり" }),
			createGameWord({ id: "4", displayReading: "さる" }),
		];

		const choices = buildRomajiChoices(currentWord, distractorWords);

		expect(choices).not.toBeNull();
		const wrongAnswers = choices!.filter((choice) => !choice.isCorrect);
		expect(wrongAnswers.map((choice) => choice.text)).not.toContain("neko");
		expect(wrongAnswers).toHaveLength(3);
	});

	it("deduplicates romaji distractors", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);

		const currentWord = createGameWord({ id: "1", displayReading: "ねこ" });
		const distractorWords = [
			createGameWord({ id: "2", displayReading: "いぬ" }),
			createGameWord({ id: "3", displayReading: "イヌ" }),
			createGameWord({ id: "4", displayReading: "とり" }),
			createGameWord({ id: "5", displayReading: "さる" }),
		];

		const choices = buildRomajiChoices(currentWord, distractorWords);

		expect(choices).not.toBeNull();
		const wrongTexts = choices!
			.filter((choice) => !choice.isCorrect)
			.map((choice) => choice.text);
		expect(new Set(wrongTexts).size).toBe(3);
	});

	it("returns null when fewer than three unique distractors are available", () => {
		const currentWord = createGameWord({ id: "1", displayReading: "ねこ" });
		const distractorWords = [
			createGameWord({ id: "2", displayReading: "いぬ" }),
			createGameWord({ id: "3", displayReading: "とり" }),
		];

		expect(buildRomajiChoices(currentWord, distractorWords)).toBeNull();
	});
});

describe("buildTranslationChoices", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns four choices with the target sense as the correct answer", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);

		const currentWord = createGameWord({
			id: "1",
			displayReading: "はし",
			senses: [
				{ glosses: ["pont"] },
				{ glosses: ["baguettes"] },
			],
		});
		const targetSense: GameWordSense = { glosses: ["pont", "passerelle"] };
		const distractorWords = [
			createGameWord({
				id: "2",
				displayReading: "いぬ",
				senses: [{ glosses: ["chien"] }],
			}),
			createGameWord({
				id: "3",
				displayReading: "とり",
				senses: [{ glosses: ["oiseau"] }],
			}),
			createGameWord({
				id: "4",
				displayReading: "さる",
				senses: [{ glosses: ["singe"] }],
			}),
		];

		const choices = buildTranslationChoices(
			currentWord,
			distractorWords,
			targetSense,
		);

		expect(choices).not.toBeNull();
		expect(choices).toHaveLength(4);
		expect(choices!.filter((choice) => choice.isCorrect)).toHaveLength(1);
		expect(choices!.find((choice) => choice.isCorrect)?.text).toBe(
			"pont, passerelle",
		);
	});

	it("excludes the current word from translation distractors", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);

		const currentWord = createGameWord({
			id: "1",
			displayReading: "ねこ",
			senses: [{ glosses: ["chat"] }],
		});
		const distractorWords = [
			currentWord,
			createGameWord({
				id: "2",
				displayReading: "いぬ",
				senses: [{ glosses: ["chien"] }],
			}),
			createGameWord({
				id: "3",
				displayReading: "とり",
				senses: [{ glosses: ["oiseau"] }],
			}),
			createGameWord({
				id: "4",
				displayReading: "さる",
				senses: [{ glosses: ["singe"] }],
			}),
		];

		const choices = buildTranslationChoices(
			currentWord,
			distractorWords,
			{ glosses: ["chat"] },
		);

		expect(choices).not.toBeNull();
		const wrongAnswers = choices!.filter((choice) => !choice.isCorrect);
		expect(wrongAnswers.map((choice) => choice.text)).not.toContain("chat");
	});

	it("returns null when fewer than three unique translation distractors are available", () => {
		const currentWord = createGameWord({
			id: "1",
			displayReading: "ねこ",
			senses: [{ glosses: ["chat"] }],
		});
		const distractorWords = [
			createGameWord({
				id: "2",
				displayReading: "いぬ",
				senses: [{ glosses: ["chien"] }],
			}),
			createGameWord({
				id: "3",
				displayReading: "とり",
				senses: [{ glosses: ["oiseau"] }],
			}),
		];

		expect(
			buildTranslationChoices(currentWord, distractorWords, {
				glosses: ["chat"],
			}),
		).toBeNull();
	});
});
