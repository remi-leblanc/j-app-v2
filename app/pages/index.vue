<script setup lang="ts">
const heroSectionRef = ref<{ heroRef: HTMLElement | null } | null>(null);
const showLaunchBar = ref(false);

const { count, pending } = useWordCount();

</script>

<template>
	<div class="min-h-screen pb-24">
		<HomeHeroSection ref="heroSectionRef" />
		<HomeGameSettings />
		<HomeLaunchBar
			:count="count"
			:pending="pending"
		/>
	</div>
</template>
