const DEBOUNCE_MS = 800;

export function useWordCount() {
	const { settings } = useGameSettings();

	const count = ref(0);
	const pending = ref(false);

	async function refresh() {
		try {
			const query: Record<string, string> = {
				maxWords: String(settings.value.maxWords),
			};
			if (settings.value.categories.length > 0) {
				query.categories = settings.value.categories.join(",");
			}
			if (settings.value.levels.length > 0) {
				query.levels = settings.value.levels.join(",");
			}
			if (settings.value.mode === "oral" || settings.value.mode === "expression") {
				query.requireAudio = "true";
			}
			const data = await $fetch<{ count: number }>("/api/words/count", {
				query,
			});
			count.value = data.count;
		} finally {
			pending.value = false;
		}
	}

	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	watch(
		() =>
			[
				settings.value.categories,
				settings.value.levels,
				settings.value.maxWords,
				settings.value.mode,
			] as const,
		() => {
			pending.value = true;
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(refresh, DEBOUNCE_MS);
		},
		{ deep: true, immediate: true },
	);

	onScopeDispose(() => clearTimeout(debounceTimer));

	return {
		count,
		pending,
		refresh,
	};
}
