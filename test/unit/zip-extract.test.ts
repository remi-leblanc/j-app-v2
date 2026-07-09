import { deflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { extractZipEntries } from "../../server/utils/zip-extract";
import { createZip } from "./voicevox-test-helpers";

describe("extractZipEntries", () => {
	it("extracts stored ZIP entries", () => {
		const zip = createZip([
			{ name: "001.wav", data: Buffer.from("wav-one"), compression: 0 },
			{ name: "002.wav", data: Buffer.from("wav-two"), compression: 0 },
		]);

		const entries = extractZipEntries(zip);
		expect(entries).toHaveLength(2);
		expect(entries[0].name).toBe("001.wav");
		expect(entries[0].data.toString()).toBe("wav-one");
		expect(entries[1].name).toBe("002.wav");
		expect(entries[1].data.toString()).toBe("wav-two");
	});

	it("extracts deflated ZIP entries", () => {
		const zip = createZip([
			{
				name: "001.wav",
				data: Buffer.from("deflated-wav"),
				compression: 8,
			},
		]);

		const entries = extractZipEntries(zip);
		expect(entries[0].data.toString()).toBe("deflated-wav");
	});
});
