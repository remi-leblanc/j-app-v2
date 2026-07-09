import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../server/utils/google-tts", () => ({
	synthesizeJapaneseOgg: vi.fn(async (reading: string) =>
		Buffer.from(`google:${reading}`),
	),
}));

vi.mock("../../server/utils/voicevox-tts", () => ({
	createAudioQuery: vi.fn(async (text: string) => ({
		text,
		speedScale: 1,
		outputSamplingRate: 24000,
	})),
	getVoicevoxConfig: vi.fn(() => ({
		baseUrl: "http://localhost:50021",
		speaker: 2,
	})),
	initializeSpeaker: vi.fn(async () => {}),
	multiSynthesizeWav: vi.fn(),
	synthesizeWav: vi.fn(async () => Buffer.from("wav-data")),
}));

vi.mock("../../server/utils/audio-encode", () => ({
	checkFfmpegAvailable: vi.fn(async () => {}),
	encodeAudioFromWav: vi.fn(async (wav: Buffer) =>
		Buffer.from(`encoded:${wav.toString()}`),
	),
}));

import { synthesizeJapaneseOgg } from "../../server/utils/google-tts";
import { encodeAudioFromWav } from "../../server/utils/audio-encode";
import {
	createAudioQuery,
	initializeSpeaker,
	multiSynthesizeWav,
	synthesizeWav,
} from "../../server/utils/voicevox-tts";
import {
	getTtsProvider,
	initializeTtsProvider,
	synthesizeJapaneseAudio,
	synthesizeQueryBatch,
} from "../../server/utils/tts";

describe("tts provider", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		process.env = { ...originalEnv };
		vi.clearAllMocks();
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("defaults to voicevox provider", () => {
		delete process.env.TTS_PROVIDER;
		expect(getTtsProvider()).toBe("voicevox");
	});

	it("supports google provider via env", () => {
		process.env.TTS_PROVIDER = "google";
		expect(getTtsProvider()).toBe("google");
	});

	it("initializes voicevox speaker and checks ffmpeg for compressed formats", async () => {
		process.env.TTS_PROVIDER = "voicevox";
		process.env.AUDIO_TTS_FORMAT = "ogg";

		await initializeTtsProvider();

		expect(initializeSpeaker).toHaveBeenCalled();
	});

	it("routes single synthesis to google when configured", async () => {
		process.env.TTS_PROVIDER = "google";

		const result = await synthesizeJapaneseAudio("ねこ");

		expect(synthesizeJapaneseOgg).toHaveBeenCalledWith("ねこ");
		expect(result.toString()).toBe("google:ねこ");
	});

	it("routes single synthesis to voicevox and encodes wav", async () => {
		process.env.TTS_PROVIDER = "voicevox";

		const result = await synthesizeJapaneseAudio("ねこ");

		expect(createAudioQuery).toHaveBeenCalledWith("ねこ");
		expect(synthesizeWav).toHaveBeenCalled();
		expect(encodeAudioFromWav).toHaveBeenCalled();
		expect(result.toString()).toBe("encoded:wav-data");
	});

	it("encodes batch synthesis results from voicevox", async () => {
		const items = [
			{
				reading: "ねこ",
				query: {
					speedScale: 1,
					outputSamplingRate: 24000,
				},
			},
		];

		vi.mocked(multiSynthesizeWav).mockResolvedValueOnce(
			new Map([[0, Buffer.from("wav")]]),
		);

		const result = await synthesizeQueryBatch(items);

		expect(result.get("ねこ")?.toString()).toBe("encoded:wav");
	});
});
