import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveSiteUrl } from "../../server/utils/site-url";

describe("resolveSiteUrl", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("returns SITE_URL without trailing slash", () => {
		process.env.SITE_URL = "https://j-app.example.com/";
		expect(resolveSiteUrl()).toBe("https://j-app.example.com");
	});

	it("returns SITE_URL as-is when no trailing slash", () => {
		process.env.SITE_URL = "https://j-app.example.com";
		expect(resolveSiteUrl()).toBe("https://j-app.example.com");
	});

	it("throws when SITE_URL is missing", () => {
		delete process.env.SITE_URL;
		expect(() => resolveSiteUrl()).toThrow(
			"SITE_URL environment variable is required",
		);
	});

	it("throws when SITE_URL is empty", () => {
		process.env.SITE_URL = "   ";
		expect(() => resolveSiteUrl()).toThrow(
			"SITE_URL environment variable is required",
		);
	});
});
