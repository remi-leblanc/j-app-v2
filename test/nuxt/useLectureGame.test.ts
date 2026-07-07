import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GameWord } from "~/types/game";

function createGameWord(
	overrides: Partial<GameWord> & Pick<GameWord, "id" | "displayReading">,
): GameWord {
	return {
		displayWriting: overrides.displayWriting ?? overrides.displayReading,
		readings: overrides.readings ?? [overrides.displayReading],
		translations: overrides.translations ?? ["chat"],
		senses: overrides.senses ?? [{ glosses: ["chat"] }],
		...overrides,
	};
}

describe("useLectureGame", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("requires both inputs before validation", () => {
		const words = ref([createGameWord({ id: "1", displayReading: "ねこ" })]);
		const game = useLectureGame(words);

		expect(game.canValidate.value).toBe(false);

		game.romajiInput.value = "neko";
		expect(game.canValidate.value).toBe(false);

		game.translationInput.value = "chat";
		expect(game.canValidate.value).toBe(true);
	});

	it("validates romaji and translation independently", () => {
		const words = ref([
			createGameWord({
				id: "1",
				displayReading: "ねこ",
				translations: ["chat"],
			}),
		]);
		const game = useLectureGame(words);

		game.romajiInput.value = "neko";
		game.translationInput.value = "chien";
		game.validate();

		expect(game.isValidated.value).toBe(true);
		expect(game.romajiCorrect.value).toBe(true);
		expect(game.translationCorrect.value).toBe(false);
		expect(game.errorCount.value).toBe(1);
	});

	it("counts a word as correct only when both answers are right", () => {
		const words = ref([
			createGameWord({
				id: "1",
				displayReading: "ねこ",
				translations: ["chat"],
			}),
		]);
		const game = useLectureGame(words);

		game.romajiInput.value = "neko";
		game.translationInput.value = "chat";
		game.validate();

		expect(game.errorCount.value).toBe(0);
		expect(game.correctCount.value).toBe(1);
	});

	it("validates on next when not yet validated, then advances", () => {
		const words = ref([
			createGameWord({ id: "1", displayReading: "ねこ" }),
			createGameWord({ id: "2", displayReading: "いぬ" }),
		]);
		const game = useLectureGame(words);

		game.romajiInput.value = "neko";
		game.translationInput.value = "chat";
		game.nextWord();

		expect(game.isValidated.value).toBe(true);
		expect(game.currentIndex.value).toBe(0);

		game.nextWord();
		expect(game.currentIndex.value).toBe(1);
		expect(game.romajiInput.value).toBe("");
		expect(game.translationInput.value).toBe("");
		expect(game.isValidated.value).toBe(false);
	});
});
