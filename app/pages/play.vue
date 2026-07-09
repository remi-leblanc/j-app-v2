<script setup lang="ts">
import type { GameMode } from "~/utils/game-constants";
import type { GameWord } from "~/types/game";

const route = useRoute();

const mode = computed(() => String(route.query.mode ?? "lecture") as GameMode);

const apiQuery = computed(() => {
	const query: Record<string, string> = {};

	if (route.query.categories) {
		query.categories = String(route.query.categories);
	}
	if (route.query.levels) {
		query.levels = String(route.query.levels);
	}
	if (route.query.maxWords) {
		query.maxWords = String(route.query.maxWords);
	}
	if (mode.value === "oral" || mode.value === "expression") {
		query.requireAudio = "true";
	}

	return query;
});

const qcmFilterQuery = computed(() => {
	const query: Record<string, string> = {};

	if (route.query.categories) {
		query.categories = String(route.query.categories);
	}
	if (route.query.levels) {
		query.levels = String(route.query.levels);
	}

	return query;
});

const { data, pending, error } = await useFetch<{ words: GameWord[] }>("/api/words", {
	query: apiQuery,
});

const words = computed(() => data.value?.words ?? []);

const isQcmMode = computed(() => mode.value === "qcm");
const isOralMode = computed(() => mode.value === "oral");
const isExpressionMode = computed(() => mode.value === "expression");
const showPronunciationVolume = computed(() => isOralMode.value || isExpressionMode.value);

const {
	phase: lecturePhase,
	currentWord: lectureCurrentWord,
	romajiInput,
	translationInput,
	isValidated,
	romajiCorrect,
	translationCorrect,
	canValidate,
	correctCount: lectureCorrectCount,
	errorCount: lectureErrorCount,
	currentWordNumber: lectureCurrentWordNumber,
	totalWords: lectureTotalWords,
	results: lectureResults,
	validate,
	nextWord: lectureNextWord,
} = useLectureGame(words);

const {
	phase: qcmPhase,
	currentWord: qcmCurrentWord,
	step: qcmStep,
	romajiChoices,
	translationChoices,
	selectedRomajiId: qcmSelectedRomajiId,
	selectedTranslationId: qcmSelectedTranslationId,
	romajiCorrect: qcmRomajiCorrect,
	translationCorrect: qcmTranslationCorrect,
	correctCount: qcmCorrectCount,
	errorCount: qcmErrorCount,
	currentWordNumber: qcmCurrentWordNumber,
	totalWords: qcmTotalWords,
	results: qcmResults,
	choicesPending: qcmChoicesPending,
	choicesError: qcmChoicesError,
	selectRomaji,
	selectTranslation,
	nextWord: qcmNextWord,
} = useQcmGame(words, qcmFilterQuery, isQcmMode);

const {
	phase: oralPhase,
	currentWord: oralCurrentWord,
	step: oralStep,
	translationChoices: oralTranslationChoices,
	selectedTranslationId: oralSelectedTranslationId,
	translationCorrect: oralTranslationCorrect,
	audioUrl: oralAudioUrl,
	correctCount: oralCorrectCount,
	errorCount: oralErrorCount,
	currentWordNumber: oralCurrentWordNumber,
	totalWords: oralTotalWords,
	results: oralResults,
	choicesPending: oralChoicesPending,
	choicesError: oralChoicesError,
	selectTranslation: oralSelectTranslation,
	nextWord: oralNextWord,
} = useOralGame(words, qcmFilterQuery, isOralMode);

const {
	phase: expressionPhase,
	currentWord: expressionCurrentWord,
	step: expressionStep,
	pronunciationCorrect: expressionPronunciationCorrect,
	recognizedTranscript: expressionRecognizedTranscript,
	isValidated: expressionIsValidated,
	audioUrl: expressionAudioUrl,
	correctCount: expressionCorrectCount,
	errorCount: expressionErrorCount,
	currentWordNumber: expressionCurrentWordNumber,
	totalWords: expressionTotalWords,
	results: expressionResults,
	choicesPending: expressionChoicesPending,
	choicesError: expressionChoicesError,
	handleRecognitionResult: expressionHandleRecognitionResult,
	skipWord: expressionSkipWord,
	nextWord: expressionNextWord,
} = useExpressionGame(words, qcmFilterQuery, isExpressionMode);

