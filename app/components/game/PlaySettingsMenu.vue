<script setup lang="ts">
defineProps<{
	showPronunciationVolume: boolean;
}>();

const { settings, updateSetting } = useUserSettings();

function toPercent(volume: number): number {
	return Math.round(volume * 100);
}

function fromPercent(value: number): number {
	return value / 100;
}
</script>

<template>
	<div class="">
		<div class="dropdown dropdown-end">
			<button
				type="button"
				tabindex="0"
				class="btn btn-circle btn-ghost btn-xl"
				aria-label="Paramètres de jeu"
			>
				<Icon name="material-symbols:settings" />
			</button>
			<div
				tabindex="0"
				class="dropdown-content menu w-72 rounded-box bg-base-300 p-4 shadow-xl"
			>
				<fieldset class="fieldset gap-4 p-0">
					<legend class="fieldset-legend text-base font-semibold">
						Paramètres
					</legend>

					<div class="fieldset">
						<div class="flex items-center justify-between gap-4">
							<span class="label-text">Sons du jeu</span>
							<span class="text-sm text-base-content/70">
								{{ toPercent(settings.effectsVolume) }} %
							</span>
						</div>
						<input
							type="range"
							min="0"
							max="100"
							step="5"
							class="range range-xs range-primary w-full"
							:value="toPercent(settings.effectsVolume)"
							@input="
								updateSetting(
									'effectsVolume',
									fromPercent(Number(($event.target as HTMLInputElement).value)),
								)
							"
						/>
					</div>

					<div v-if="showPronunciationVolume" class="fieldset">
						<div class="flex items-center justify-between gap-4">
							<span class="label-text">Prononciation</span>
							<span class="text-sm text-base-content/70">
								{{ toPercent(settings.pronunciationVolume) }} %
							</span>
						</div>
						<input
							type="range"
							min="0"
							max="100"
							step="5"
							class="range range-xs range-primary w-full"
							:value="toPercent(settings.pronunciationVolume)"
							@input="
								updateSetting(
									'pronunciationVolume',
									fromPercent(Number(($event.target as HTMLInputElement).value)),
								)
							"
						/>
					</div>
				</fieldset>
			</div>
		</div>
	</div>
</template>
