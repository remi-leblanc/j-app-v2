import { stripJapanesePunctuation } from "~~/shared/utils/japanese-text";

export type SpeechRecognitionErrorCode =
	| "aborted"
	| "audio-capture"
	| "bad-grammar"
	| "language-not-supported"
	| "network"
	| "no-speech"
	| "not-allowed"
	| "service-not-allowed"
	| "unknown";

export interface SpeechRecognitionAlternative {
	transcript: string;
	confidence: number;
}

interface SpeechRecognitionAlternativeLike {
	transcript: string;
	confidence: number;
}

interface SpeechRecognitionResultLike {
	readonly isFinal: boolean;
	readonly length: number;
	[index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
	readonly length: number;
	[index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike extends Event {
	readonly resultIndex: number;
	readonly results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike extends Event {
	readonly error: SpeechRecognitionErrorCode;
}

interface SpeechRecognitionLike extends EventTarget {
	lang: string;
	continuous: boolean;
	interimResults: boolean;
	maxAlternatives: number;
	onresult: ((event: SpeechRecognitionEventLike) => void) | null;
	onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
	onend: (() => void) | null;
	start(): void;
	stop(): void;
	abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
	if (!import.meta.client) return null;

	const globalWindow = window as Window & {
		SpeechRecognition?: SpeechRecognitionConstructor;
		webkitSpeechRecognition?: SpeechRecognitionConstructor;
	};

	return (
		globalWindow.SpeechRecognition
		?? globalWindow.webkitSpeechRecognition
		?? null
	);
}

function collectFinalAlternatives(
	event: SpeechRecognitionEventLike,
): SpeechRecognitionAlternative[] {
	const alternatives: SpeechRecognitionAlternative[] = [];

	for (let index = event.resultIndex; index < event.results.length; index += 1) {
		const result = event.results[index];
		if (!result?.isFinal) continue;

		for (let alternativeIndex = 0; alternativeIndex < result.length; alternativeIndex += 1) {
			const alternative = result[alternativeIndex];
			const transcript = stripJapanesePunctuation(alternative?.transcript ?? "");
			if (!transcript) continue;

			alternatives.push({
				transcript,
				confidence: alternative?.confidence ?? 0,
			});
		}
	}

	return alternatives;
}

function getBestAlternative(
	alternatives: SpeechRecognitionAlternative[],
): SpeechRecognitionAlternative | null {
	if (alternatives.length === 0) return null;

	return alternatives.reduce((best, current) =>
		current.confidence > best.confidence ? current : best,
	);
}

function getLatestInterimTranscript(
	event: SpeechRecognitionEventLike,
): string | null {
	let latestInterim: string | null = null;

	for (let index = event.resultIndex; index < event.results.length; index += 1) {
		const result = event.results[index];
		if (!result || result.isFinal) continue;

		const transcript = stripJapanesePunctuation(result[0]?.transcript ?? "");
		if (transcript) latestInterim = transcript;
	}

	return latestInterim;
}

export function useSpeechRecognition(options?: {
	onResult?: (payload: {
		transcripts: string[];
		bestAlternative: SpeechRecognitionAlternative;
	}) => void;
}) {
	const isSupported = computed(() => getSpeechRecognitionConstructor() !== null);
	const isListening = ref(false);
	const interimTranscript = ref<string | null>(null);
	const error = ref<SpeechRecognitionErrorCode | null>(null);

	let recognition: SpeechRecognitionLike | null = null;

	function detachRecognition() {
		if (!recognition) return;

		recognition.onresult = null;
		recognition.onerror = null;
		recognition.onend = null;
		recognition = null;
	}

	function stop() {
		if (!recognition) {
			isListening.value = false;
			interimTranscript.value = null;
			return;
		}

		recognition.stop();
	}

	function start() {
		const SpeechRecognitionClass = getSpeechRecognitionConstructor();
		if (!SpeechRecognitionClass || isListening.value) return;

		stop();
		detachRecognition();
		error.value = null;
		interimTranscript.value = null;

		const instance = new SpeechRecognitionClass();
		instance.lang = "ja-JP";
		instance.continuous = false;
		instance.interimResults = true;
		instance.maxAlternatives = 5;

		instance.onresult = (event) => {
			const interim = getLatestInterimTranscript(event);
			if (interim) {
				interimTranscript.value = interim;
			}

			const alternatives = collectFinalAlternatives(event);
			if (alternatives.length === 0) return;

			interimTranscript.value = null;

			const bestAlternative = getBestAlternative(alternatives);
			if (!bestAlternative) return;

			options?.onResult?.({
				transcripts: alternatives.map((alternative) => alternative.transcript),
				bestAlternative,
			});
		};

		instance.onerror = (event) => {
			if (event.error === "aborted") return;
			error.value = event.error;
		};

		instance.onend = () => {
			isListening.value = false;
			interimTranscript.value = null;
			detachRecognition();
		};

		recognition = instance;
		isListening.value = true;

		try {
			instance.start();
		} catch {
			isListening.value = false;
			error.value = "unknown";
			detachRecognition();
		}
	}

	onScopeDispose(() => {
		if (recognition) {
			recognition.abort();
		}
		detachRecognition();
		isListening.value = false;
	});

	return {
		isSupported,
		isListening,
		interimTranscript,
		error,
		start,
		stop,
	};
}
