<script setup lang="ts">
import type { GameMode } from "~/utils/game-constants";
import type { GameWord } from "~/types/game";
import { canGenerateQcmChoices } from "~/utils/qcm-choices";

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

	return query;
});

const { data, pending, error } = await useFetch<{ words: GameWord[] }>("/api/words", {
	query: apiQuery,
});

const words = computed(() => data.value?.words ?? []);

const qcmReady = computed(() => canGenerateQcmChoices(words.value));

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
	romajiCorrect: qcmRomajiCorrect,
	translationCorrect: qcmTranslationCorrect,
	selectedRomajiChoice,
	selectedTranslationChoice,
	correctRomajiChoice,
	correctTranslationChoice,
	correctCount: qcmCorrectCount,
	errorCount: qcmErrorCount,
	currentWordNumber: qcmCurrentWordNumber,
	totalWords: qcmTotalWords,
	results: qcmResults,
	selectRomaji,
	selectTranslation,
	nextWord: qcmNextWord,
} = useQcmGame(words);
</script>

<template>
	<div class="navbar bg-base-200 fixed">
		<div class="navbar-start">
			<NuxtLink to="/" class="btn btn-circle">
				<Icon name="formkit:arrowleft" />
			</NuxtLink>
		</div>
		<div class="navbar-center">
			J-App
		</div>
		<div class="navbar-end"></div>
	</div>
	<div class="flex min-h-screen items-center justify-center p-4">
		<div v-if="mode === 'oral'" class="card w-full max-w-lg bg-base-100 shadow-xl">
			<div class="card-body items-center text-center">
				<h2 class="card-title">Mode non disponible</h2>
				<p>Le mode compréhension orale sera disponible prochainement.</p>
				<NuxtLink to="/" class="btn btn-primary">Retour à l'accueil</NuxtLink>
			</div>
		</div>

		<div v-else-if="pending" class="flex flex-col items-center gap-4">
			<span class="loading loading-spinner loading-lg" />
			<p>Chargement des mots…</p>
		</div>

		<div v-else-if="error || words.length === 0" class="alert alert-warning max-w-lg">
			<div>
				<p>Aucun mot disponible pour cette sélection.</p>
				<NuxtLink to="/" class="btn btn-sm btn-primary mt-4"> Retour à l'accueil </NuxtLink>
			</div>
		</div>

		<div v-else-if="mode === 'qcm' && !qcmReady" class="alert alert-warning max-w-lg">
			<div>
				<p>Le mode QCM nécessite au moins 4 mots distincts dans la sélection.</p>
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

			<GameQcmCard
				v-else-if="qcmCurrentWord"
				:word="qcmCurrentWord"
				:step="qcmStep"
				:romaji-choices="romajiChoices"
				:translation-choices="translationChoices"
				:romaji-correct="qcmRomajiCorrect"
				:translation-correct="qcmTranslationCorrect"
				:selected-romaji-choice="selectedRomajiChoice"
				:selected-translation-choice="selectedTranslationChoice"
				:correct-romaji-choice="correctRomajiChoice"
				:correct-translation-choice="correctTranslationChoice"
				:current-word-number="qcmCurrentWordNumber"
				:total-words="qcmTotalWords"
				:correct-count="qcmCorrectCount"
				:incorrect-count="qcmErrorCount"
				@select-romaji="selectRomaji($event)"
				@select-translation="selectTranslation($event)"
				@next="qcmNextWord()"
			/>
		</template>
	</div>
</template>