const {
	isSupported: expressionSpeechSupported,
	isListening: expressionIsListening,
	interimTranscript: expressionInterimTranscript,
	error: expressionSpeechRecognitionError,
	start: startExpressionListening,
	stop: stopExpressionListening,
} = useSpeechRecognition({
	onResult: (payload) => expressionHandleRecognitionResult(payload),
});

const expressionSpeechError = computed(() => getSpeechErrorMessage(expressionSpeechRecognitionError.value));

const { isPlaying: oralIsPlaying, isLoading: oralIsAudioLoading, error: oralAudioError, play: playOralAudio, stop: stopOralAudio } = useJapaneseSpeech();

const { isPlaying: expressionIsPlaying, isLoading: expressionIsAudioLoading, error: expressionAudioError, play: playExpressionAudio, stop: stopExpressionAudio } = useJapaneseSpeech();

watch(
	() => oralCurrentWord.value?.id,
	() => stopOralAudio(),
);

watch(
	() => expressionCurrentWord.value?.id,
	() => {
		stopExpressionAudio();
		stopExpressionListening();
	},
);

function handlePlayOralAudio() {
	if (oralAudioUrl.value) {
		playOralAudio(oralAudioUrl.value);
	}
}

function handleOralNext() {
	stopOralAudio();
	oralNextWord();
}

function handleStartExpressionListening() {
	stopExpressionAudio();
	startExpressionListening();
}

function handlePlayExpressionAudio() {
	if (expressionAudioUrl.value) {
		playExpressionAudio(expressionAudioUrl.value);
	}
}

function handleExpressionSkip() {
	stopExpressionAudio();
	stopExpressionListening();
	expressionSkipWord();
}

function handleExpressionNext() {
	stopExpressionAudio();
	stopExpressionListening();
	expressionNextWord();
}
</script>

