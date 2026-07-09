import { spawn } from "node:child_process";
import type { AudioTtsFormat } from "../../shared/utils/audio-tts";

const FFMPEG_BITRATE = "32k";

function runFfmpeg(args: string[], input: Buffer): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const ffmpeg = spawn("ffmpeg", args, {
			stdio: ["pipe", "pipe", "pipe"],
			windowsHide: true,
		});

		const stdoutChunks: Buffer[] = [];
		const stderrChunks: Buffer[] = [];

		ffmpeg.stdout.on("data", (chunk: Buffer) => {
			stdoutChunks.push(chunk);
		});
		ffmpeg.stderr.on("data", (chunk: Buffer) => {
			stderrChunks.push(chunk);
		});

		ffmpeg.on("error", (error) => {
			reject(
				new Error(
					`ffmpeg not found or failed to start: ${error.message}. Install ffmpeg and ensure it is in PATH.`,
				),
			);
		});

		ffmpeg.on("close", (code) => {
			if (code === 0) {
				resolve(Buffer.concat(stdoutChunks));
				return;
			}
			const stderr = Buffer.concat(stderrChunks).toString("utf8");
			reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
		});

		ffmpeg.stdin.write(input);
		ffmpeg.stdin.end();
	});
}

export async function checkFfmpegAvailable(): Promise<void> {
	return new Promise((resolve, reject) => {
		const ffmpeg = spawn("ffmpeg", ["-version"], {
			stdio: ["ignore", "ignore", "pipe"],
			windowsHide: true,
		});

		ffmpeg.on("error", () => {
			reject(
				new Error(
					"ffmpeg is required for audio format conversion but was not found in PATH.",
				),
			);
		});

		ffmpeg.on("close", (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error("ffmpeg is not available or returned a non-zero exit code."));
			}
		});
	});
}

export async function convertWavToOggOpus(wavBuffer: Buffer): Promise<Buffer> {
	return runFfmpeg(
		[
			"-hide_banner",
			"-loglevel",
			"error",
			"-i",
			"pipe:0",
			"-c:a",
			"libopus",
			"-b:a",
			FFMPEG_BITRATE,
			"-f",
			"ogg",
			"pipe:1",
		],
		wavBuffer,
	);
}

export async function convertWavToMp3(wavBuffer: Buffer): Promise<Buffer> {
	return runFfmpeg(
		[
			"-hide_banner",
			"-loglevel",
			"error",
			"-i",
			"pipe:0",
			"-c:a",
			"libmp3lame",
			"-b:a",
			FFMPEG_BITRATE,
			"-f",
			"mp3",
			"pipe:1",
		],
		wavBuffer,
	);
}

export async function encodeAudioFromWav(
	wavBuffer: Buffer,
	format: AudioTtsFormat,
): Promise<Buffer> {
	switch (format) {
		case "wav":
			return wavBuffer;
		case "ogg":
			return convertWavToOggOpus(wavBuffer);
		case "mp3":
			return convertWavToMp3(wavBuffer);
	}
}
