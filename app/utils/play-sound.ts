function clampVolume(volume: number): number {
	return Math.min(1, Math.max(0, volume));
}

export function playSound(src: string, volume: number): void {
	if (import.meta.server) return;

	const audio = new Audio(src);
	audio.volume = clampVolume(volume);
	void audio.play();
}
