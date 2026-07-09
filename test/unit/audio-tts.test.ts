import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	getAudioFileExtension,
	getAudioFilePath,
	getAudioMimeType,
	getAudioUrl,
} from "../../shared/utils/audio-tts";

describe("audio-tts helpers", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("defaults to ogg extension and mime type", () => {
		delete process.env.AUDIO_TTS_FORMAT;
		expect(getAudioFileExtension()).toBe("ogg");
		expect(getAudioMimeType()).toBe("audio/ogg");
	});

	it("supports wav and mp3 formats", () => {
		process.env.AUDIO_TTS_FORMAT = "wav";
		expect(getAudioFileExtension()).toBe("wav");
		expect(getAudioMimeType()).toBe("audio/wav");

		process.env.AUDIO_TTS_FORMAT = "mp3";
		expect(getAudioFileExtension()).toBe("mp3");
		expect(getAudioMimeType()).toBe("audio/mpeg");
	});

	it("builds file paths with configured extension", () => {
		process.env.AUDIO_TTS_DIR = "./custom-audio";
		process.env.AUDIO_TTS_FORMAT = "ogg";

		const path = getAudioFilePath("1000280", "あげつらう");
		expect(path.replace(/\\/g, "/")).toContain("custom-audio/1000280/あげつらう.ogg");
	});

	it("builds absolute audio API URLs", () => {
		expect(getAudioUrl("1000280", "ねこ", "https://example.com")).toBe(
			"https://example.com/api/audio?wordId=1000280&reading=%E3%81%AD%E3%81%93",
		);
	});

	it("strips trailing slash from site URL", () => {
		expect(getAudioUrl("1000280", "ねこ", "https://example.com/")).toBe(
			"https://example.com/api/audio?wordId=1000280&reading=%E3%81%AD%E3%81%93",
		);
	});
});
