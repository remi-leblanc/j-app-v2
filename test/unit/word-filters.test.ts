import { describe, expect, it } from "vitest";
import {
	parseCategories,
	parseGlossLangs,
	parseLevels,
	parseWordCount,
	parseWordQueryParams,
} from "../../server/utils/word-filters";

describe("parseCategories", () => {
	it("filters invalid or unknown values", () => {
		expect(parseCategories("nom,verbe,thing,adjectif")).toEqual([
			"nom",
			"verbe",
			"adjectif",
		]);
	});

	it("accepts arrays", () => {
		expect(parseCategories(["nom", "verbe", "thing", "adjectif"])).toEqual([
			"nom",
			"verbe",
			"adjectif",
		]);
	});

	it("returns an empty array when undefined", () => {
		expect(parseCategories(undefined)).toEqual([]);
	});
});

describe("parseLevels", () => {
	it("accepts only 1, 2, 3, 4 and 5", () => {
		expect(parseLevels("1,2,3,4,5")).toEqual([1, 2, 3, 4, 5]);
		expect(parseLevels("0,1,2,3,4,5,6,test")).toEqual([1, 2, 3, 4, 5]);
	});

	it("accepts levels in any order", () => {
		expect(parseLevels("4,2,3")).toEqual([4, 2, 3]);
	});

	it("returns an empty array when undefined", () => {
		expect(parseLevels(undefined)).toEqual([]);
	});
});

describe("parseWordCount", () => {
	it("defaults to 20 when undefined or invalid", () => {
		expect(parseWordCount(undefined)).toBe(20);
		expect(parseWordCount("")).toBe(20);
		expect(parseWordCount("test,+50,ytz(i)[x]")).toBe(20);
	});

	it("clamps between 0 and 100", () => {
		expect(parseWordCount("-20")).toBe(0);
		expect(parseWordCount("50")).toBe(50);
		expect(parseWordCount("130")).toBe(100);
	});

	it("uses the first value when an array is provided", () => {
		expect(parseWordCount(["75", "10"])).toBe(75);
	});
});

describe("parseGlossLangs", () => {
	it("normalizes language codes to lowercase", () => {
		expect(parseGlossLangs("FRE,Eng")).toEqual(["fre", "eng"]);
	});

	it("accepts arrays", () => {
		expect(parseGlossLangs(["FRE", "DEU"])).toEqual(["fre", "deu"]);
	});
});

describe("parseWordQueryParams", () => {
	it("parses categories, levels, maxWords and requireAudio", () => {
		expect(
			parseWordQueryParams({
				categories: "nom,verbe",
				levels: "5,4",
				maxWords: "30",
				requireAudio: "true",
			}),
		).toEqual({
			categories: ["nom", "verbe"],
			levels: [5, 4],
			maxWords: 30,
			requireAudio: true,
		});
	});

	it("supports legacy aliases types and jlpt", () => {
		expect(
			parseWordQueryParams({
				types: "adjectif",
				jlpt: "3",
			}),
		).toEqual({
			categories: ["adjectif"],
			levels: [3],
			maxWords: 20,
			requireAudio: false,
		});
	});

	it("treats requireAudio true boolean as enabled", () => {
		expect(parseWordQueryParams({ requireAudio: true }).requireAudio).toBe(
			true,
		);
	});

	it("defaults requireAudio to false when absent", () => {
		expect(parseWordQueryParams({}).requireAudio).toBe(false);
	});
});
