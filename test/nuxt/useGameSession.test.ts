import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GameWord } from "~/types/game";

function createGameWord(
	overrides: Partial<GameWord> & Pick<GameWord, "id" | "displayReading">,
): GameWord {
	return {
		displayWriting: overrides.displayWriting ?? overrides.displayReading,
		readings: overrides.readings ?? [overrides.displayReading],
		kanjiWritings: overrides.kanjiWritings ?? [],
		translations: overrides.translations ?? ["chat"],
		senses: overrides.senses ?? [{ glosses: ["chat"] }],
		...overrides,
	};
}

describe("useGameSession", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("starts in playing phase on the first word", () => {
		const words = ref([
			createGameWord({ id: "1", displayReading: "ねこ" }),
			createGameWord({ id: "2", displayReading: "いぬ" }),
		]);
		const session = useGameSession(words);

		expect(session.phase.value).toBe("playing");
		expect(session.currentIndex.value).toBe(0);
		expect(session.currentWord.value?.id).toBe("1");
		expect(session.currentWordNumber.value).toBe(1);
		expect(session.totalWords.value).toBe(2);
		expect(session.isLastWord.value).toBe(false);
	});

	it("records errors and successful answer times", () => {
		const words = ref([createGameWord({ id: "1", displayReading: "ねこ" })]);
		const session = useGameSession(words);

		session.recordWordResult(false);
		expect(session.errorCount.value).toBe(1);
		expect(session.correctCount.value).toBe(0);

		session.resetWordTimer();
		vi.advanceTimersByTime(1500);
		session.recordWordResult(true);
		expect(session.errorCount.value).toBe(1);
		expect(session.correctAnswerTimes.value).toEqual([1500]);
	});

	it("computes results from recorded answers", () => {
		const words = ref([
			createGameWord({ id: "1", displayReading: "ねこ" }),
			createGameWord({ id: "2", displayReading: "いぬ" }),
		]);
		const session = useGameSession(words);

		session.resetWordTimer();
		vi.advanceTimersByTime(1000);
		session.recordWordResult(true);
		session.recordWordResult(false);

		expect(session.results.value).toEqual({
			successCount: 1,
			successPercentage: 50,
			errorCount: 1,
			avgTimeMs: 1000,
		});
	});

	it("advances to the next word or results", () => {
		const words = ref([
			createGameWord({ id: "1", displayReading: "ねこ" }),
			createGameWord({ id: "2", displayReading: "いぬ" }),
		]);
		const session = useGameSession(words);
		const resetFn = vi.fn();

		session.advanceToNextOrResults(resetFn);
		expect(session.currentIndex.value).toBe(1);
		expect(resetFn).toHaveBeenCalledOnce();

		session.advanceToNextOrResults(resetFn);
		expect(session.phase.value).toBe("results");
		expect(session.currentIndex.value).toBe(1);
	});
});
