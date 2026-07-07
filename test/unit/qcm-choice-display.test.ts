import { describe, expect, it } from "vitest";
import type { QcmChoice } from "../../app/types/game";
import {
	getQcmChoiceDisplayType,
	isQcmChoiceVisibleInFeedback,
} from "../../app/utils/qcm-choice-display";

function choice(
	overrides: Partial<QcmChoice> & Pick<QcmChoice, "id">,
): QcmChoice {
	return {
		label: overrides.label ?? overrides.id.toUpperCase(),
		text: overrides.text ?? "answer",
		isCorrect: overrides.isCorrect ?? false,
		...overrides,
	};
}

describe("isQcmChoiceVisibleInFeedback", () => {
	it("shows the correct answer and the selected answer", () => {
		const correct = choice({ id: "a", isCorrect: true });
		const selectedWrong = choice({ id: "b", isCorrect: false });
		const other = choice({ id: "c", isCorrect: false });

		expect(isQcmChoiceVisibleInFeedback(correct, "b")).toBe(true);
		expect(isQcmChoiceVisibleInFeedback(selectedWrong, "b")).toBe(true);
		expect(isQcmChoiceVisibleInFeedback(other, "b")).toBe(false);
	});
});

describe("getQcmChoiceDisplayType", () => {
	const correct = choice({ id: "a", isCorrect: true });
	const selectedWrong = choice({ id: "b", isCorrect: false });
	const other = choice({ id: "c", isCorrect: false });

	it("returns neutral before feedback", () => {
		expect(getQcmChoiceDisplayType(correct, "b", false)).toBe("neutral");
		expect(getQcmChoiceDisplayType(selectedWrong, "b", false)).toBe("neutral");
	});

	it("returns success, error or neutral after feedback", () => {
		expect(getQcmChoiceDisplayType(correct, "b", true)).toBe("success");
		expect(getQcmChoiceDisplayType(selectedWrong, "b", true)).toBe("error");
		expect(getQcmChoiceDisplayType(other, "b", true)).toBe("neutral");
	});
});
