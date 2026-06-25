import confetti from "canvas-confetti";

export default defineNuxtPlugin((nuxtApp) => {
	const router = useRouter();
	router.afterEach((to, from) => {
		confetti.reset();
	});
});
