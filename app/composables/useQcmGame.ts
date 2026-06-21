import type {
	GameWord,
	QcmChoice,
	QcmChoiceId,
	QcmChoicesResponse,
	QcmStep,
} from "~/types/game";

export function useQcmGame(
	initialWords: Ref<GameWord[]>,
	filterQuery: Ref<Record<string, string>>,
	enabled: Ref<boolean>,
) {
	const session = useGameSession(initialWords);

	const step = ref<QcmStep>("romaji");
	const romajiChoices = ref<QcmChoice[]>([]);
	const translationChoices = ref<QcmChoice[]>([]);
	const selectedRomajiId = ref<QcmChoiceId | null>(null);
	const selectedTranslationId = ref<QcmChoiceId | null>(null);
	const romajiCorrect = ref(false);
	const translationCorrect = ref(false);
	const choicesPending = ref(false);
	const choicesError = ref(false);

	let fetchGeneration = 0;

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

	async function initWordChoices() {
		const word = session.currentWord.value;
		if (!word) return;

		const generation = ++fetchGeneration;

		step.value = "romaji";
		selectedRomajiId.value = null;
		selectedTranslationId.value = null;
		romajiCorrect.value = false;
		translationCorrect.value = false;
		romajiChoices.value = [];
		translationChoices.value = [];
		choicesError.value = false;
		choicesPending.value = true;
		session.resetWordTimer();

		try {
			const data = await $fetch<QcmChoicesResponse>("/api/words/qcm-choices", {
				query: {
					wordId: word.id,
					...filterQuery.value,
				},
			});

			if (generation !== fetchGeneration) return;

			if (!data.romajiChoices || !data.translationChoices) {
				choicesError.value = true;
				return;
			}

			romajiChoices.value = data.romajiChoices;
			translationChoices.value = data.translationChoices;
		} catch {
			if (generation !== fetchGeneration) return;
			choicesError.value = true;
		} finally {
			if (generation === fetchGeneration) {
				choicesPending.value = false;
			}
		}
	}

	function selectRomaji(id: QcmChoiceId) {
		if (step.value !== "romaji" || choicesPending.value) return;

		selectedRomajiId.value = id;
		const choice = romajiChoices.value.find((item) => item.id === id);
		romajiCorrect.value = choice?.isCorrect ?? false;
		step.value = "translation";
	}

	function selectTranslation(id: QcmChoiceId) {
		if (step.value !== "translation" || choicesPending.value) return;

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
		() => [enabled.value, session.currentWord.value?.id] as const,
		([isEnabled, wordId]) => {
			if (isEnabled && wordId) initWordChoices();
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
		choicesPending,
		choicesError,
		selectedRomajiChoice,
		selectedTranslationChoice,
		correctRomajiChoice,
		correctTranslationChoice,
		selectRomaji,
		selectTranslation,
		nextWord,
	};
}
