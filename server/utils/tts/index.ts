import {
	checkFfmpegAvailable,
	encodeAudioFromWav,
} from "../audio-encode";
import { synthesizeJapaneseOgg } from "../google-tts";
import {
	createAudioQuery,
	getVoicevoxConfig,
	initializeSpeaker,
	multiSynthesizeWav,
	synthesizeWav,
	type AudioQuery,
	type VoicevoxConfig,
} from "../voicevox-tts";
import {
	getAudioFileExtension,
	type AudioTtsFormat,
} from "../../../shared/utils/audio-tts";

export type TtsProvider = "voicevox" | "google";

export function getTtsProvider(): TtsProvider {
	const provider = process.env.TTS_PROVIDER?.trim().toLowerCase();
	if (provider === "google") return "google";
	return "voicevox";
}

export async function initializeTtsProvider(
	provider: TtsProvider = getTtsProvider(),
): Promise<void> {
	if (provider === "voicevox") {
		await initializeSpeaker();
		const format = getAudioFileExtension();
		if (format !== "wav") {
			await checkFfmpegAvailable();
		}
	}
}

async function encodeFromWav(wavBuffer: Buffer): Promise<Buffer> {
	return encodeAudioFromWav(wavBuffer, getAudioFileExtension());
}

export async function synthesizeJapaneseAudio(reading: string): Promise<Buffer> {
	const provider = getTtsProvider();

	if (provider === "google") {
		return synthesizeJapaneseOgg(reading);
	}

	const query = await createAudioQuery(reading);
	const wav = await synthesizeWav(query);
	return encodeFromWav(wav);
}

export interface BatchSynthesisItem {
	reading: string;
	query: AudioQuery;
}

export async function createAudioQueries(
	readings: string[],
	config?: VoicevoxConfig,
): Promise<BatchSynthesisItem[]> {
	const items: BatchSynthesisItem[] = [];
	for (const reading of readings) {
		const query = await createAudioQuery(reading, undefined, config);
		items.push({ reading, query });
	}
	return items;
}

export async function synthesizeQueryBatch(
	items: BatchSynthesisItem[],
	config?: VoicevoxConfig,
): Promise<Map<string, Buffer>> {
	const queries = items.map((item) => item.query);

	try {
		const wavMap = await multiSynthesizeWav(queries, undefined, config);
		const result = new Map<string, Buffer>();

		for (let i = 0; i < items.length; i++) {
			const wav = wavMap.get(i);
			if (!wav) {
				throw new Error(`Missing WAV at index ${i} for "${items[i].reading}"`);
			}
			const encoded = await encodeFromWav(wav);
			result.set(items[i].reading, encoded);
		}

		return result;
	} catch {
		const result = new Map<string, Buffer>();
		for (const item of items) {
			const wav = await synthesizeWav(item.query, undefined, config);
			const encoded = await encodeFromWav(wav);
			result.set(item.reading, encoded);
		}
		return result;
	}
}

export function getVoicevoxConfigForLog(): VoicevoxConfig {
	return getVoicevoxConfig();
}

export function getStorageFormat(): AudioTtsFormat {
	return getAudioFileExtension();
}
