export interface UserSettings {
	pronunciationVolume: number;
	effectsVolume: number;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
	pronunciationVolume: 1,
	effectsVolume: 1,
};

export const USER_SETTINGS_COOKIE = "j-app-user-settings";

function clampVolume(value: unknown, fallback: number): number {
	const volume = typeof value === "number" ? value : fallback;
	return Math.min(1, Math.max(0, volume));
}

export function normalizeUserSettings(raw: unknown): UserSettings {
	if (!raw || typeof raw !== "object") {
		return { ...DEFAULT_USER_SETTINGS };
	}

	const settings = raw as Partial<UserSettings>;

	return {
		pronunciationVolume: clampVolume(
			settings.pronunciationVolume,
			DEFAULT_USER_SETTINGS.pronunciationVolume,
		),
		effectsVolume: clampVolume(
			settings.effectsVolume,
			DEFAULT_USER_SETTINGS.effectsVolume,
		),
	};
}
