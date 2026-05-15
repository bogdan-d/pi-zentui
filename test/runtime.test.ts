import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { detectRuntime, runtimeMetadata } from "../extensions/zentui/runtime";

function starshipRuntimeModules(): string[] {
	const toml = readFileSync("test/fixtures/starship-nerd-font-symbols.toml", "utf8");
	return Array.from(toml.matchAll(/^\[([^\]]+)\]/gm), (match) => match[1]).sort();
}

function makeProject(entries: Array<{ path: string; dir?: boolean }>): {
	cwd: string;
	names: string[];
} {
	const cwd = mkdtempSync(join(tmpdir(), "zentui-runtime-"));
	for (const entry of entries) {
		const fullPath = join(cwd, entry.path);
		if (entry.dir) mkdirSync(fullPath, { recursive: true });
		else writeFileSync(fullPath, "", "utf8");
	}
	return { cwd, names: entries.map((entry) => entry.path) };
}

describe("runtimeMetadata", () => {
	it("covers Starship Nerd Font runtime and language modules with icons and official colors", () => {
		const byName = new Map(runtimeMetadata.map((runtime) => [runtime.name, runtime]));

		expect([...byName.keys()].sort()).toEqual(starshipRuntimeModules());
		expect(byName.get("bun")).toMatchObject({
			symbol: "",
			color: "#FBF0DF",
		});
		expect(byName.get("deno")).toMatchObject({
			symbol: "",
			color: "#000000",
		});
		expect(byName.get("golang")).toMatchObject({
			symbol: "",
			color: "#72C9D8",
		});
		expect(byName.get("java")).toMatchObject({
			symbol: "",
			color: "#007396",
		});
		expect(byName.get("opa")).toMatchObject({
			symbol: "",
			color: "#506060",
		});
		expect(byName.get("zig")).toMatchObject({
			symbol: "",
			color: "#F7A41D",
		});
		for (const runtime of runtimeMetadata) {
			expect(Object.keys(runtime).sort()).toEqual(["color", "name", "symbol"]);
			expect(runtime.color).toMatch(/^#[0-9A-F]{6}$/);
		}
	});
});

describe("detectRuntime", () => {
	it("prefers bun over node when both markers exist", () => {
		const project = makeProject([{ path: "package.json" }, { path: "bun.lock" }]);
		const runtime = detectRuntime(project.cwd, project.names);
		if (!runtime) throw new Error("expected runtime");
		expect(runtime.name).toBe("bun");
	});

	it("detects deno from config files", () => {
		const project = makeProject([{ path: "deno.json" }]);
		const runtime = detectRuntime(project.cwd, project.names);
		if (!runtime) throw new Error("expected runtime");
		expect(runtime.name).toBe("deno");
		expect(runtime.color).toBe("#000000");
	});

	it("keeps existing node priority when node and go markers both exist", () => {
		const project = makeProject([{ path: "package.json" }, { path: "go.mod" }]);
		const runtime = detectRuntime(project.cwd, project.names);
		if (!runtime) throw new Error("expected runtime");
		expect(runtime.name).toBe("nodejs");
	});

	it("keeps existing runtime detection markers narrow", () => {
		for (const marker of ["index.js", "script.py", "Main.java", "lib.rs", "main.go"]) {
			const project = makeProject([{ path: marker }]);
			expect(detectRuntime(project.cwd, project.names)).toBeUndefined();
		}
	});

	it("prefers newly added tool-specific markers over legacy runtime markers", () => {
		const maven = makeProject([{ path: "pom.xml" }]);
		const gradle = makeProject([{ path: "build.gradle" }]);
		const xmake = makeProject([{ path: "xmake.lua" }]);

		expect(detectRuntime(maven.cwd, maven.names)?.name).toBe("maven");
		expect(detectRuntime(gradle.cwd, gradle.names)?.name).toBe("gradle");
		expect(detectRuntime(xmake.cwd, xmake.names)?.name).toBe("xmake");
	});

	it("keeps java reachable with a Java-specific marker", () => {
		const project = makeProject([{ path: ".java-version" }]);
		expect(detectRuntime(project.cwd, project.names)?.name).toBe("java");
	});

	it("detects lua from top-level lua directory", () => {
		const project = makeProject([{ path: "lua", dir: true }]);
		const runtime = detectRuntime(project.cwd, project.names);
		if (!runtime) throw new Error("expected runtime");
		expect(runtime.name).toBe("lua");
	});

	it.each([
		["buf", "buf.yaml", "#0E5DF5"],
		["c", "hello.c", "#A8B9CC"],
		["cpp", "hello.cpp", "#00599C"],
		["elixir", "mix.exs", "#4B275F"],
		["gleam", "gleam.toml", "#FFAFF3"],
		["julia", "Project.toml", "#9558B2"],
		["opa", "policy.rego", "#506060"],
		["pixi", "pixi.toml", "#FCD006"],
		["swift", "Package.swift", "#F05138"],
		["xmake", "xmake.lua", "#8BC34A"],
		["zig", "build.zig", "#F7A41D"],
	])("detects %s projects from Starship markers", (name, marker, color) => {
		const project = makeProject([{ path: marker }]);
		const runtime = detectRuntime(project.cwd, project.names);
		if (!runtime) throw new Error("expected runtime");
		expect(runtime.name).toBe(name);
		expect(runtime.color).toBe(color);
	});

	it.each([
		["conda", { CONDA_DEFAULT_ENV: "py312" }, "#44A833"],
		["guix_shell", { GUIX_ENVIRONMENT: "/gnu/store/profile" }, "#FFBF2D"],
		["meson", { MESON_DEVENV: "1", MESON_PROJECT_NAME: "zentui" }, "#39207C"],
		["nix_shell", { IN_NIX_SHELL: "pure" }, "#5277C3"],
		["spack", { SPACK_ENV: "dev" }, "#0F3A80"],
	])("detects %s from Starship environment markers", (name, env, color) => {
		const project = makeProject([]);
		const runtime = detectRuntime(project.cwd, project.names, env);
		if (!runtime) throw new Error("expected runtime");
		expect(runtime.name).toBe(name);
		expect(runtime.color).toBe(color);
	});
});
