import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	createAudioQuery,
	getVoicevoxConfig,
	initializeSpeaker,
	multiSynthesizeWav,
	synthesizeWav,
} from "../../server/utils/voicevox-tts";
import { createZip } from "./voicevox-test-helpers";

describe("voicevox-tts", () => {
	const originalEnv = { ...process.env };
	const fetchMock = vi.fn();

	beforeEach(() => {
		process.env = { ...originalEnv };
		vi.stubGlobal("fetch", fetchMock);
		fetchMock.mockReset();
	});

	afterEach(() => {
		process.env = originalEnv;
		vi.unstubAllGlobals();
	});

	it("reads config from environment", () => {
		process.env.VOICEVOX_API_URL = "http://voicevox:50021/";
		process.env.VOICEVOX_SPEAKER = "3";

		expect(getVoicevoxConfig()).toEqual({
			baseUrl: "http://voicevox:50021",
			speaker: 3,
		});
	});

	it("calls initialize_speaker with configured speaker", async () => {
		fetchMock.mockResolvedValueOnce({ ok: true });

		await initializeSpeaker();

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:50021/initialize_speaker?speaker=2",
			{ method: "POST" },
		);
	});

	it("creates audio query via POST /audio_query", async () => {
		const query = { speedScale: 1, outputSamplingRate: 24000 };
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => query,
		});

		const result = await createAudioQuery("ねこ");

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:50021/audio_query?text=%E3%81%AD%E3%81%93&speaker=2",
			{ method: "POST" },
		);
		expect(result).toEqual(query);
	});

	it("synthesizes wav via POST /synthesis", async () => {
		const query = { speedScale: 1 };
		const wav = Buffer.from("RIFF");
		fetchMock.mockResolvedValueOnce({
			ok: true,
			arrayBuffer: async () => wav.buffer.slice(
				wav.byteOffset,
				wav.byteOffset + wav.byteLength,
			),
		});

		const result = await synthesizeWav(query);

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:50021/synthesis?speaker=2",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(query),
			},
		);
		expect(result.toString()).toBe("RIFF");
	});

	it("parses multi_synthesis ZIP response", async () => {
		const query = { speedScale: 1 };
		const zip = createZip([
			{ name: "001.wav", data: Buffer.from("one"), compression: 0 },
			{ name: "002.wav", data: Buffer.from("two"), compression: 0 },
		]);

		fetchMock.mockResolvedValueOnce({
			ok: true,
			arrayBuffer: async () =>
				zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength),
		});

		const result = await multiSynthesizeWav([query, query]);

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:50021/multi_synthesis?speaker=2",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify([query, query]),
			},
		);
		expect(result.get(0)?.toString()).toBe("one");
		expect(result.get(1)?.toString()).toBe("two");
	});

	it("throws when VOICEVOX returns an error", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: false,
			status: 422,
			statusText: "Unprocessable Entity",
			text: async () => "invalid text",
		});

		await expect(createAudioQuery("bad")).rejects.toThrow(
			"VOICEVOX request failed (422)",
		);
	});
});
