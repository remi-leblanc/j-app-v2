import type { QcmChoice, QcmChoiceId } from "~/types/game";

export type QcmChoiceDisplayType =
	| "primary"
	| "secondary"
	| "accent"
	| "success"
	| "warning"
	| "error"
	| "neutral";

export function isQcmChoiceVisibleInFeedback(
	choice: QcmChoice,
	selectedId: QcmChoiceId | null,
): boolean {
	return choice.isCorrect || choice.id === selectedId;
}

export function getQcmChoiceDisplayType(
	choice: QcmChoice,
	selectedId: QcmChoiceId | null,
	showFeedback: boolean,
): QcmChoiceDisplayType {
	if (!showFeedback) return "neutral";
	if (choice.isCorrect) return "success";
	if (choice.id === selectedId) return "error";
	return "neutral";
}
