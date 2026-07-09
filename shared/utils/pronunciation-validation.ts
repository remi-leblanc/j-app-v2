import { isKana, isRomaji, toHiragana } from "wanakana";

import {
	getAcceptedRomajiAnswers,
	normalizeRomaji,
} from "./answer-validation";
import { stripJapanesePunctuation } from "./japanese-text";

export interface PronunciationWord {
	displayWriting: string;
	displayReading: string;
	readings: string[];
	kanjiWritings?: string[];
}

function normalizeJapaneseText(text: string): string {
	return toHiragana(stripJapanesePunctuation(text));
}

function getAcceptedHiraganaForms(word: PronunciationWord): string[] {
	const forms = new Set<string>();

	for (const reading of [word.displayReading, ...word.readings]) {
		const normalizedReading = normalizeJapaneseText(reading);
		if (normalizedReading) forms.add(normalizedReading);
	}

	return [...forms];
}

function isKanjiTranscriptMatchingWord(
	transcript: string,
	word: PronunciationWord,
): boolean {
	const cleaned = stripJapanesePunctuation(transcript);
	if (!cleaned) return false;

	if (cleaned === word.displayWriting) return true;

	return word.kanjiWritings?.includes(cleaned) ?? false;
}

function normalizeTranscriptToHiragana(transcript: string): string {
	const cleaned = stripJapanesePunctuation(transcript);
	if (!cleaned) return "";

	return normalizeJapaneseText(cleaned);
}

export function isPronunciationCorrect(
	transcripts: string[],
	word: PronunciationWord,
): boolean {
	const acceptedHiragana = getAcceptedHiraganaForms(word);
	if (acceptedHiragana.length === 0) return false;

	const acceptedRomaji = getAcceptedRomajiAnswers(word.readings);

	for (const transcript of transcripts) {
		if (isKanjiTranscriptMatchingWord(transcript, word)) return true;

		const hiragana = normalizeTranscriptToHiragana(transcript);
		if (hiragana && acceptedHiragana.includes(hiragana)) return true;

		const cleaned = stripJapanesePunctuation(transcript);
		if (cleaned && isRomaji(cleaned)) {
			const romaji = normalizeRomaji(cleaned);
			if (romaji && acceptedRomaji.includes(romaji)) return true;
		}
	}

	return false;
}
