<script setup lang="ts">
const heroRef = ref<HTMLElement | null>(null);

defineExpose({ heroRef });
</script>

<template>
	<div ref="heroRef" class="hero min-h-[50vh] bg-base-200">
		<div class="hero-content text-center">
			<div class="max-w-md">
				<h1 class="text-5xl font-bold">J-App</h1>
				<p class="py-6 text-base-content/70">
					Apprenez le vocabulaire japonais à votre rythme, avec des
					flashcards et des mini-jeux adaptés à votre niveau.
				</p>
			</div>
		</div>
	</div>
</template>
