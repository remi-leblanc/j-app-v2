<script setup lang="ts">
import type { GameWord } from "~/types/game";
import type { QcmChoice, QcmChoiceId, QcmStep } from "~/types/game";
import QcmOption from "./QcmOption.vue";

const props = defineProps<{
	word: GameWord;
	step: QcmStep;
	romajiChoices: QcmChoice[];
	translationChoices: QcmChoice[];
	romajiCorrect: boolean;
	translationCorrect: boolean;
	selectedRomajiChoice: QcmChoice | null;
	selectedTranslationChoice: QcmChoice | null;
	correctRomajiChoice: QcmChoice | null;
	correctTranslationChoice: QcmChoice | null;
	currentWordNumber: number;
	totalWords: number;
	correctCount: number;
	incorrectCount: number;
}>();

const emit = defineEmits<{
	selectRomaji: [id: QcmChoiceId];
	selectTranslation: [id: QcmChoiceId];
	next: [];
}>();
</script>

<template>
	<GameCardShell :word="word" :current-word-number="currentWordNumber" :total-words="totalWords" :correct-count="correctCount" :incorrect-count="incorrectCount">
		<div v-if="step === 'romaji'" class="flex flex-col gap-2">
			<h3 class="font-semibold">Romaji</h3>
			<QcmOption v-for="choice in romajiChoices" :key="choice.id" :choice="choice" :onClick="() => emit('selectRomaji', choice.id)" type="neutral" />
		</div>

		<div v-else-if="step === 'translation'" class="flex flex-col gap-2">
			<h3 class="font-semibold">Traduction</h3>
			<QcmOption v-for="choice in translationChoices" :key="choice.id" :choice="choice" :onClick="() => emit('selectTranslation', choice.id)" type="neutral" />
		</div>

		<div v-else class="flex flex-col gap-6">
			<div class="flex flex-col gap-2">
				<h3 class="font-semibold">Romaji</h3>
				<QcmOption v-if="!romajiCorrect && selectedRomajiChoice" :choice="selectedRomajiChoice" type="error" />
				<QcmOption v-if="correctRomajiChoice" :choice="correctRomajiChoice" type="success" />
			</div>

			<div class="flex flex-col gap-2">
				<h3 class="font-semibold">Traduction</h3>
				<QcmOption v-if="!translationCorrect && selectedTranslationChoice" :choice="selectedTranslationChoice" type="error" />
				<QcmOption v-if="correctTranslationChoice" :choice="correctTranslationChoice" type="success" />
			</div>

			<div class="card-actions justify-end">
				<button type="button" class="btn btn-primary" @click="emit('next')">Suivant</button>
			</div>
		</div>
	</GameCardShell>
</template>
