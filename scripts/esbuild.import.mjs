import esbuild from "esbuild";

await esbuild.build({
	entryPoints: ["scripts/import-jmdict.ts"],
	bundle: true,
	platform: "node",
	format: "esm",
	outfile: "import-jmdict.mjs",
	banner: {
		js: `import { createRequire } from "module";\nconst require = createRequire(import.meta.url);`,
	},
});
