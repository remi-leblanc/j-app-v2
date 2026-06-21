export type WordCategory = "nom" | "verbe" | "adjectif" | "adverbe" | "autre";

export type JlptLevel = 1 | 2 | 3 | 4 | 5;

export type GameMode = "lecture" | "oral" | "qcm";

export const MAX_WORDS_LIMIT = 100;

export interface WordCategoryOption {
	value: WordCategory;
	label: string;
}

export interface JlptLevelOption {
	value: JlptLevel;
	label: string;
}

export interface GameModeOption {
	value: GameMode;
	label: string;
	description: string;
}

export const WORD_CATEGORY_OPTIONS: WordCategoryOption[] = [
	{ value: "nom", label: "Noms" },
	{ value: "verbe", label: "Verbes" },
	{ value: "adjectif", label: "Adjectifs" },
	{ value: "adverbe", label: "Adverbes" },
	{ value: "autre", label: "Autres" },
];

export const JLPT_LEVEL_OPTIONS: JlptLevelOption[] = [
	{ value: 5, label: "N5" },
	{ value: 4, label: "N4" },
	{ value: 3, label: "N3" },
	{ value: 2, label: "N2" },
	{ value: 1, label: "N1" },
];

export const GAME_MODE_OPTIONS: GameModeOption[] = [
	{
		value: "qcm",
		label: "QCM",
		description: "Choisis le romaji et la traduction parmi 4 propositions.",
	},
	// {
	// 	value: "lecture",
	// 	label: "Lecture",
	// 	description: "Affiche le mot japonais, saisis le romaji et la traduction.",
	// },
	{
		value: "oral",
		label: "Compréhension orale",
		description: "Écoute le mot via la synthèse vocale, puis saisis tes réponses.",
	},
];
