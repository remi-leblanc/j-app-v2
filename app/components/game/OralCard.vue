<script setup lang="ts">
import type { GameWord } from "~/types/game";

import type { OralStep, QcmChoice, QcmChoiceId } from "~/types/game";

import { getQcmChoiceDisplayType } from "~/utils/qcm-choice-display";

import QcmOption from "./QcmOption.vue";

const props = defineProps<{
	word: GameWord;
	step: OralStep;
	translationChoices: QcmChoice[];
	selectedTranslationId: QcmChoiceId | null;
	audioUrl: string | null;
	isPlaying: boolean;
	isAudioLoading: boolean;
	audioError: boolean;
	currentWordNumber: number;
	totalWords: number;
	correctCount: number;
	incorrectCount: number;
}>();

const emit = defineEmits<{
	playAudio: [];
	selectTranslation: [id: QcmChoiceId];
	next: [];
}>();

watch(
	() => [props.audioUrl, props.step] as const,
	([url, step]) => {
		if (url && step === "choice") {
			emit("playAudio");
		}
	},
	{ immediate: true },
);
</script>

<template>
	<GameCardShell
		:word="word"
		:current-word-number="currentWordNumber"
		:total-words="totalWords"
		:correct-count="correctCount"
		:incorrect-count="incorrectCount"
		:hide-writing="step !== 'feedback'"
		:reveal-writing="step === 'feedback'"
	>
		<template v-if="step === 'choice'" #header>
			<div class="flex flex-col items-center gap-2">
				<button type="button" class="btn btn-circle btn-lg btn-primary" :disabled="!audioUrl || isAudioLoading" @click="emit('playAudio')">
					<span v-if="isAudioLoading" class="loading loading-spinner loading-md" />

					<Icon v-else name="material-symbols:volume-up-rounded" />
				</button>
				<!-- 
				<p v-if="audioError" class="text-sm text-error">Impossible de lire l'audio.</p>

				<p v-else-if="isPlaying" class="text-sm text-base-content/70">Lecture en cours…</p>
				 -->
			</div>
		</template>

		<div class="flex flex-col gap-2">
			<h3 class="font-semibold">Traduction</h3>

			<QcmOption
				v-for="choice in translationChoices"
				:key="choice.id"
				:choice="choice"
				:onClick="step === 'choice' ? () => emit('selectTranslation', choice.id) : undefined"
				:type="getQcmChoiceDisplayType(choice, selectedTranslationId, step === 'feedback')"
			/>
		</div>

		<div v-if="step === 'feedback'" class="card-actions justify-end">
			<button type="button" class="btn btn-primary" @click="emit('next')">Suivant</button>
		</div>
	</GameCardShell>
</template>
