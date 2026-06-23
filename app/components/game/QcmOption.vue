<script setup lang="ts">
import type { QcmChoice } from "~/types/game";

const props = defineProps<{
	choice: QcmChoice;
	onClick?: () => void;
	type: "primary" | "secondary" | "accent" | "success" | "warning" | "error" | "neutral";
}>();

const typeToClass: Record<string, string> = {
	primary: "btn-primary",
	secondary: "btn-secondary",
	accent: "btn-accent",
	success: "btn-success",
	warning: "btn-warning",
	error: "btn-error",
	neutral: "",
};

const badgeTypeToClass: Record<string, string> = {
	primary: "badge-primary",
	secondary: "badge-secondary",
	accent: "badge-accent",
	success: "badge-success",
	warning: "badge-warning",
	error: "badge-error",
	neutral: "badge-neutral",
};
</script>

<template>
	<button
		type="button"
		class="btn btn-soft p-2 w-full text-left font-normal justify-start overflow-hidden whitespace-nowrap text-ellipsis"
		:class="!onClick ? [typeToClass[type], 'pointer-events-none'] : []"
		@click="onClick?.()"
	>
		<div class="badge badge-sm px-1.5 rounded-sm font-bold" :class="!onClick ? [badgeTypeToClass[type]] : ['badge-neutral']">
			{{ choice.label }}
		</div>
		{{ choice.text }}
	</button>
</template>
