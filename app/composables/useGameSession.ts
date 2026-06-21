import type { GamePhase, GameSessionResults, GameWord } from "~/types/game";

export function useGameSession(initialWords: Ref<GameWord[]>) {
	const words = initialWords;
	const currentIndex = ref(0);
	const phase = ref<GamePhase>("playing");

	const errorCount = ref(0);
	const correctAnswerTimes = ref<number[]>([]);
	const wordStartTime = ref(Date.now());

	const currentWord = computed(() => words.value[currentIndex.value] ?? null);
	const currentWordNumber = computed(() => currentIndex.value + 1);
	const totalWords = computed(() => words.value.length);
	const correctCount = computed(() => correctAnswerTimes.value.length);
	const isLastWord = computed(
		() => currentIndex.value >= words.value.length - 1,
	);

	const results = computed((): GameSessionResults => {
		const total = words.value.length;
		const totalCorrectTime = correctAnswerTimes.value.reduce(
			(sum, time) => sum + time,
			0,
		);
		const successCount = correctAnswerTimes.value.length;

		return {
			successCount,
			successPercentage:
				total > 0 ? Math.round((successCount / total) * 100) : 0,
			errorCount: errorCount.value,
			avgTimeMs: successCount > 0 ? totalCorrectTime / successCount : 0,
		};
	});

	function resetWordTimer() {
		wordStartTime.value = Date.now();
	}

	function recordWordResult(allCorrect: boolean) {
		if (!allCorrect) {
			errorCount.value += 1;
		} else {
			correctAnswerTimes.value.push(Date.now() - wordStartTime.value);
		}
	}

	function goToResults() {
		phase.value = "results";
	}

	function advanceToNextOrResults(resetFn: () => void) {
		if (isLastWord.value) {
			goToResults();
			return;
		}

		currentIndex.value += 1;
		resetFn();
	}

	return {
		words,
		currentIndex,
		phase,
		errorCount,
		correctAnswerTimes,
		wordStartTime,
		currentWord,
		currentWordNumber,
		totalWords,
		correctCount,
		isLastWord,
		results,
		resetWordTimer,
		recordWordResult,
		goToResults,
		advanceToNextOrResults,
	};
}
