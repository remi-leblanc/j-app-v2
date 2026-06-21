export interface GameWordSense {
	glosses: string[];
}

export interface GameWord {
	id: string;
	displayWriting: string;
	displayReading: string;
	readings: string[];
	translations: string[];
	senses: GameWordSense[];
}

export interface GameWordsResponse {
	words: GameWord[];
}

export interface GameSessionResults {
	successCount: number;
	successPercentage: number;
	errorCount: number;
	avgTimeMs: number;
}

export type GamePhase = "playing" | "results";

export type QcmStep = "romaji" | "translation" | "feedback";

export type QcmChoiceId = "a" | "b" | "c" | "d";

export interface QcmChoice {
	id: QcmChoiceId;
	label: string;
	text: string;
	isCorrect: boolean;
}

export interface QcmChoicesResponse {
	romajiChoices: QcmChoice[] | null;
	translationChoices: QcmChoice[] | null;
}
