<script setup lang="ts">
import type { GameWord } from "~/types/game";

const props = defineProps<{
	word: GameWord;
	currentWordNumber: number;
	totalWords: number;
	correctCount: number;
	incorrectCount: number;
	hideWriting?: boolean;
	revealWriting?: boolean;
	wordCorrect?: boolean;
}>();

const { settings } = useUserSettings();

function playValidationSound(correct: boolean): void {
	playSound(correct ? "/sounds/success.mp3" : "/sounds/error.mp3", settings.value.effectsVolume);
}

watch(
	() => props.wordCorrect,
	(isCorrect, wasCorrect) => {
		if (isCorrect === undefined || wasCorrect !== undefined) return;
		playValidationSound(isCorrect);
		if (isCorrect) fireWordCorrectStars();
	},
);
</script>

<template>
	<div class="card overflow-hidden w-full max-w-xs bg-base-200 shadow-xl z-10">
		<div class="card-body bg-base-300 py-4">
			<div class="flex items-center justify-between text-lg">
				<div>
					<span class="font-bold">{{ currentWordNumber }}</span>
					<span class="text-sm">&nbsp;/ {{ totalWords }}</span>
				</div>
				<div class="flex">
					<span class="font-bold text-success">{{ correctCount }}</span>
					<div class="divider divider-horizontal mx-2"></div>
					<span class="font-bold text-error">{{ incorrectCount }}</span>
				</div>
			</div>
		</div>
		<progress class="progress progress-primary progress-rounded-none w-full h-1" :value="currentWordNumber" :max="totalWords" />
		<div class="card-body gap-6">
			<p v-if="!hideWriting || revealWriting" class="text-center text-4xl font-bold">
				{{ word.displayWriting }}
			</p>
			<slot name="header" />
			<slot />
		</div>
	</div>
</template>
