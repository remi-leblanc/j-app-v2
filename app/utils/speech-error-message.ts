import type { SpeechRecognitionErrorCode } from "~/composables/useSpeechRecognition.client";

const SPEECH_ERROR_MESSAGES: Record<SpeechRecognitionErrorCode, string> = {
	aborted: "La reconnaissance vocale a été interrompue.",
	"audio-capture": "Impossible d'accéder au microphone.",
	"bad-grammar": "Erreur de reconnaissance vocale.",
	"language-not-supported": "La langue japonaise n'est pas supportée par ce navigateur.",
	network: "Erreur réseau lors de la reconnaissance vocale.",
	"no-speech": "Aucune voix détectée. Réessaie.",
	"not-allowed": "Accès au microphone refusé.",
	"service-not-allowed": "La reconnaissance vocale n'est pas autorisée.",
	unknown: "Erreur de reconnaissance vocale.",
};

export function getSpeechErrorMessage(
	error: SpeechRecognitionErrorCode | null,
): string | null {
	if (!error) return null;
	return SPEECH_ERROR_MESSAGES[error];
}
