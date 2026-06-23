export function useJapaneseSpeech() {
	const audio = ref<HTMLAudioElement | null>(null);
	const isPlaying = ref(false);
	const isLoading = ref(false);
	const error = ref(false);

	let playGeneration = 0;
	let onEnded: (() => void) | null = null;
	let onError: (() => void) | null = null;

	function detachListeners(element: HTMLAudioElement) {
		if (onEnded) {
			element.removeEventListener("ended", onEnded);
			onEnded = null;
		}
		if (onError) {
			element.removeEventListener("error", onError);
			onError = null;
		}
	}

	function cleanup() {
		if (audio.value) {
			detachListeners(audio.value);
			audio.value.pause();
			audio.value.src = "";
			audio.value = null;
		}
		isPlaying.value = false;
		isLoading.value = false;
	}

	function stop() {
		playGeneration += 1;
		cleanup();
		error.value = false;
	}

	async function play(url: string) {
		stop();

		const generation = ++playGeneration;
		isLoading.value = true;
		error.value = false;

		const element = new Audio(url);
		audio.value = element;

		onEnded = () => {
			if (generation !== playGeneration) return;
			isPlaying.value = false;
		};

		onError = () => {
			if (generation !== playGeneration) return;
			isPlaying.value = false;
			isLoading.value = false;
			error.value = true;
		};

		element.addEventListener("ended", onEnded);
		element.addEventListener("error", onError);

		try {
			await element.play();
			if (generation !== playGeneration) return;
			isPlaying.value = true;
		} catch (err) {
			if (generation !== playGeneration) return;
			if (err instanceof DOMException && err.name === "AbortError") return;
			error.value = true;
		} finally {
			if (generation === playGeneration) {
				isLoading.value = false;
			}
		}
	}

	onScopeDispose(stop);

	return {
		isPlaying,
		isLoading,
		error,
		play,
		stop,
	};
}
