import { Readable } from "node:stream";

const GITHUB_API = "https://api.github.com";
const USER_AGENT = "j-app-import";

interface GitHubReleaseAsset {
	name: string;
	browser_download_url: string;
}

interface GitHubRelease {
	assets: GitHubReleaseAsset[];
}

export const JMDICT_SIMPLIFIED_REPO = "scriptin/jmdict-simplified";
export const JMDICT_EXTENDED_REPO = "Bluskyo/JMDict_Extended";

export const JMDICT_SIMPLIFIED_ASSET_PATTERN = /^jmdict-all-.+\.json\.tgz$/;
export const JMDICT_EXTENDED_ASSET_PATTERN = /^jmdictExtended-.+\.json\.tar\.gz$/;

export async function fetchLatestAssetUrl(
	repo: string,
	pattern: RegExp,
): Promise<{ url: string; name: string }> {
	const response = await fetch(`${GITHUB_API}/repos/${repo}/releases/latest`, {
		headers: {
			"User-Agent": USER_AGENT,
			Accept: "application/vnd.github+json",
		},
	});

	if (!response.ok) {
		throw new Error(
			`Failed to fetch latest release for ${repo}: ${response.status} ${response.statusText}`,
		);
	}

	const release = (await response.json()) as GitHubRelease;
	const asset = release.assets.find((a) => pattern.test(a.name));

	if (!asset) {
		throw new Error(
			`No matching asset in latest ${repo} release (pattern: ${pattern})`,
		);
	}

	return { url: asset.browser_download_url, name: asset.name };
}

export async function downloadAsset(url: string): Promise<NodeJS.ReadableStream> {
	const response = await fetch(url, {
		headers: { "User-Agent": USER_AGENT },
	});

	if (!response.ok) {
		throw new Error(
			`Failed to download asset: ${response.status} ${response.statusText}`,
		);
	}

	if (!response.body) {
		throw new Error("Download response has no body");
	}

	return Readable.fromWeb(response.body);
}
