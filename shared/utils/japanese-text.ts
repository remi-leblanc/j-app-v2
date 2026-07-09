const JAPANESE_PUNCTUATION_PATTERN = /[\s.,!?、。！？・「」『』（）()【】\[\]〜～…]/g;

export function stripJapanesePunctuation(text: string): string {
	return text.trim().replace(JAPANESE_PUNCTUATION_PATTERN, "");
}
