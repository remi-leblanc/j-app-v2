<script setup lang="ts">
const props = defineProps<{
	count: number;
	pending?: boolean;
}>();

const { settings } = useGameSettings();

function launchGame() {
	const query: Record<string, string> = {
		mode: settings.value.mode,
		categories: settings.value.categories.join(","),
		levels: settings.value.levels.join(","),
		maxWords: String(settings.value.maxWords),
	};
	navigateTo({
		path: "/play",
		query,
	});
}
</script>

<template>
	<Transition
		enter-active-class="transition-transform duration-300 ease-out"
		enter-from-class="translate-y-full"
		enter-to-class="translate-y-0"
		leave-active-class="transition-transform duration-300 ease-in"
		leave-from-class="translate-y-0"
		leave-to-class="translate-y-full"
	>
		<div class="fixed inset-x-0 bottom-0 z-50 border-t border-base-300 bg-base-200 shadow-lg">
			<div class="navbar container mx-auto max-w-3xl px-4">
				<div class="flex-1">
					<div class="stat place-items-start p-0">
						<div class="stat-title">Mots sélectionnés</div>
						<div class="stat-value text-2xl">
							<span v-if="pending" class="loading loading-dots loading-sm" />
							<template v-else>{{ count }}</template>
						</div>
					</div>
				</div>
				<div class="flex-none">
					<button
						type="button"
						class="btn btn-primary"
						:disabled="props.pending || props.count === 0"
						@click="launchGame"
					>
						Lancer la partie
					</button>
				</div>
			</div>
		</div>
	</Transition>
</template>
