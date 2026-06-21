import type {
	GameWord,
	QcmChoice,
	QcmChoiceId,
	QcmStep,
} from "~/types/game";
import {
	buildRomajiChoices,
	buildTranslationChoices,
	pickRandomSense,
} from "~/utils/qcm-choices";

export function useQcmGame(initialWords: Ref<GameWord[]>) {
	const session = useGameSession(initialWords);

	const step = ref<QcmStep>("romaji");
	const romajiChoices = ref<QcmChoice[]>([]);
	const translationChoices = ref<QcmChoice[]>([]);
	const selectedRomajiId = ref<QcmChoiceId | null>(null);
	const selectedTranslationId = ref<QcmChoiceId | null>(null);
	const romajiCorrect = ref(false);
	const translationCorrect = ref(false);

	const selectedRomajiChoice = computed(() =>
		romajiChoices.value.find((choice) => choice.id === selectedRomajiId.value) ?? null,
	);

	const selectedTranslationChoice = computed(() =>
		translationChoices.value.find(
			(choice) => choice.id === selectedTranslationId.value,
		) ?? null,
	);

	const correctRomajiChoice = computed(() =>
		romajiChoices.value.find((choice) => choice.isCorrect) ?? null,
	);

	const correctTranslationChoice = computed(() =>
		translationChoices.value.find((choice) => choice.isCorrect) ?? null,
	);

	function initWordChoices() {
		const word = session.currentWord.value;
		if (!word) return;

		step.value = "romaji";
		selectedRomajiId.value = null;
		selectedTranslationId.value = null;
		romajiCorrect.value = false;
		translationCorrect.value = false;
		session.resetWordTimer();

		const sense = pickRandomSense(word);
		romajiChoices.value = buildRomajiChoices(word, session.words.value) ?? [];
		translationChoices.value =
			buildTranslationChoices(word, session.words.value, sense) ?? [];
	}

	function selectRomaji(id: QcmChoiceId) {
		if (step.value !== "romaji") return;

		selectedRomajiId.value = id;
		const choice = romajiChoices.value.find((item) => item.id === id);
		romajiCorrect.value = choice?.isCorrect ?? false;
		step.value = "translation";
	}

	function selectTranslation(id: QcmChoiceId) {
		if (step.value !== "translation") return;

		selectedTranslationId.value = id;
		const choice = translationChoices.value.find((item) => item.id === id);
		translationCorrect.value = choice?.isCorrect ?? false;
		step.value = "feedback";

		session.recordWordResult(
			romajiCorrect.value && translationCorrect.value,
		);
	}

	function nextWord() {
		if (step.value !== "feedback") return;

		if (session.isLastWord.value) {
			session.goToResults();
			return;
		}

		session.currentIndex.value += 1;
	}

	watch(
		() => session.currentWord.value?.id,
		(wordId) => {
			if (wordId) initWordChoices();
		},
		{ immediate: true },
	);

	return {
		...session,
		step,
		romajiChoices,
		translationChoices,
		selectedRomajiId,
		selectedTranslationId,
		romajiCorrect,
		translationCorrect,
		selectedRomajiChoice,
		selectedTranslationChoice,
		correctRomajiChoice,
		correctTranslationChoice,
		selectRomaji,
		selectTranslation,
		nextWord,
	};
}
