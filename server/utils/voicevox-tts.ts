import { extractZipEntries } from "./zip-extract";

const DEFAULT_API_URL = "http://localhost:50021";
const DEFAULT_SPEAKER = 2;

export interface VoicevoxConfig {
	baseUrl: string;
	speaker: number;
}

export interface AudioQuery {
	accent_phrases: unknown[];
	speedScale: number;
	pitchScale: number;
	intonationScale: number;
	volumeScale: number;
	prePhonemeLength: number;
	postPhonemeLength: number;
	pauseLength: number | null;
	pauseLengthScale: number;
	outputSamplingRate: number;
	outputStereo: boolean;
	kana?: string;
}

export function getVoicevoxConfig(): VoicevoxConfig {
	const baseUrl = (
		process.env.VOICEVOX_API_URL?.trim() || DEFAULT_API_URL
	).replace(/\/$/, "");
	const speaker = Number.parseInt(
		process.env.VOICEVOX_SPEAKER?.trim() ?? String(DEFAULT_SPEAKER),
		10,
	);
	return {
		baseUrl,
		speaker: Number.isNaN(speaker) ? DEFAULT_SPEAKER : speaker,
	};
}

function buildUrl(
	baseUrl: string,
	path: string,
	params: Record<string, string | number>,
): string {
	const url = new URL(path, `${baseUrl}/`);
	for (const [key, value] of Object.entries(params)) {
		url.searchParams.set(key, String(value));
	}
	return url.toString();
}

async function voicevoxFetch(
	url: string,
	init?: RequestInit,
): Promise<Response> {
	const response = await fetch(url, init);
	if (!response.ok) {
		const body = await response.text().catch(() => "");
		throw new Error(
			`VOICEVOX request failed (${response.status}): ${body || response.statusText}`,
		);
	}
	return response;
}

export async function initializeSpeaker(
	speaker?: number,
	config?: VoicevoxConfig,
): Promise<void> {
	const { baseUrl, speaker: defaultSpeaker } = config ?? getVoicevoxConfig();
	const styleId = speaker ?? defaultSpeaker;
	const url = buildUrl(baseUrl, "/initialize_speaker", { speaker: styleId });
	await voicevoxFetch(url, { method: "POST" });
}

export async function createAudioQuery(
	text: string,
	speaker?: number,
	config?: VoicevoxConfig,
): Promise<AudioQuery> {
	const { baseUrl, speaker: defaultSpeaker } = config ?? getVoicevoxConfig();
	const styleId = speaker ?? defaultSpeaker;
	const url = buildUrl(baseUrl, "/audio_query", {
		text,
		speaker: styleId,
	});
	const response = await voicevoxFetch(url, { method: "POST" });
	return (await response.json()) as AudioQuery;
}

export async function synthesizeWav(
	audioQuery: AudioQuery,
	speaker?: number,
	config?: VoicevoxConfig,
): Promise<Buffer> {
	const { baseUrl, speaker: defaultSpeaker } = config ?? getVoicevoxConfig();
	const styleId = speaker ?? defaultSpeaker;
	const url = buildUrl(baseUrl, "/synthesis", { speaker: styleId });
	const response = await voicevoxFetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(audioQuery),
	});
	const arrayBuffer = await response.arrayBuffer();
	return Buffer.from(arrayBuffer);
}

export async function multiSynthesizeWav(
	queries: AudioQuery[],
	speaker?: number,
	config?: VoicevoxConfig,
): Promise<Map<number, Buffer>> {
	if (queries.length === 0) {
		return new Map();
	}

	const { baseUrl, speaker: defaultSpeaker } = config ?? getVoicevoxConfig();
	const styleId = speaker ?? defaultSpeaker;
	const url = buildUrl(baseUrl, "/multi_synthesis", { speaker: styleId });
	const response = await voicevoxFetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(queries),
	});
	const zipBuffer = Buffer.from(await response.arrayBuffer());
	const entries = extractZipEntries(zipBuffer);

	const result = new Map<number, Buffer>();
	const sorted = entries
		.filter((e) => e.name.endsWith(".wav"))
		.sort((a, b) => a.name.localeCompare(b.name));

	for (let i = 0; i < sorted.length; i++) {
		result.set(i, sorted[i].data);
	}

	if (result.size !== queries.length) {
		throw new Error(
			`VOICEVOX multi_synthesis returned ${result.size} file(s), expected ${queries.length}`,
		);
	}

	return result;
}
