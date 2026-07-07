import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { defineVitestProject } from "@nuxt/test-utils/config";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)));

export default defineConfig({
	test: {
		projects: [
			{
				resolve: {
					alias: {
						"~": resolve(rootDir, "app"),
						"~~": rootDir,
					},
				},
				test: {
					name: "unit",
					include: ["test/unit/*.{test,spec}.ts"],
					environment: "node",
				},
			},
			{
				test: {
					name: "e2e",
					include: ["test/e2e/*.{test,spec}.ts"],
					environment: "node",
				},
			},
			await defineVitestProject({
				test: {
					name: "nuxt",
					include: ["test/nuxt/*.{test,spec}.ts"],
					environment: "nuxt",
				},
			}),
		],
	},
});