<script setup lang="ts">
import {
	GAME_MODE_OPTIONS,
	JLPT_LEVEL_OPTIONS,
	MAX_WORDS_LIMIT,
	WORD_CATEGORY_OPTIONS,
} from "~/utils/game-constants";

const {
	settings,
	setMode,
	setMaxWords,
	toggleCategory,
	toggleLevel,
	toggleAllCategories,
	toggleAllLevels,
	isCategorySelected,
	isLevelSelected,
	areAllCategoriesSelected,
	areAllLevelsSelected,
} = useGameSettings();
</script>

<template>
	<div class="container mx-auto max-w-3xl px-4 py-8">
		<div class="card bg-base-200 shadow-xl">
			<div class="card-body gap-8">
				<fieldset class="fieldset">
					<legend class="fieldset-legend text-lg font-semibold">
						Mode de jeu
					</legend>
					<div class="flex flex-col gap-3">
						<label
							v-for="option in GAME_MODE_OPTIONS"
							:key="option.value"
							class="label cursor-pointer justify-start gap-3 rounded-lg border border-base-300 p-4"
							:class="{
								'border-primary bg-primary/5': settings.mode === option.value,
							}"
						>
							<input
								type="radio"
								name="game-mode"
								class="radio radio-primary"
								:checked="settings.mode === option.value"
								@change="setMode(option.value)"
							/>
							<div class="flex flex-col">
								<span class="label-text font-medium">{{ option.label }}</span>
								<span class="label-text-alt text-base-content/60">
									{{ option.description }}
								</span>
							</div>
						</label>
					</div>
				</fieldset>

				<fieldset class="fieldset">
					<div class="flex items-center justify-between gap-4">
						<legend class="fieldset-legend text-lg font-semibold">
							Types de mots
						</legend>
						<button
							type="button"
							class="link link-primary text-sm"
							@click="toggleAllCategories"
						>
							{{
								areAllCategoriesSelected()
									? "Tout désélectionner"
									: "Tout sélectionner"
							}}
						</button>
					</div>
					<div class="flex flex-wrap gap-3">
						<button
							v-for="option in WORD_CATEGORY_OPTIONS"
							:key="option.value"
							type="button"
							class="cursor-pointer rounded-lg border border-base-300 px-4 py-2 transition-colors"
							:class="{
								'border-primary bg-primary/5': isCategorySelected(option.value),
							}"
							:aria-pressed="isCategorySelected(option.value)"
							@click="toggleCategory(option.value)"
						>
							{{ option.label }}
						</button>
					</div>
				</fieldset>

				<fieldset class="fieldset">
					<div class="flex items-center justify-between gap-4">
						<legend class="fieldset-legend text-lg font-semibold">
							Niveaux JLPT
						</legend>
						<button
							type="button"
							class="link link-primary text-sm"
							@click="toggleAllLevels"
						>
							{{
								areAllLevelsSelected()
									? "Tout désélectionner"
									: "Tout sélectionner"
							}}
						</button>
					</div>
					<div class="flex flex-wrap gap-3">
						<button
							v-for="option in JLPT_LEVEL_OPTIONS"
							:key="option.value"
							type="button"
							class="cursor-pointer rounded-lg border border-base-300 px-4 py-2 transition-colors"
							:class="{
								'border-primary bg-primary/5': isLevelSelected(option.value),
							}"
							:aria-pressed="isLevelSelected(option.value)"
							@click="toggleLevel(option.value)"
						>
							{{ option.label }}
						</button>
					</div>
				</fieldset>

				<fieldset class="fieldset">
					<div class="flex items-center justify-between gap-4">
						<legend class="fieldset-legend text-lg font-semibold">
							Nombre de mots maximum
						</legend>
						<span class="text-sm text-base-content/70">
							{{
								settings.maxWords === 0
									? "Illimité"
									: `${settings.maxWords} mots maximum`
							}}
						</span>
					</div>
					<input
						type="range"
						min="0"
						:max="MAX_WORDS_LIMIT"
						step="5"
						class="range range-primary w-full"
						:value="settings.maxWords"
						@input="setMaxWords(Number(($event.target as HTMLInputElement).value))"
					/>
				</fieldset>
			</div>
		</div>
	</div>
</template>
