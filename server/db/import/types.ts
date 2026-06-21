export interface JmdictGloss {
	lang: string;
	text: string;
}

export interface JmdictSense {
	partOfSpeech?: string[];
	gloss?: JmdictGloss[];
	misc?: string[];
	field?: string[];
}

export interface JmdictKanji {
	text: string;
	common?: boolean;
	tags?: string[];
	priority?: string[];
	jlptLevel?: string | number | null;
}

export interface JmdictKana {
	text: string;
	common?: boolean;
	appliesToKanji?: string[];
	tags?: string[];
	priority?: string[];
	jlptLevel?: string | number | null;
}

export interface JmdictEntry {
	id: string;
	kanji?: JmdictKanji[];
	kana?: JmdictKana[];
	sense?: JmdictSense[];
}

export type WordCategory =
	| "nom"
	| "verbe"
	| "adjectif"
	| "adverbe"
	| "autre";

export type JlptLevel = 1 | 2 | 3 | 4 | 5;

export interface MappedWord {
	id: string;
	categories: WordCategory[];
	jlptLevel: JlptLevel | null;
}

export interface MappedKanji {
	wordId: string;
	text: string;
	common: boolean;
	tags: string[];
	position: number;
}

export interface MappedKana {
	wordId: string;
	text: string;
	common: boolean;
	tags: string[];
	appliesToKanji: string[];
	position: number;
}

export interface MappedSense {
	wordId: string;
	position: number;
	field: string[];
	misc: string[];
}

export interface MappedGloss {
	wordId: string;
	sensePosition: number;
	lang: string;
	text: string;
}

export interface MappedPos {
	wordId: string;
	sensePosition: number;
	value: string;
}

export interface MappedEntry {
	word: MappedWord;
	kanji: MappedKanji[];
	kana: MappedKana[];
	senses: MappedSense[];
	glosses: MappedGloss[];
	pos: MappedPos[];
}
