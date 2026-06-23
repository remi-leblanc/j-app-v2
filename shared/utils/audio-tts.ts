import { existsSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";

const DEFAULT_AUDIO_DIR = "./audio-tts";

export function resolveAudioDir(): string {
	return process.env.AUDIO_TTS_DIR?.trim() || DEFAULT_AUDIO_DIR;
}

export function getAudioFilePath(wordId: string, reading: string): string {
	const dir = resolveAudioDir();
	return join(dir, wordId, `${reading}.ogg`);
}

export function getAudioUrl(wordId: string, reading: string): string {
	const params = new URLSearchParams({
		wordId,
		reading,
	});
	return `/api/audio?${params.toString()}`;
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