<template>
	<div class="navbar bg-base-200 fixed">
		<div class="navbar-start">
			<NuxtLink to="/" class="btn btn-circle">
				<Icon name="formkit:arrowleft" />
			</NuxtLink>
		</div>
		<div class="navbar-center">J-App</div>
		<div class="navbar-end">
			<GamePlaySettingsMenu :show-pronunciation-volume="showPronunciationVolume" />
		</div>
	</div>
	<div class="flex min-h-screen items-center justify-center p-4">
		<div v-if="pending" class="flex flex-col items-center gap-4">
			<span class="loading loading-spinner loading-lg" />
			<p>Chargement des mots…</p>
		</div>

		<div v-else-if="error || words.length === 0" class="alert alert-warning max-w-lg">
			<div>
				<p>Aucun mot disponible pour cette sélection.</p>
				<NuxtLink to="/" class="btn btn-sm btn-primary mt-4"> Retour à l'accueil </NuxtLink>
			</div>
		</div>

		<template v-else-if="mode === 'lecture'">
			<GameResults v-if="lecturePhase === 'results'" :results="lectureResults" />

			<GameLectureCard
				v-else-if="lectureCurrentWord"
				:word="lectureCurrentWord"
				v-model:romaji-input="romajiInput"
				v-model:translation-input="translationInput"
				:is-validated="isValidated"
				:romaji-correct="romajiCorrect"
				:translation-correct="translationCorrect"
				:can-validate="canValidate"
				:current-word-number="lectureCurrentWordNumber"
				:total-words="lectureTotalWords"
				:correct-count="lectureCorrectCount"
				:incorrect-count="lectureErrorCount"
				@validate="validate()"
				@next="lectureNextWord()"
			/>
		</template>

		<template v-else-if="mode === 'qcm'">
			<GameResults v-if="qcmPhase === 'results'" :results="qcmResults" />

			<div v-else-if="qcmChoicesError" class="alert alert-warning max-w-lg">
				<div>
					<p>Impossible de générer les choix pour ce mot.</p>
					<NuxtLink to="/" class="btn btn-sm btn-primary mt-4"> Retour à l'accueil </NuxtLink>
				</div>
			</div>

			<div v-else-if="qcmChoicesPending" class="flex flex-col items-center gap-4">
				<span class="loading loading-spinner loading-lg" />
				<p>Chargement des choix…</p>
			</div>

			<GameQcmCard
				v-else-if="qcmCurrentWord"
				:word="qcmCurrentWord"
				:step="qcmStep"
				:romaji-choices="romajiChoices"
				:translation-choices="translationChoices"
				:selected-romaji-id="qcmSelectedRomajiId"
				:selected-translation-id="qcmSelectedTranslationId"
				:romaji-correct="qcmRomajiCorrect"
				:translation-correct="qcmTranslationCorrect"
				:current-word-number="qcmCurrentWordNumber"
				:total-words="qcmTotalWords"
				:correct-count="qcmCorrectCount"
				:incorrect-count="qcmErrorCount"
				@select-romaji="selectRomaji($event)"
				@select-translation="selectTranslation($event)"
				@next="qcmNextWord()"
			/>
		</template>

		<template v-else-if="mode === 'oral'">
			<GameResults v-if="oralPhase === 'results'" :results="oralResults" />

			<div v-else-if="oralChoicesError" class="alert alert-warning max-w-lg">
				<div>
					<p>Impossible de charger l'audio ou les choix pour ce mot.</p>
					<NuxtLink to="/" class="btn btn-sm btn-primary mt-4"> Retour à l'accueil </NuxtLink>
				</div>
			</div>

			<div v-else-if="oralChoicesPending" class="flex flex-col items-center gap-4">
				<span class="loading loading-spinner loading-lg" />
				<p>Chargement des choix…</p>
			</div>

			<GameOralCard
				v-else-if="oralCurrentWord"
				:word="oralCurrentWord"
				:step="oralStep"
				:translation-choices="oralTranslationChoices"
				:selected-translation-id="oralSelectedTranslationId"
				:translation-correct="oralTranslationCorrect"
				:audio-url="oralAudioUrl"
				:is-playing="oralIsPlaying"
				:is-audio-loading="oralIsAudioLoading"
				:audio-error="oralAudioError"
				:current-word-number="oralCurrentWordNumber"
				:total-words="oralTotalWords"
				:correct-count="oralCorrectCount"
				:incorrect-count="oralErrorCount"
				@play-audio="handlePlayOralAudio()"
				@select-translation="oralSelectTranslation($event)"
				@next="handleOralNext()"
			/>
		</template>

		<template v-else-if="mode === 'expression'">
			<GameResults v-if="expressionPhase === 'results'" :results="expressionResults" />

			<div v-else-if="expressionChoicesError" class="alert alert-warning max-w-lg">
				<div>
					<p>Impossible de charger l'audio pour ce mot.</p>
					<NuxtLink to="/" class="btn btn-sm btn-primary mt-4"> Retour à l'accueil </NuxtLink>
				</div>
			</div>

			<div v-else-if="expressionChoicesPending" class="flex flex-col items-center gap-4">
				<span class="loading loading-spinner loading-lg" />
				<p>Chargement de l'audio…</p>
			</div>

			<GameExpressionCard
				v-else-if="expressionCurrentWord"
				:word="expressionCurrentWord"
				:step="expressionStep"
				:is-validated="expressionIsValidated"
				:pronunciation-correct="expressionPronunciationCorrect"
				:audio-url="expressionAudioUrl"
				:is-playing="expressionIsPlaying"
				:is-audio-loading="expressionIsAudioLoading"
				:audio-error="expressionAudioError"
				:is-supported="expressionSpeechSupported"
				:is-listening="expressionIsListening"
				:interim-transcript="expressionInterimTranscript"
				:recognized-transcript="expressionRecognizedTranscript"
				:speech-error="expressionSpeechError"
				:current-word-number="expressionCurrentWordNumber"
				:total-words="expressionTotalWords"
				:correct-count="expressionCorrectCount"
				:incorrect-count="expressionErrorCount"
				@start-listening="handleStartExpressionListening()"
				@play-audio="handlePlayExpressionAudio()"
				@skip="handleExpressionSkip()"
				@next="handleExpressionNext()"
			/>
		</template>
	</div>

</template>
