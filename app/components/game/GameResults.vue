<script setup lang="ts">
import type { GameSessionResults } from "~/types/game";

defineProps<{
	results: GameSessionResults;
}>();

function formatAverageTime(ms: number): string {
	if (ms <= 0) return "—";
	return `${(ms / 1000).toFixed(1)} s`;
}

onMounted(() => {
	fireGameResultsConfetti();
});
</script>

<template>
	<div class="card w-full max-w-lg bg-base-200 shadow-xl z-10">
		<div class="card-body gap-6">
			<h2 class="card-title justify-center text-2xl">Résultats</h2>
			<div class="stats stats-vertical w-full sm:stats-horizontal">
				<div class="stat place-items-center">
					<div class="stat-value">{{ results.successPercentage }} %</div>
				</div>
				<div class="stat place-items-center">
					<div class="stat-title">Succès</div>
					<div class="stat-value text-success">{{ results.successCount }}</div>
				</div>
				<div class="stat place-items-center">
					<div class="stat-title">Erreurs</div>
					<div class="stat-value text-error">{{ results.errorCount }}</div>
				</div>
				<div class="stat place-items-center">
					<div class="stat-title">Temps moyen</div>
					<div class="stat-value text-lg">
						{{ formatAverageTime(results.avgTimeMs) }}
					</div>
					<div class="stat-desc">par réponse correcte</div>
				</div>
			</div>

			<div class="card-actions justify-center">
				<NuxtLink to="/" class="btn btn-primary">Retour à l'accueil</NuxtLink>
			</div>
		</div>
	</div>
</template>
