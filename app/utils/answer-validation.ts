import { isKana, toRomaji } from "wanakana";

export function normalizeText(text: string): string {
	return text
		.trim()
		.replace(/\(.*?\)/g, "")
		.trim()
		.toLowerCase()
		.normalize("NFD")
		.replace(/\p{M}/gu, "");
}

export function normalizeRomaji(text: string): string {
	const trimmed = text.trim();
	if (!trimmed) return "";

	const converted = isKana(trimmed) ? toRomaji(trimmed) : trimmed;
	return normalizeText(converted);
}

export function getAcceptedRomajiAnswers(readings: string[]): string[] {
	return [...new Set(readings.map((reading) => normalizeRomaji(toRomaji(reading))))];
}

export function getPrimaryRomajiAnswer(displayReading: string): string {
	return normalizeRomaji(toRomaji(displayReading));
}

export function isRomajiCorrect(input: string, readings: string[]): boolean {
	const normalizedInput = normalizeRomaji(input);
	if (!normalizedInput) return false;

	const accepted = getAcceptedRomajiAnswers(readings);
	return accepted.includes(normalizedInput);
}

export function isTranslationCorrect(input: string, translations: string[]): boolean {
	const normalizedInput = normalizeText(input);
	if (!normalizedInput) return false;

	return translations.some((translation) => normalizeText(translation) === normalizedInput);
}

export function formatAcceptedTranslations(translations: string[]): string {
	return translations.join(", ");
}
