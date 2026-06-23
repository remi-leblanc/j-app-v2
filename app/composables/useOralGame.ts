import type {
	GameWord,
	OralStep,
	QcmChoice,
	QcmChoiceId,
	QcmChoicesResponse,
} from "~/types/game";

export function useOralGame(
	initialWords: Ref<GameWord[]>,
	filterQuery: Ref<Record<string, string>>,
	enabled: Ref<boolean>,
) {
	const session = useGameSession(initialWords);

	const step = ref<OralStep>("choice");
	const translationChoices = ref<QcmChoice[]>([]);
	const selectedTranslationId = ref<QcmChoiceId | null>(null);
	const translationCorrect = ref(false);
	const audioUrl = ref<string | null>(null);
	const spokenReading = ref("");
	const choicesPending = ref(false);
	const choicesError = ref(false);

	let fetchGeneration = 0;

	const selectedTranslationChoice = computed(() =>
		translationChoices.value.find(
			(choice) => choice.id === selectedTranslationId.value,
		) ?? null,
	);

	const correctTranslationChoice = computed(() =>
		translationChoices.value.find((choice) => choice.isCorrect) ?? null,
	);

	async function initWordChoices() {
		const word = session.currentWord.value;
		if (!word) return;

		const generation = ++fetchGeneration;

		step.value = "choice";
		selectedTranslationId.value = null;
		translationCorrect.value = false;
		translationChoices.value = [];
		audioUrl.value = null;
		spokenReading.value = "";
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

			if (!data.translationChoices || !data.audioUrl) {
				choicesError.value = true;
				return;
			}

			translationChoices.value = data.translationChoices;
			audioUrl.value = data.audioUrl;
			spokenReading.value = data.spokenReading;
		} catch {
			if (generation !== fetchGeneration) return;
			choicesError.value = true;
		} finally {
			if (generation === fetchGeneration) {
				choicesPending.value = false;
			}
		}
	}

	function selectTranslation(id: QcmChoiceId) {
		if (step.value !== "choice" || choicesPending.value) return;

		selectedTranslationId.value = id;
		const choice = translationChoices.value.find((item) => item.id === id);
		translationCorrect.value = choice?.isCorrect ?? false;
		step.value = "feedback";

		session.recordWordResult(translationCorrect.value);
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
		translationChoices,
		selectedTranslationId,
		translationCorrect,
		audioUrl,
		spokenReading,
		choicesPending,
		choicesError,
		selectedTranslationChoice,
		correctTranslationChoice,
		selectTranslation,
		nextWord,
	};
}
