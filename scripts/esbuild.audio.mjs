import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import esbuild from "esbuild";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function resolveAliasPath(subpath) {
	const withExtension = path.join(rootDir, `${subpath}.ts`);
	if (existsSync(withExtension)) return withExtension;

	const indexFile = path.join(rootDir, subpath, "index.ts");
	if (existsSync(indexFile)) return indexFile;

	return withExtension;
}

const aliasPlugin = {
	name: "nuxt-alias",
	setup(build) {
		build.onResolve({ filter: /^~~\// }, (args) => ({
			path: resolveAliasPath(args.path.replace(/^~~\//, "")),
		}));
		build.onResolve({ filter: /^~\// }, (args) => ({
			path: path.join(rootDir, "app", `${args.path.replace(/^~\//, "")}.ts`),
		}));
	},
};

await esbuild.build({
	entryPoints: ["scripts/generate-audio-tts.ts"],
	bundle: true,
	platform: "node",
	format: "esm",
	outfile: "generate-audio-tts.mjs",
	plugins: [aliasPlugin],
	banner: {
		js: `import { createRequire } from "module";\nconst require = createRequire(import.meta.url);`,
	},
	external: ["@google-cloud/text-to-speech"],
});
