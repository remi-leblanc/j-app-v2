export interface KanjiForm {
	text: string;
	common: boolean;
	tags: string[];
	position: number;
}

export interface KanaForm {
	text: string;
	common: boolean;
	tags: string[];
	appliesToKanji: string[];
	position: number;
}

export interface WordFormData {
	kanji: KanjiForm[];
	kana: KanaForm[];
	senseMisc: string[];
}

export interface DisplayForm {
	writing: string;
	reading: string;
}

function hasTag(tags: string[], tag: string): boolean {
	return tags.includes(tag);
}

function isSearchOnlyKanji(form: KanjiForm): boolean {
	return hasTag(form.tags, "sK");
}

function isSearchOnlyKana(form: KanaForm): boolean {
	return hasTag(form.tags, "sk");
}

function isRareKanji(form: KanjiForm): boolean {
	return hasTag(form.tags, "rK");
}

function isRareKana(form: KanaForm): boolean {
	return hasTag(form.tags, "rk");
}

function isStandaloneKana(form: KanaForm): boolean {
	return hasTag(form.tags, "nokanji") || form.appliesToKanji.length === 0;
}

function isUniversalKana(form: KanaForm): boolean {
	return form.appliesToKanji.includes("*");
}

function sortByPosition<T extends { position: number }>(forms: T[]): T[] {
	return [...forms].sort((a, b) => a.position - b.position);
}

function pickBestFromList<T extends { common: boolean; position: number }>(
	forms: T[],
): T | null {
	const sorted = sortByPosition(forms);
	if (sorted.length === 0) return null;
	return sorted.find((form) => form.common) ?? sorted[0]!;
}

function pickReadingForKanjiWriting(
	writing: string,
	kana: KanaForm[],
): string {
	const matchingKana = kana.find((form) => form.text === writing);
	if (matchingKana) return writing;

	const applicable = sortByPosition(
		kana.filter(
			(form) =>
				!isSearchOnlyKana(form) &&
				(form.appliesToKanji.includes(writing) ||
					form.appliesToKanji.includes("*")),
		),
	);

	if (applicable.length === 0) {
		const fallback = pickBestFromList(
			kana.filter((form) => !isSearchOnlyKana(form)),
		);
		return fallback?.text ?? writing;
	}

	return (pickBestFromList(applicable) ?? applicable[0]!).text;
}

function toKanaDisplay(form: KanaForm): DisplayForm {
	return { writing: form.text, reading: form.text };
}

function toKanjiDisplay(form: KanjiForm, kana: KanaForm[]): DisplayForm {
	return {
		writing: form.text,
		reading: pickReadingForKanjiWriting(form.text, kana),
	};
}

export function pickDisplayForm(data: WordFormData): DisplayForm | null {
	const kanji = sortByPosition(data.kanji.filter((k) => !isSearchOnlyKanji(k)));
	const kana = sortByPosition(data.kana.filter((k) => !isSearchOnlyKana(k)));
	const hasUk = data.senseMisc.includes("uk");

	if (kanji.length === 0) {
		const best = pickBestFromList(kana);
		return best ? toKanaDisplay(best) : null;
	}

	const commonKanji = kanji.filter((k) => k.common);
	const universalKana = kana.filter((k) => isUniversalKana(k));
	const commonUniversalKana = universalKana.filter((k) => k.common);
	const commonStandaloneKana = kana.filter(
		(k) => isStandaloneKana(k) && k.common,
	);

	if (commonStandaloneKana.length > 0 && commonKanji.length === 0) {
		return toKanaDisplay(pickBestFromList(commonStandaloneKana)!);
	}

	if (hasUk) {
		if (commonUniversalKana.length > 0 && commonKanji.length === 0) {
			return toKanaDisplay(pickBestFromList(commonUniversalKana)!);
		}

		const usableUniversal = universalKana.filter((k) => !isRareKana(k));
		if (
			commonKanji.length === 0 &&
			commonUniversalKana.length === 0 &&
			usableUniversal.length > 0
		) {
			return toKanaDisplay(pickBestFromList(usableUniversal)!);
		}
	}

	if (commonKanji.length > 0 && commonUniversalKana.length === 0) {
		return toKanjiDisplay(pickBestFromList(commonKanji)!, kana);
	}

	if (commonUniversalKana.length > 0 && commonKanji.length === 0) {
		return toKanaDisplay(pickBestFromList(commonUniversalKana)!);
	}

	if (commonKanji.length > 0 && commonUniversalKana.length > 0) {
		const bestKanji = pickBestFromList(commonKanji)!;
		const bestKana = pickBestFromList(commonUniversalKana)!;

		if (hasUk || bestKana.position < bestKanji.position) {
			return toKanaDisplay(bestKana);
		}

		return toKanjiDisplay(bestKanji, kana);
	}

	const usableKanji = kanji.filter((k) => !isRareKanji(k));
	if (usableKanji.length > 0 && !hasUk) {
		return toKanjiDisplay(pickBestFromList(usableKanji)!, kana);
	}

	if (hasUk) {
		const usableUniversal = universalKana.filter((k) => !isRareKana(k));
		if (usableUniversal.length > 0) {
			return toKanaDisplay(pickBestFromList(usableUniversal)!);
		}
	}

	const usableKana = kana.filter((k) => !isRareKana(k));
	if (usableKana.length > 0) {
		return toKanaDisplay(pickBestFromList(usableKana)!);
	}

	if (kanji.length > 0) {
		return toKanjiDisplay(pickBestFromList(kanji)!, kana);
	}

	return null;
}
