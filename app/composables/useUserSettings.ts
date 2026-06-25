import {
	DEFAULT_USER_SETTINGS,
	normalizeUserSettings,
	USER_SETTINGS_COOKIE,
	type UserSettings,
} from "~/utils/user-settings";

export function useUserSettings() {
	const settings = useCookie<UserSettings>(USER_SETTINGS_COOKIE, {
		default: () => ({ ...DEFAULT_USER_SETTINGS }),
		maxAge: 60 * 60 * 24 * 365,
	});

	settings.value = normalizeUserSettings(settings.value);

	function updateSetting<K extends keyof UserSettings>(
		key: K,
		value: UserSettings[K],
	) {
		settings.value = { ...normalizeUserSettings(settings.value), [key]: value };
	}

	return {
		settings,
		updateSetting,
	};
}
