import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_WORD_COUNT, MAX_WORD_COUNT } from "~/utils/game-constants";

describe("useGameSettings", () => {
	beforeEach(() => {
		const { settings } = useGameSettings();
		settings.value = {
			mode: "qcm",
			categories: [],
			levels: [],
			maxWords: DEFAULT_WORD_COUNT,
		};
	});

	it("clamps maxWords between 0 and 100", () => {
		const { setWordCount, settings } = useGameSettings();

		setWordCount(150.6);
		expect(settings.value.maxWords).toBe(MAX_WORD_COUNT);

		setWordCount(-5);
		expect(settings.value.maxWords).toBe(0);
	});

	it("toggles individual categories and levels", () => {
		const { toggleCategory, toggleLevel, isCategorySelected, isLevelSelected } =
			useGameSettings();

		toggleCategory("nom");
		toggleLevel(5);

		expect(isCategorySelected("nom")).toBe(true);
		expect(isLevelSelected(5)).toBe(true);

		toggleCategory("nom");
		toggleLevel(5);

		expect(isCategorySelected("nom")).toBe(false);
		expect(isLevelSelected(5)).toBe(false);
	});

	it("selects or clears all categories and levels", () => {
		const {
			toggleAllCategories,
			toggleAllLevels,
			areAllCategoriesSelected,
			areAllLevelsSelected,
			settings,
		} = useGameSettings();

		toggleAllCategories();
		toggleAllLevels();

		expect(areAllCategoriesSelected()).toBe(true);
		expect(areAllLevelsSelected()).toBe(true);
		expect(settings.value.categories).toHaveLength(5);
		expect(settings.value.levels).toHaveLength(5);

		toggleAllCategories();
		toggleAllLevels();

		expect(areAllCategoriesSelected()).toBe(false);
		expect(areAllLevelsSelected()).toBe(false);
		expect(settings.value.categories).toEqual([]);
		expect(settings.value.levels).toEqual([]);
	});

	it("resets an invalid mode to the default", () => {
		const { settings } = useGameSettings();
		settings.value.mode = "lecture";

		const { settings: normalizedSettings } = useGameSettings();

		expect(normalizedSettings.value.mode).toBe("qcm");
	});
});
