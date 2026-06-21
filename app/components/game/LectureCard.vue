<script setup lang="ts">
import type { GameWord } from "~/types/game";
import { formatAcceptedTranslations, getPrimaryRomajiAnswer } from "~/utils/answer-validation";

const props = defineProps<{
	word: GameWord;
	romajiInput: string;
	translationInput: string;
	isValidated: boolean;
	romajiCorrect: boolean;
	translationCorrect: boolean;
	canValidate: boolean;
	currentWordNumber: number;
	totalWords: number;
	correctCount: number;
	incorrectCount: number;
}>();

const emit = defineEmits<{
	"update:romajiInput": [value: string];
	"update:translationInput": [value: string];
	validate: [];
	next: [];
}>();

const romajiInputRef = ref<HTMLInputElement | null>(null);
const translationInputRef = ref<HTMLInputElement | null>(null);

const expectedRomaji = computed(() => getPrimaryRomajiAnswer(props.word.displayReading));

const expectedTranslation = computed(() => formatAcceptedTranslations(props.word.translations));

const romajiInputClass = computed(() => {
	if (!props.isValidated) return "";
	return props.romajiCorrect ? "input-success" : "input-error";
});

const translationInputClass = computed(() => {
	if (!props.isValidated) return "";
	return props.translationCorrect ? "input-success" : "input-error";
});

function focusRomajiInput() {
	nextTick(() => {
		romajiInputRef.value?.focus();
	});
}

function focusTranslationInput() {
	nextTick(() => {
		translationInputRef.value?.focus();
	});
}

function handleRomajiEnter() {
	if (props.isValidated) {
		emit("next");
		return;
	}

	if (props.romajiInput.trim()) {
		focusTranslationInput();
	}
}

function handleTranslationEnter() {
	if (props.isValidated) {
		emit("next");
		return;
	}

	if (props.canValidate) {
		emit("validate");
	}
}

function handleTranslationBackspace(event: KeyboardEvent) {
	if (props.isValidated) return;

	if (props.translationInput === "") {
		event.preventDefault();
		focusRomajiInput();
	}
}

function handleNextClick() {
	if (props.isValidated) {
		emit("next");
		return;
	}

	if (props.canValidate) {
		emit("validate");
	}
}

onMounted(() => {
	romajiInputRef.value?.focus();
});

watch(
	() => props.word.id,
	() => {
		nextTick(() => {
			romajiInputRef.value?.focus();
		});
	},
);
</script>

<template>
	<GameCardShell
		:word="word"
		:current-word-number="currentWordNumber"
		:total-words="totalWords"
		:correct-count="correctCount"
		:incorrect-count="incorrectCount"
	>
		<fieldset class="fieldset gap-2">
			<label class="label" for="romaji-input">Romaji</label>
			<input
				id="romaji-input"
				ref="romajiInputRef"
				:value="romajiInput"
				type="text"
				autocomplete="off"
				class="input input-bordered w-full"
				:class="romajiInputClass"
				:readonly="isValidated"
				@input="emit('update:romajiInput', ($event.target as HTMLInputElement).value)"
				@keydown.enter.prevent="handleRomajiEnter"
			/>
			<p v-if="isValidated" class="text-sm" :class="romajiCorrect ? 'text-success' : 'text-error'">
				{{ expectedRomaji }}
			</p>
		</fieldset>

		<fieldset class="fieldset gap-2">
			<label class="label" for="translation-input">Traduction</label>
			<input
				id="translation-input"
				ref="translationInputRef"
				:value="translationInput"
				type="text"
				autocomplete="off"
				class="input input-bordered w-full"
				:class="translationInputClass"
				:readonly="isValidated"
				@input="emit('update:translationInput', ($event.target as HTMLInputElement).value)"
				@keydown.enter.prevent="handleTranslationEnter"
				@keydown.backspace="handleTranslationBackspace"
			/>
			<p v-if="isValidated" class="text-sm" :class="translationCorrect ? 'text-success' : 'text-error'">
				{{ expectedTranslation }}
			</p>
		</fieldset>

		<div class="card-actions justify-end">
			<button type="button" class="btn btn-primary" :disabled="!isValidated && !canValidate" @click="handleNextClick">
				Suivant
			</button>
		</div>
	</GameCardShell>
</template>
