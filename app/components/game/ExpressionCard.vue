<script setup lang="ts">
import type { ExpressionStep, GameWord } from "~/types/game";

const props = defineProps<{
	word: GameWord;
	step: ExpressionStep;
	isValidated: boolean;
	pronunciationCorrect: boolean;
	audioUrl: string | null;
	isPlaying: boolean;
	isAudioLoading: boolean;
	audioError: boolean;
	isSupported: boolean;
	isListening: boolean;
	interimTranscript: string | null;
	recognizedTranscript: string | null;
	speechError: string | null;
	currentWordNumber: number;
	totalWords: number;
	correctCount: number;
	incorrectCount: number;
}>();

const emit = defineEmits<{
	startListening: [];
	playAudio: [];
	skip: [];
	next: [];
}>();

const expectedRomaji = computed(() => getPrimaryRomajiAnswer(props.word.displayReading));
const expectedTranslation = computed(() => formatAcceptedTranslations(props.word.translations));

const feedbackRomajiClass = computed(() =>
	props.pronunciationCorrect ? "text-success" : "text-error",
);

const feedbackTranslationClass = computed(() =>
	props.pronunciationCorrect ? "text-success" : "text-error",
);

const feedbackRecognizedClass = computed(() =>
	props.pronunciationCorrect ? "text-success" : "text-error",
);
</script>

<template>
	<GameCardShell
		:word="word"
		:current-word-number="currentWordNumber"
		:total-words="totalWords"
		:correct-count="correctCount"
		:incorrect-count="incorrectCount"
		:word-correct="isValidated ? pronunciationCorrect : undefined"
	>
		<div v-if="!isSupported" class="alert alert-warning">
			<span>La reconnaissance vocale n'est pas disponible dans ce navigateur. Utilise Chrome ou Edge.</span>
		</div>

		<template v-else>
			<div v-if="step === 'listen'" class="flex flex-col items-center gap-3">
				<button
					type="button"
					class="btn btn-circle btn-lg btn-primary"
					:disabled="isListening"
					@click="emit('startListening')"
				>
					<span v-if="isListening" class="loading loading-spinner loading-md" />
					<Icon v-else name="material-symbols:mic-rounded" />
				</button>

				<button
					type="button"
					class="btn btn-ghost btn-sm"
					:disabled="isListening"
					@click="emit('skip')"
				>
					Passer
				</button>

				<p v-if="isListening" class="text-sm text-base-content/70">Écoute en cours…</p>
				<p v-else class="text-sm text-base-content/70">Appuie et prononce le mot.</p>

				<p v-if="speechError" class="text-sm text-error">{{ speechError }}</p>
			</div>

			<div v-else class="flex flex-col items-center gap-3">
				<button
					type="button"
					class="btn btn-circle btn-lg btn-primary"
					:disabled="!audioUrl || isAudioLoading"
					@click="emit('playAudio')"
				>
					<span v-if="isAudioLoading" class="loading loading-spinner loading-md" />
					<Icon v-else name="material-symbols:volume-up-rounded" />
				</button>

				<p v-if="audioError" class="text-sm text-error">Impossible de lire l'audio.</p>
			</div>

			<div v-if="step === 'feedback'" class="flex flex-col gap-4">
				<div v-if="recognizedTranscript" class="flex flex-col gap-1">
					<span class="label">Ta prononciation</span>
					<p class="text-lg font-medium" :class="feedbackRecognizedClass">
						{{ recognizedTranscript }}
					</p>
				</div>

				<div class="flex flex-col gap-1">
					<span class="label">Romaji</span>
					<p class="text-lg font-medium" :class="feedbackRomajiClass">{{ expectedRomaji }}</p>
				</div>

				<div class="flex flex-col gap-1">
					<span class="label">Traduction</span>
					<p class="text-lg font-medium" :class="feedbackTranslationClass">{{ expectedTranslation }}</p>
				</div>

				<div class="card-actions justify-end">
					<button type="button" class="btn btn-primary" @click="emit('next')">Suivant</button>
				</div>
			</div>
		</template>
	</GameCardShell>
</template>
