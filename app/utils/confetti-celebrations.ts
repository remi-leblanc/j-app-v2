import confetti from "canvas-confetti";
import type { Options } from "canvas-confetti";

export function fireWordCorrectStars(): void {
	if (import.meta.server) return;

	confetti({
		particleCount: 16,
		spread: 360,
		startVelocity: 35,
		ticks: 30,
		gravity: 0,
		shapes: ['star'],
		scalar: 1.1,
		colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8'],
		disableForReducedMotion: true,
		zIndex: 1
	});
}

export function fireGameResultsConfetti(): void {
	if (import.meta.server) return;

	const count = 120;
	const defaults: Options = {
		origin: { y: 0.6 },
		disableForReducedMotion: true,
		zIndex: 1
	};

	confetti({
		...defaults,
		particleCount: count * 0.25,
		spread: 60,
		startVelocity: 55,
	});

	confetti({
		...defaults,
		particleCount: count * 0.2,
		spread: 90,
	});

	confetti({
		...defaults,
		particleCount: count * 0.35,
		spread: 130,
		decay: 0.91,
		scalar: 0.8,
	});

	confetti({
		...defaults,
		particleCount: count * 0.1,
		spread: 160,
		startVelocity: 25,
		decay: 0.92,
		scalar: 1.2,
	});

	confetti({
		...defaults,
		particleCount: count * 0.1,
		spread: 180,
		startVelocity: 45,
	});
}
