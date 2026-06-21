import {
	GAME_MODE_OPTIONS,
	JLPT_LEVEL_OPTIONS,
	MAX_WORDS_LIMIT,
	WORD_CATEGORY_OPTIONS,
	type GameMode,
	type JlptLevel,
	type WordCategory,
} from "~/utils/game-constants";

export interface GameSettings {
	mode: GameMode;
	categories: WordCategory[];
	levels: JlptLevel[];
	maxWords: number;
}

const DEFAULT_GAME_MODE = GAME_MODE_OPTIONS[0]!.value;

const DEFAULT_SETTINGS: GameSettings = {
	mode: DEFAULT_GAME_MODE,
	categories: [],
	levels: [],
	maxWords: 0,
};

export function useGameSettings() {
	const settings = useState<GameSettings>("game-settings", () => ({
		...DEFAULT_SETTINGS,
		categories: [...DEFAULT_SETTINGS.categories],
		levels: [...DEFAULT_SETTINGS.levels],
	}));

	if (
		!GAME_MODE_OPTIONS.some((option) => option.value === settings.value.mode)
	) {
		settings.value.mode = DEFAULT_GAME_MODE;
	}

	function setMode(mode: GameMode) {
		settings.value.mode = mode;
	}

	function setMaxWords(value: number) {
		settings.value.maxWords = Math.min(
			MAX_WORDS_LIMIT,
			Math.max(0, Math.round(value)),
		);
	}

	function toggleCategory(category: WordCategory) {
		const index = settings.value.categories.indexOf(category);
		if (index === -1) {
			settings.value.categories.push(category);
			return;
		}
		settings.value.categories.splice(index, 1);
	}

	function toggleLevel(level: JlptLevel) {
		const index = settings.value.levels.indexOf(level);
		if (index === -1) {
			settings.value.levels.push(level);
			return;
		}
		settings.value.levels.splice(index, 1);
	}

	function isCategorySelected(category: WordCategory) {
		return settings.value.categories.includes(category);
	}

	function isLevelSelected(level: JlptLevel) {
		return settings.value.levels.includes(level);
	}

	function areAllCategoriesSelected() {
		return WORD_CATEGORY_OPTIONS.every((option) =>
			settings.value.categories.includes(option.value),
		);
	}

	function areAllLevelsSelected() {
		return JLPT_LEVEL_OPTIONS.every((option) =>
			settings.value.levels.includes(option.value),
		);
	}

	function toggleAllCategories() {
		if (areAllCategoriesSelected()) {
			settings.value.categories = [];
			return;
		}
		settings.value.categories = WORD_CATEGORY_OPTIONS.map(
			(option) => option.value,
		);
	}

	function toggleAllLevels() {
		if (areAllLevelsSelected()) {
			settings.value.levels = [];
			return;
		}
		settings.value.levels = JLPT_LEVEL_OPTIONS.map((option) => option.value);
	}

	return {
		settings,
		setMode,
		setMaxWords,
		toggleCategory,
		toggleLevel,
		toggleAllCategories,
		toggleAllLevels,
		isCategorySelected,
		isLevelSelected,
		areAllCategoriesSelected,
		areAllLevelsSelected,
	};
}
