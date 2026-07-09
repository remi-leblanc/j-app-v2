import { existsSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";

const DEFAULT_AUDIO_DIR = "./audio-tts";
const DEFAULT_AUDIO_FORMAT = "ogg";

export type AudioTtsFormat = "ogg" | "wav" | "mp3";

const MIME_TYPES: Record<AudioTtsFormat, string> = {
	ogg: "audio/ogg",
	wav: "audio/wav",
	mp3: "audio/mpeg",
};

export function resolveAudioDir(): string {
	return process.env.AUDIO_TTS_DIR?.trim() || DEFAULT_AUDIO_DIR;
}

export function getAudioFileExtension(): AudioTtsFormat {
	const format = process.env.AUDIO_TTS_FORMAT?.trim().toLowerCase();
	if (format === "wav" || format === "mp3" || format === "ogg") {
		return format;
	}
	return DEFAULT_AUDIO_FORMAT;
}

export function getAudioMimeType(format?: AudioTtsFormat): string {
	return MIME_TYPES[format ?? getAudioFileExtension()];
}

export function getAudioFilePath(wordId: string, reading: string): string {
	const dir = resolveAudioDir();
	const ext = getAudioFileExtension();
	return join(dir, wordId, `${reading}.${ext}`);
}

export function getAudioUrl(wordId: string, reading: string, siteUrl: string): string {
	const params = new URLSearchParams({
		wordId,
		reading,
	});
	const path = `/api/audio?${params.toString()}`;
	return `${siteUrl.replace(/\/$/, "")}${path}`;
}

export function audioFileExists(wordId: string, reading: string): boolean {
	return existsSync(getAudioFilePath(wordId, reading));
}

export function isPathWithinAudioDir(filePath: string): boolean {
	const audioDir = resolve(resolveAudioDir());
	const resolved = resolve(filePath);
	const rel = relative(audioDir, resolved);
	return rel !== ".." && !rel.startsWith(`..${resolve.sep}`) && !isAbsolute(rel);
}
