import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";

export type ColorSpec = string;
export type ColorSource = "theme" | "terminal";

export type ColorSourcesConfig = {
	starship: ColorSource;
	editor: ColorSource;
	userMessages: ColorSource;
};

const DEFAULT_PROJECT_REFRESH_INTERVAL_MS = 30_000;
const MIN_PROJECT_REFRESH_INTERVAL_MS = 5_000;

export type PolishedTuiConfig = {
	projectRefreshIntervalMs: number;
	icons: {
		cwd: string;
		git: string;
		ahead: string;
		behind: string;
		diverged: string;
		conflicted: string;
		untracked: string;
		stashed: string;
		modified: string;
		staged: string;
		renamed: string;
		deleted: string;
		typechanged: string;
	};
	colors: {
		cwd: ColorSpec;
		gitBranch: ColorSpec;
		gitStatus: ColorSpec;
		contextNormal: ColorSpec;
		contextWarning: ColorSpec;
		contextError: ColorSpec;
		tokens: ColorSpec;
		cost: ColorSpec;
		separator: ColorSpec;
		runtimePrefix: ColorSpec;
	};
	colorSources: ColorSourcesConfig;
};

export const configPath = join(getAgentDir(), "zentui.json");

export const defaultConfig: PolishedTuiConfig = {
	projectRefreshIntervalMs: DEFAULT_PROJECT_REFRESH_INTERVAL_MS,
	icons: {
		cwd: "󰝰",
		git: "",
		ahead: "↑",
		behind: "↓",
		diverged: "⇕",
		conflicted: "=",
		untracked: "?",
		stashed: "$",
		modified: "!",
		staged: "+",
		renamed: "»",
		deleted: "✘",
		typechanged: "T",
	},
	colors: {
		cwd: "bold cyan",
		gitBranch: "bold purple",
		gitStatus: "bold red",
		contextNormal: "dimmed",
		contextWarning: "bold yellow",
		contextError: "bold red",
		tokens: "dimmed",
		cost: "bold green",
		separator: "dimmed",
		runtimePrefix: "",
	},
	colorSources: {
		starship: "theme",
		editor: "theme",
		userMessages: "theme",
	},
};

type ConfigRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ConfigRecord {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseProjectRefreshIntervalMs(value: unknown): number {
	if (value === 0) return 0;
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return defaultConfig.projectRefreshIntervalMs;
	}

	const interval = Math.round(value);
	return interval >= MIN_PROJECT_REFRESH_INTERVAL_MS
		? interval
		: defaultConfig.projectRefreshIntervalMs;
}

function stringValue(record: Record<string, unknown>, key: string): string | undefined {
	const value = record[key];
	return typeof value === "string" ? value : undefined;
}

function colorSourceValue(
	record: Record<string, unknown>,
	key: keyof ColorSourcesConfig,
): ColorSource {
	const value = record[key];
	return value === "terminal" || value === "theme" ? value : defaultConfig.colorSources[key];
}

function definedColors(
	colors: Partial<Record<keyof PolishedTuiConfig["colors"], string | undefined>>,
): Partial<PolishedTuiConfig["colors"]> {
	return Object.fromEntries(
		Object.entries(colors).filter(
			(entry): entry is [keyof PolishedTuiConfig["colors"], string] => typeof entry[1] === "string",
		),
	) as Partial<PolishedTuiConfig["colors"]>;
}

function normalizeColors(record: Record<string, unknown>): Partial<PolishedTuiConfig["colors"]> {
	return definedColors({
		cwd: stringValue(record, "cwd") ?? stringValue(record, "cwdText"),
		gitBranch: stringValue(record, "gitBranch") ?? stringValue(record, "git"),
		gitStatus: stringValue(record, "gitStatus"),
		contextNormal: stringValue(record, "contextNormal"),
		contextWarning: stringValue(record, "contextWarning"),
		contextError: stringValue(record, "contextError"),
		tokens: stringValue(record, "tokens"),
		cost: stringValue(record, "cost"),
		separator: stringValue(record, "separator"),
		runtimePrefix: stringValue(record, "runtimePrefix"),
	});
}

function normalizeColorSources(record: Record<string, unknown>): ColorSourcesConfig {
	return {
		starship: colorSourceValue(record, "starship"),
		editor: colorSourceValue(record, "editor"),
		userMessages: colorSourceValue(record, "userMessages"),
	};
}

function isColorSourceKey(value: string): value is keyof ColorSourcesConfig {
	return value === "starship" || value === "editor" || value === "userMessages";
}

function validColorSourceEntries(record: Record<string, unknown>): Partial<ColorSourcesConfig> {
	return Object.fromEntries(
		Object.entries(record).filter((entry): entry is [keyof ColorSourcesConfig, ColorSource] => {
			const [key, value] = entry;
			return isColorSourceKey(key) && (value === "theme" || value === "terminal");
		}),
	) as Partial<ColorSourcesConfig>;
}

function readConfigRecord(path = configPath): ConfigRecord {
	try {
		if (!existsSync(path)) return {};
		const parsed = JSON.parse(readFileSync(path, "utf8"));
		return isRecord(parsed) ? parsed : {};
	} catch {
		return {};
	}
}

export function ensureConfigExists(): void {
	try {
		if (!existsSync(configPath)) {
			writeFileSync(configPath, `${JSON.stringify(defaultConfig, null, 2)}\n`, "utf8");
		}
	} catch {
		// Ignore config bootstrap failures; extension will fall back to defaults.
	}
}

export function mergeConfig(parsed: unknown): PolishedTuiConfig {
	const config = isRecord(parsed) ? parsed : {};
	const icons = isRecord(config.icons) ? (config.icons as Partial<PolishedTuiConfig["icons"]>) : {};
	const colors = isRecord(config.colors)
		? normalizeColors(config.colors as Record<string, unknown>)
		: {};
	const colorSources = isRecord(config.colorSources)
		? normalizeColorSources(config.colorSources as Record<string, unknown>)
		: defaultConfig.colorSources;
	return {
		projectRefreshIntervalMs: parseProjectRefreshIntervalMs(config.projectRefreshIntervalMs),
		icons: {
			...defaultConfig.icons,
			...icons,
		},
		colors: {
			...defaultConfig.colors,
			...colors,
		},
		colorSources,
	};
}

export function loadConfig(): PolishedTuiConfig {
	try {
		if (!existsSync(configPath)) return defaultConfig;
		return mergeConfig(JSON.parse(readFileSync(configPath, "utf8")));
	} catch {
		return defaultConfig;
	}
}

export function saveColorSourcesPatch(
	patch: Partial<ColorSourcesConfig>,
	path = configPath,
): PolishedTuiConfig {
	const record = readConfigRecord(path);
	const existing = isRecord(record.colorSources)
		? validColorSourceEntries(record.colorSources as Record<string, unknown>)
		: {};
	record.colorSources = {
		...defaultConfig.colorSources,
		...existing,
		...validColorSourceEntries(patch),
	};
	writeFileSync(path, `${JSON.stringify(record, null, 2)}\n`, "utf8");
	return mergeConfig(record);
}
