export function resolveSiteUrl(): string {
	const url = process.env.SITE_URL?.trim();
	if (!url) {
		throw new Error("SITE_URL environment variable is required");
	}
	return url.replace(/\/$/, "");
}
