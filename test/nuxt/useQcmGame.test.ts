import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GameWord, QcmChoice } from "~/types/game";

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

function createChoice(
	overrides: Partial<QcmChoice> & Pick<QcmChoice, "id">,
): QcmChoice {
	return {
		label: overrides.label ?? overrides.id.toUpperCase(),
		text: overrides.text ?? "answer",
		isCorrect: overrides.isCorrect ?? false,
		...overrides,
	};
}

describe("useQcmGame", () => {
	const fetchMock = vi.fn();

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
		vi.stubGlobal("$fetch", fetchMock);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		fetchMock.mockReset();
	});

	it("loads choices for the current word when enabled", async () => {
		fetchMock.mockResolvedValue({
			romajiChoices: [
				createChoice({ id: "a", text: "neko", isCorrect: true }),
				createChoice({ id: "b", text: "inu" }),
				createChoice({ id: "c", text: "tori" }),
				createChoice({ id: "d", text: "saru" }),
			],
			translationChoices: [
				createChoice({ id: "a", text: "chat", isCorrect: true }),
				createChoice({ id: "b", text: "chien" }),
				createChoice({ id: "c", text: "oiseau" }),
				createChoice({ id: "d", text: "singe" }),
			],
			spokenReading: "ねこ",
			audioUrl: null,
		});

		const words = ref([createGameWord({ id: "1", displayReading: "ねこ" })]);
		const filterQuery = ref({ categories: "nom" });
		const enabled = ref(true);
		const game = useQcmGame(words, filterQuery, enabled);

		await vi.waitFor(() => expect(game.choicesPending.value).toBe(false));

		expect(fetchMock).toHaveBeenCalledWith("/api/words/qcm-choices", {
			query: { wordId: "1", categories: "nom" },
		});
		expect(game.romajiChoices.value).toHaveLength(4);
		expect(game.step.value).toBe("romaji");
	});

	it("moves through romaji, translation and feedback steps", async () => {
		fetchMock.mockResolvedValue({
			romajiChoices: [
				createChoice({ id: "a", text: "neko", isCorrect: true }),
				createChoice({ id: "b", text: "inu" }),
				createChoice({ id: "c", text: "tori" }),
				createChoice({ id: "d", text: "saru" }),
			],
			translationChoices: [
				createChoice({ id: "a", text: "chat", isCorrect: true }),
				createChoice({ id: "b", text: "chien" }),
				createChoice({ id: "c", text: "oiseau" }),
				createChoice({ id: "d", text: "singe" }),
			],
			spokenReading: "ねこ",
			audioUrl: null,
		});

		const words = ref([createGameWord({ id: "1", displayReading: "ねこ" })]);
		const game = useQcmGame(words, ref({}), ref(true));
		await vi.waitFor(() => expect(game.choicesPending.value).toBe(false));

		game.selectRomaji("a");
		expect(game.step.value).toBe("translation");
		expect(game.romajiCorrect.value).toBe(true);

		game.selectTranslation("b");
		expect(game.step.value).toBe("feedback");
		expect(game.translationCorrect.value).toBe(false);
		expect(game.errorCount.value).toBe(1);
	});

	it("goes to results after the last word", async () => {
		fetchMock.mockResolvedValue({
			romajiChoices: [
				createChoice({ id: "a", text: "neko", isCorrect: true }),
				createChoice({ id: "b", text: "inu" }),
				createChoice({ id: "c", text: "tori" }),
				createChoice({ id: "d", text: "saru" }),
			],
			translationChoices: [
				createChoice({ id: "a", text: "chat", isCorrect: true }),
				createChoice({ id: "b", text: "chien" }),
				createChoice({ id: "c", text: "oiseau" }),
				createChoice({ id: "d", text: "singe" }),
			],
			spokenReading: "ねこ",
			audioUrl: null,
		});

		const words = ref([createGameWord({ id: "1", displayReading: "ねこ" })]);
		const game = useQcmGame(words, ref({}), ref(true));
		await vi.waitFor(() => expect(game.choicesPending.value).toBe(false));

		game.selectRomaji("a");
		game.selectTranslation("a");
		game.nextWord();

		expect(game.phase.value).toBe("results");
	});

	it("marks choicesError when the API response is incomplete", async () => {
		fetchMock.mockResolvedValue({
			romajiChoices: null,
			translationChoices: null,
			spokenReading: "ねこ",
			audioUrl: null,
		});

		const words = ref([createGameWord({ id: "1", displayReading: "ねこ" })]);
		const game = useQcmGame(words, ref({}), ref(true));

		await vi.waitFor(() => expect(game.choicesPending.value).toBe(false));

		expect(game.choicesError.value).toBe(true);
	});
});
