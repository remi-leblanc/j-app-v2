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

describe("useExpressionGame", () => {
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

	it("loads audio for the current word when enabled", async () => {
		fetchMock.mockResolvedValue({
			romajiChoices: null,
			translationChoices: null,
			spokenReading: "ねこ",
			audioUrl: "/api/audio?wordId=1&reading=ねこ",
		});

		const words = ref([createGameWord({ id: "1", displayReading: "ねこ" })]);
		const filterQuery = ref({ categories: "nom" });
		const enabled = ref(true);
		const game = useExpressionGame(words, filterQuery, enabled);

		await vi.waitFor(() => expect(game.choicesPending.value).toBe(false));

		expect(fetchMock).toHaveBeenCalledWith("/api/words/qcm-choices", {
			query: { wordId: "1", categories: "nom" },
		});
		expect(game.audioUrl.value).toBe("/api/audio?wordId=1&reading=ねこ");
		expect(game.step.value).toBe("listen");
	});

	it("validates pronunciation and moves to feedback", async () => {
		fetchMock.mockResolvedValue({
			romajiChoices: null,
			translationChoices: null,
			spokenReading: "ねこ",
			audioUrl: "/api/audio?wordId=1&reading=ねこ",
		});

		const words = ref([createGameWord({ id: "1", displayReading: "ねこ" })]);
		const game = useExpressionGame(words, ref({}), ref(true));

		await vi.waitFor(() => expect(game.choicesPending.value).toBe(false));

		game.handleRecognitionResult({
			transcripts: ["neko"],
			bestAlternative: { transcript: "neko", confidence: 0.9 },
		});

		expect(game.isValidated.value).toBe(true);
		expect(game.pronunciationCorrect.value).toBe(true);
		expect(game.recognizedTranscript.value).toBe("neko");
		expect(game.step.value).toBe("feedback");
		expect(game.errorCount.value).toBe(0);
	});

	it("accepts kanji speech recognition when the word is displayed in hiragana", async () => {
		fetchMock.mockResolvedValue({
			romajiChoices: null,
			translationChoices: null,
			spokenReading: "ねこ",
			audioUrl: "/api/audio?wordId=1&reading=ねこ",
		});

		const words = ref([
			createGameWord({
				id: "1",
				displayReading: "ねこ",
				kanjiWritings: ["猫"],
			}),
		]);
		const game = useExpressionGame(words, ref({}), ref(true));

		await vi.waitFor(() => expect(game.choicesPending.value).toBe(false));

		game.handleRecognitionResult({
			transcripts: ["猫"],
			bestAlternative: { transcript: "猫", confidence: 0.9 },
		});

		expect(game.pronunciationCorrect.value).toBe(true);
		expect(game.recognizedTranscript.value).toBe("猫");
	});

	it("records an error for incorrect pronunciation", async () => {
		fetchMock.mockResolvedValue({
			romajiChoices: null,
			translationChoices: null,
			spokenReading: "ねこ",
			audioUrl: "/api/audio?wordId=1&reading=ねこ",
		});

		const words = ref([createGameWord({ id: "1", displayReading: "ねこ" })]);
		const game = useExpressionGame(words, ref({}), ref(true));

		await vi.waitFor(() => expect(game.choicesPending.value).toBe(false));

		game.handleRecognitionResult({
			transcripts: ["inu", "いぬ"],
			bestAlternative: { transcript: "inu", confidence: 0.95 },
		});

		expect(game.pronunciationCorrect.value).toBe(false);
		expect(game.recognizedTranscript.value).toBe("inu");
		expect(game.step.value).toBe("feedback");
		expect(game.errorCount.value).toBe(1);
	});

	it("counts a skipped word as incorrect", async () => {
		fetchMock.mockResolvedValue({
			romajiChoices: null,
			translationChoices: null,
			spokenReading: "ねこ",
			audioUrl: "/api/audio?wordId=1&reading=ねこ",
		});

		const words = ref([createGameWord({ id: "1", displayReading: "ねこ" })]);
		const game = useExpressionGame(words, ref({}), ref(true));

		await vi.waitFor(() => expect(game.choicesPending.value).toBe(false));

		game.skipWord();

		expect(game.isValidated.value).toBe(true);
		expect(game.pronunciationCorrect.value).toBe(false);
		expect(game.step.value).toBe("feedback");
		expect(game.errorCount.value).toBe(1);
	});

	it("advances to the next word after feedback", async () => {
		fetchMock.mockResolvedValue({
			romajiChoices: null,
			translationChoices: null,
			spokenReading: "ねこ",
			audioUrl: "/api/audio?wordId=1&reading=ねこ",
		});

		const words = ref([
			createGameWord({ id: "1", displayReading: "ねこ" }),
			createGameWord({ id: "2", displayReading: "いぬ" }),
		]);
		const game = useExpressionGame(words, ref({}), ref(true));

		await vi.waitFor(() => expect(game.choicesPending.value).toBe(false));

		game.handleRecognitionResult({
			transcripts: ["neko"],
			bestAlternative: { transcript: "neko", confidence: 0.9 },
		});
		game.nextWord();

		expect(game.currentWord.value?.id).toBe("2");
		expect(game.isValidated.value).toBe(false);
		expect(game.recognizedTranscript.value).toBe(null);
		expect(game.step.value).toBe("listen");
	});

	it("sets choicesError when audio is unavailable", async () => {
		fetchMock.mockResolvedValue({
			romajiChoices: null,
			translationChoices: null,
			spokenReading: "ねこ",
			audioUrl: null,
		});

		const words = ref([createGameWord({ id: "1", displayReading: "ねこ" })]);
		const game = useExpressionGame(words, ref({}), ref(true));

		await vi.waitFor(() => expect(game.choicesPending.value).toBe(false));

		expect(game.choicesError.value).toBe(true);
	});
});
