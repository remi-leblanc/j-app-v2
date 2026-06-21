import type {
	GameWord,
	GameWordSense,
	QcmChoice,
	QcmChoiceId,
} from "~/types/game";
import {
	formatAcceptedTranslations,
	getPrimaryRomajiAnswer,
	normalizeRomaji,
	normalizeText,
} from "~/utils/answer-validation";

const CHOICE_IDS: QcmChoiceId[] = ["a", "b", "c", "d"];
const CHOICE_LABELS = ["A", "B", "C", "D"];

export function formatSenseText(glosses: string[]): string {
	return formatAcceptedTranslations(glosses);
}

export function pickRandomSense(word: GameWord): GameWordSense {
	const eligible = word.senses.slice(0, 2);
	if (eligible.length === 0) {
		return word.senses[0] ?? { glosses: [] };
	}
	const index = Math.floor(Math.random() * eligible.length);
	return eligible[index]!;
}

export function pickRomajiFromWord(word: GameWord): string {
	return getPrimaryRomajiAnswer(word.displayReading);
}

function shuffle<T>(items: T[]): T[] {
	const copy = [...items];
	for (let i = copy.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j]!, copy[i]!];
	}
	return copy;
}

function buildChoices(
	correctText: string,
	distractorPool: string[],
	isSame: (a: string, b: string) => boolean,
): QcmChoice[] | null {
	const uniqueDistractors: string[] = [];

	for (const candidate of shuffle(distractorPool)) {
		if (isSame(candidate, correctText)) continue;
		if (uniqueDistractors.some((d) => isSame(d, candidate))) continue;
		uniqueDistractors.push(candidate);
		if (uniqueDistractors.length === 3) break;
	}

	if (uniqueDistractors.length < 3) return null;

	const options = shuffle([correctText, ...uniqueDistractors]);
	return options.map((text, index) => ({
		id: CHOICE_IDS[index]!,
		label: CHOICE_LABELS[index]!,
		text,
		isCorrect: isSame(text, correctText),
	}));
}

export function buildRomajiChoices(
	currentWord: GameWord,
	allWords: GameWord[],
): QcmChoice[] | null {
	const correctText = pickRomajiFromWord(currentWord);

	const distractorPool = allWords
		.filter((word) => word.id !== currentWord.id)
		.map((word) => pickRomajiFromWord(word));

	return buildChoices(
		correctText,
		distractorPool,
		(a, b) => normalizeRomaji(a) === normalizeRomaji(b),
	);
}

export function buildTranslationChoices(
	currentWord: GameWord,
	allWords: GameWord[],
	targetSense: GameWordSense,
): QcmChoice[] | null {
	const correctText = formatSenseText(targetSense.glosses);

	const distractorPool = allWords
		.filter((word) => word.id !== currentWord.id)
		.map((word) => formatSenseText(pickRandomSense(word).glosses));

	return buildChoices(
		correctText,
		distractorPool,
		(a, b) => normalizeText(a) === normalizeText(b),
	);
}

export function canGenerateQcmChoices(allWords: GameWord[]): boolean {
	if (allWords.length < 4) return false;

	for (const word of allWords) {
		if (!buildRomajiChoices(word, allWords)) return false;

		const eligibleSenses = word.senses.slice(0, 2);
		const hasValidTranslation = eligibleSenses.some((sense) =>
			buildTranslationChoices(word, allWords, sense),
		);
		if (!hasValidTranslation) return false;
	}

	return true;
}
