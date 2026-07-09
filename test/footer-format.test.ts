import { describe, expect, it } from "vitest";
import { parseFooterFormat, renderFormatSplit } from "../extensions/zentui/footer-format";

describe("parseFooterFormat", () => {
	it("returns empty array for empty string", () => {
		expect(parseFooterFormat("")).toEqual([]);
	});

	it("parses a single variable", () => {
		expect(parseFooterFormat("$cwd")).toEqual([{ kind: "var", name: "cwd" }]);
	});

	it("parses braced variables", () => {
		const braced = "${" + "git_branch}";
		expect(parseFooterFormat(braced)).toEqual([{ kind: "var", name: "git_branch" }]);
	});

	it("parses text and variables mixed", () => {
		expect(parseFooterFormat("$cwd on $git_branch")).toEqual([
			{ kind: "var", name: "cwd" },
			{ kind: "text", value: " on " },
			{ kind: "var", name: "git_branch" },
		]);
	});

	it("parses the fill token", () => {
		expect(parseFooterFormat("$fill")).toEqual([{ kind: "fill" }]);
	});

	it("preserves literal text exactly including multiple spaces", () => {
		const tokens = parseFooterFormat("$cwd   on   $git_branch");
		expect(tokens).toEqual([
			{ kind: "var", name: "cwd" },
			{ kind: "text", value: "   on   " },
			{ kind: "var", name: "git_branch" },
		]);
	});

	it("preserves leading and trailing text", () => {
		const tokens = parseFooterFormat("prefix $cwd suffix");
		expect(tokens).toEqual([
			{ kind: "text", value: "prefix " },
			{ kind: "var", name: "cwd" },
			{ kind: "text", value: " suffix" },
		]);
	});

	it("treats unknown variable names as var tokens", () => {
		expect(parseFooterFormat("$nope")).toEqual([{ kind: "var", name: "nope" }]);
	});

	it("handles mixed fill, vars, and text", () => {
		expect(parseFooterFormat("$cwd on $git_branch $fill $cost $time")).toEqual([
			{ kind: "var", name: "cwd" },
			{ kind: "text", value: " on " },
			{ kind: "var", name: "git_branch" },
			{ kind: "text", value: " " },
			{ kind: "fill" },
			{ kind: "text", value: " " },
			{ kind: "var", name: "cost" },
			{ kind: "text", value: " " },
			{ kind: "var", name: "time" },
		]);
	});
});

describe("renderFormatSplit", () => {
	const renderVar = (name: string): string => {
		const map: Record<string, string> = {
			cwd: "DIR",
			git_branch: "BRANCH",
			cost: "$0",
			time: "12:00",
			unknown: "",
		};
		return map[name] ?? "";
	};

	it("splits at the first fill token into left and right", () => {
		const tokens = parseFooterFormat("$cwd$fill$cost $time");
		const { left, middle, right } = renderFormatSplit(tokens, renderVar);
		expect(left).toBe("DIR");
		expect(middle).toBe("");
		expect(right).toBe("$0 12:00");
	});

	it("puts everything in left when there is no fill", () => {
		const tokens = parseFooterFormat("$cwd on $git_branch");
		const { left, middle, right } = renderFormatSplit(tokens, renderVar);
		expect(left).toBe("DIR on BRANCH");
		expect(middle).toBe("");
		expect(right).toBe("");
	});

	it("centers content between two fills in the middle zone", () => {
		const tokens = parseFooterFormat("$cwd$fill$cost$fill$time");
		const { left, middle, right } = renderFormatSplit(tokens, renderVar);
		expect(left).toBe("DIR");
		expect(middle).toBe("$0");
		expect(right).toBe("12:00");
	});

	it("ignores fill tokens beyond the first two", () => {
		const tokens = parseFooterFormat("$cwd$fill$cost$fill$time$fill");
		const { left, middle, right } = renderFormatSplit(tokens, renderVar);
		expect(left).toBe("DIR");
		expect(middle).toBe("$0");
		expect(right).toBe("12:00");
	});

	it("renders unknown variables as empty string", () => {
		const tokens = parseFooterFormat("$nope");
		const { left } = renderFormatSplit(tokens, renderVar);
		expect(left).toBe("");
	});

	it("renders literal text verbatim", () => {
		const tokens = parseFooterFormat("hello $cwd world");
		const { left } = renderFormatSplit(tokens, renderVar);
		expect(left).toBe("hello DIR world");
	});

	it("handles empty token list", () => {
		const { left, middle, right } = renderFormatSplit([], renderVar);
		expect(left).toBe("");
		expect(middle).toBe("");
		expect(right).toBe("");
	});

	it("handles fill at the start", () => {
		const tokens = parseFooterFormat("$fill$cost");
		const { left, middle, right } = renderFormatSplit(tokens, renderVar);
		expect(left).toBe("");
		expect(middle).toBe("");
		expect(right).toBe("$0");
	});

	it("handles fill at the end", () => {
		const tokens = parseFooterFormat("$cwd$fill");
		const { left, middle, right } = renderFormatSplit(tokens, renderVar);
		expect(left).toBe("DIR");
		expect(middle).toBe("");
		expect(right).toBe("");
	});
});
