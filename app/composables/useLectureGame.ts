import type { GameWord } from "~/types/game";

export function useLectureGame(initialWords: Ref<GameWord[]>) {
	const session = useGameSession(initialWords);

	const romajiInput = ref("");
	const translationInput = ref("");
	const isValidated = ref(false);
	const romajiCorrect = ref(false);
	const translationCorrect = ref(false);

	const canValidate = computed(
		() =>
			romajiInput.value.trim().length > 0 &&
			translationInput.value.trim().length > 0,
	);

	function resetWordState() {
		romajiInput.value = "";
		translationInput.value = "";
		isValidated.value = false;
		romajiCorrect.value = false;
		translationCorrect.value = false;
		session.resetWordTimer();
	}

	function validate() {
		const word = session.currentWord.value;
		if (!word || isValidated.value || !canValidate.value) return;

		romajiCorrect.value = isRomajiCorrect(
			romajiInput.value,
			word.readings,
		);
		translationCorrect.value = isTranslationCorrect(
			translationInput.value,
			word.translations,
		);

		session.recordWordResult(
			romajiCorrect.value && translationCorrect.value,
		);
		isValidated.value = true;
	}

	function nextWord() {
		if (!isValidated.value) {
			validate();
			return;
		}

		session.advanceToNextOrResults(resetWordState);
	}

	return {
		...session,
		romajiInput,
		translationInput,
		isValidated,
		romajiCorrect,
		translationCorrect,
		canValidate,
		validate,
		nextWord,
	};
}
