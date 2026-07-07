import { describe, expect, it } from "vitest";
import {
	DEFAULT_USER_SETTINGS,
	normalizeUserSettings,
} from "../../app/utils/user-settings";

describe("normalizeUserSettings", () => {
	it("returns defaults for invalid raw values", () => {
		expect(normalizeUserSettings(null)).toEqual(DEFAULT_USER_SETTINGS);
		expect(normalizeUserSettings("invalid")).toEqual(DEFAULT_USER_SETTINGS);
	});

	it("clamps volumes between 0 and 1", () => {
		expect(
			normalizeUserSettings({
				pronunciationVolume: 1.5,
				effectsVolume: -0.2,
			}),
		).toEqual({
			pronunciationVolume: 1,
			effectsVolume: 0,
		});
	});

	it("falls back to defaults for non-numeric volumes", () => {
		expect(
			normalizeUserSettings({
				pronunciationVolume: "loud",
				effectsVolume: undefined,
			}),
		).toEqual(DEFAULT_USER_SETTINGS);
	});

	it("preserves valid volume values", () => {
		expect(
			normalizeUserSettings({
				pronunciationVolume: 0.5,
				effectsVolume: 0.25,
			}),
		).toEqual({
			pronunciationVolume: 0.5,
			effectsVolume: 0.25,
		});
	});
});
