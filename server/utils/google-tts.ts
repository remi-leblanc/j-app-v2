import { TextToSpeechClient } from "@google-cloud/text-to-speech";

const DEFAULT_VOICE = "ja-JP-Neural2-B";

let client: TextToSpeechClient | null = null;

function getClient(): TextToSpeechClient {
	if (!client) {
		client = new TextToSpeechClient();
	}
	return client;
}

export function getTtsVoiceName(): string {
	return process.env.GOOGLE_TTS_VOICE?.trim() || DEFAULT_VOICE;
}

export async function synthesizeJapaneseOgg(reading: string): Promise<Buffer> {
	const ttsClient = getClient();
	const voiceName = getTtsVoiceName();

	const [response] = await ttsClient.synthesizeSpeech({
		input: { text: reading },
		voice: {
			languageCode: "ja-JP",
			name: voiceName,
		},
		audioConfig: {
			audioEncoding: "OGG_OPUS",
		},
	});

	if (!response.audioContent || !(response.audioContent instanceof Uint8Array)) {
		throw new Error("Google TTS returned empty audio content");
	}

	return Buffer.from(response.audioContent);
}
