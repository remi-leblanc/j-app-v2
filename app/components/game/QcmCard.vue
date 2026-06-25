<script setup lang="ts">
import type { GameWord } from "~/types/game";
import type { QcmChoice, QcmChoiceId, QcmStep } from "~/types/game";
import { getQcmChoiceDisplayType, isQcmChoiceVisibleInFeedback } from "~/utils/qcm-choice-display";
import QcmOption from "./QcmOption.vue";

const props = defineProps<{
	word: GameWord;
	step: QcmStep;
	romajiChoices: QcmChoice[];
	translationChoices: QcmChoice[];
	selectedRomajiId: QcmChoiceId | null;
	selectedTranslationId: QcmChoiceId | null;
	currentWordNumber: number;
	totalWords: number;
	correctCount: number;
	incorrectCount: number;
	romajiCorrect: boolean;
	translationCorrect: boolean;
}>();

function visibleChoices(choices: QcmChoice[], selectedId: QcmChoiceId | null): QcmChoice[] {
	if (props.step !== "feedback") return choices;
	return choices.filter((choice) => isQcmChoiceVisibleInFeedback(choice, selectedId));
}

const emit = defineEmits<{
	selectRomaji: [id: QcmChoiceId];
	selectTranslation: [id: QcmChoiceId];
	next: [];
}>();
</script>

<template>
	<GameCardShell
		:word="word"
		:current-word-number="currentWordNumber"
		:total-words="totalWords"
		:correct-count="correctCount"
		:incorrect-count="incorrectCount"
		:word-correct="step === 'feedback' ? romajiCorrect && translationCorrect : undefined"
	>
		<div v-if="step === 'romaji' || step === 'feedback'" class="flex flex-col gap-2">
			<h3 class="font-semibold">Romaji</h3>

			<QcmOption
				v-for="choice in visibleChoices(romajiChoices, selectedRomajiId)"
				:key="choice.id"
				:choice="choice"
				:onClick="step === 'romaji' ? () => emit('selectRomaji', choice.id) : undefined"
				:type="getQcmChoiceDisplayType(choice, selectedRomajiId, step === 'feedback')"
			/>
		</div>

		<div v-if="step === 'translation' || step === 'feedback'" class="flex flex-col gap-2">
			<h3 class="font-semibold">Traduction</h3>

			<QcmOption
				v-for="choice in visibleChoices(translationChoices, selectedTranslationId)"
				:key="choice.id"
				:choice="choice"
				:onClick="step === 'translation' ? () => emit('selectTranslation', choice.id) : undefined"
				:type="getQcmChoiceDisplayType(choice, selectedTranslationId, step === 'feedback')"
			/>
		</div>

		<div v-if="step === 'feedback'" class="card-actions justify-end">
			<button type="button" class="btn btn-primary" @click="emit('next')">Suivant</button>
		</div>
	</GameCardShell>
</template>
