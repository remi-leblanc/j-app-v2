import type {
	ExpressionStep,
	GameWord,
	QcmChoicesResponse,
} from "~/types/game";

export function useExpressionGame(
	initialWords: Ref<GameWord[]>,
	filterQuery: Ref<Record<string, string>>,
	enabled: Ref<boolean>,
) {
	const session = useGameSession(initialWords);

	const step = ref<ExpressionStep>("listen");
	const pronunciationCorrect = ref(false);
	const recognizedTranscript = ref<string | null>(null);
	const isValidated = ref(false);
	const audioUrl = ref<string | null>(null);
	const choicesPending = ref(false);
	const choicesError = ref(false);

	let fetchGeneration = 0;

	function resetWordState() {
		step.value = "listen";
		pronunciationCorrect.value = false;
		recognizedTranscript.value = null;
		isValidated.value = false;
		audioUrl.value = null;
		choicesError.value = false;
		session.resetWordTimer();
	}

	async function initWordAudio() {
		const word = session.currentWord.value;
		if (!word) return;

		const generation = ++fetchGeneration;

		step.value = "listen";
		pronunciationCorrect.value = false;
		recognizedTranscript.value = null;
		isValidated.value = false;
		audioUrl.value = null;
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

			if (!data.audioUrl) {
				choicesError.value = true;
				return;
			}

			audioUrl.value = data.audioUrl;
		} catch {
			if (generation !== fetchGeneration) return;
			choicesError.value = true;
		} finally {
			if (generation === fetchGeneration) {
				choicesPending.value = false;
			}
		}
	}

	function handleRecognitionResult(payload: {
		transcripts: string[];
		bestAlternative: { transcript: string };
	}) {
		const word = session.currentWord.value;
		if (!word || isValidated.value || step.value !== "listen") return;
		if (payload.transcripts.length === 0) return;

		recognizedTranscript.value = payload.bestAlternative.transcript;
		pronunciationCorrect.value = isPronunciationCorrect(payload.transcripts, word);
		session.recordWordResult(pronunciationCorrect.value);
		isValidated.value = true;
		step.value = "feedback";
	}

	function skipWord() {
		const word = session.currentWord.value;
		if (!word || isValidated.value || step.value !== "listen") return;

		pronunciationCorrect.value = false;
		session.recordWordResult(false);
		isValidated.value = true;
		step.value = "feedback";
	}

	function nextWord() {
		if (!isValidated.value) return;

		session.advanceToNextOrResults(resetWordState);
	}

	watch(
		() => [enabled.value, session.currentWord.value?.id] as const,
		([isEnabled, wordId]) => {
			if (isEnabled && wordId) initWordAudio();
		},
		{ immediate: true },
	);

	return {
		...session,
		step,
		pronunciationCorrect,
		recognizedTranscript,
		isValidated,
		audioUrl,
		choicesPending,
		choicesError,
		handleRecognitionResult,
		skipWord,
		nextWord,
	};
}
