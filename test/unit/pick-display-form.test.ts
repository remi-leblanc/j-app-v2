import { describe, expect, it } from "vitest";
import type {
	KanaForm,
	KanjiForm,
	WordFormData,
} from "../../server/utils/pick-display-form";
import { pickDisplayForm } from "../../server/utils/pick-display-form";

function kanji(
	text: string,
	overrides: Partial<KanjiForm> = {},
): KanjiForm {
	return {
		text,
		common: overrides.common ?? false,
		tags: overrides.tags ?? [],
		position: overrides.position ?? 0,
	};
}

function kana(text: string, overrides: Partial<KanaForm> = {}): KanaForm {
	return {
		text,
		common: overrides.common ?? false,
		tags: overrides.tags ?? [],
		appliesToKanji: overrides.appliesToKanji ?? ["*"],
		position: overrides.position ?? 0,
	};
}

function wordForm(overrides: Partial<WordFormData>): WordFormData {
	return {
		kanji: overrides.kanji ?? [],
		kana: overrides.kana ?? [],
		senseMisc: overrides.senseMisc ?? [],
	};
}

describe("pickDisplayForm", () => {
	it("returns kana display for kana-only words", () => {
		const result = pickDisplayForm(
			wordForm({
				kana: [kana("ねこ", { common: true })],
			}),
		);

		expect(result).toEqual({ writing: "ねこ", reading: "ねこ" });
	});

	it("returns kanji with reading when kanji and kana are equally ranked", () => {
		const result = pickDisplayForm(
			wordForm({
				kanji: [kanji("猫", { common: true })],
				kana: [kana("ねこ", { common: true, appliesToKanji: ["*"] })],
			}),
		);

		expect(result).toEqual({ writing: "猫", reading: "ねこ" });
	});

	it("prefers kana for uk words when kana appears before kanji", () => {
		const result = pickDisplayForm(
			wordForm({
				kanji: [kanji("猫", { common: true, position: 1 })],
				kana: [kana("ねこ", { common: true, position: 0 })],
				senseMisc: ["uk"],
			}),
		);

		expect(result).toEqual({ writing: "ねこ", reading: "ねこ" });
	});

	it("excludes search-only kanji and kana forms", () => {
		const result = pickDisplayForm(
			wordForm({
				kanji: [kanji("hidden", { common: true, tags: ["sK"] })],
				kana: [kana("ねこ", { common: true, tags: ["sk"] })],
			}),
		);

		expect(result).toBeNull();
	});

	it("deprioritizes rare kanji when a usable kanji exists", () => {
		const result = pickDisplayForm(
			wordForm({
				kanji: [
					kanji("稀", { tags: ["rK"], position: 0 }),
					kanji("猫", { position: 1 }),
				],
				kana: [kana("ねこ", { appliesToKanji: ["猫"] })],
			}),
		);

		expect(result).toEqual({ writing: "猫", reading: "ねこ" });
	});

	it("prefers common standalone kana when no common kanji exists", () => {
		const result = pickDisplayForm(
			wordForm({
				kanji: [kanji("猫", { position: 0 })],
				kana: [
					kana("ねこ", {
						common: true,
						tags: ["nokanji"],
						appliesToKanji: [],
					}),
				],
			}),
		);

		expect(result).toEqual({ writing: "ねこ", reading: "ねこ" });
	});

	it("picks the best form by position when multiple common forms exist", () => {
		const result = pickDisplayForm(
			wordForm({
				kanji: [],
				kana: [
					kana("ねこ", { common: true, position: 2 }),
					kana("ネコ", { common: true, position: 0 }),
				],
			}),
		);

		expect(result).toEqual({ writing: "ネコ", reading: "ネコ" });
	});

	it("returns null when no usable forms remain", () => {
		expect(pickDisplayForm(wordForm({}))).toBeNull();
	});
});
