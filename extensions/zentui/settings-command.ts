import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { getSettingsListTheme } from "@earendil-works/pi-coding-agent";
import {
	type SettingItem,
	SettingsList,
	type SettingsListTheme,
	truncateToWidth,
} from "@earendil-works/pi-tui";
import type { ColorSource, ColorSourcesConfig, PolishedTuiConfig } from "./config";
import { EDITOR_BORDER_STYLE, renderChromeBorder } from "./style";

const colorSourceValues: ColorSource[] = ["theme", "terminal"];

type SettingId = "starship" | "editorMessages";

type SettingsCommandDeps = {
	getConfig: () => PolishedTuiConfig;
	setColorSources: (patch: Partial<ColorSourcesConfig>) => void;
	requestRender: () => void;
	settingsListTheme?: SettingsListTheme;
};

const settingLabels: Record<SettingId, string> = {
	starship: "Starship/footer colors",
	editorMessages: "Editor + previous messages",
};

const settingDescriptions: Record<SettingId, string> = {
	starship:
		"Choose whether footer runtime/git/context colors use Pi theme tokens or terminal palette styles.",
	editorMessages:
		"Choose whether editor and previous user-message borders/rails use Pi theme colors or terminal palette styles.",
};

function isColorSource(value: string): value is ColorSource {
	return value === "theme" || value === "terminal";
}

function isSettingId(value: string): value is SettingId {
	return value === "starship" || value === "editorMessages";
}

function editorMessageValue(config: PolishedTuiConfig): ColorSource | "mixed" {
	return config.colorSources.editor === config.colorSources.userMessages
		? config.colorSources.editor
		: "mixed";
}

function patchForSetting(id: SettingId, value: ColorSource): Partial<ColorSourcesConfig> {
	return id === "starship" ? { starship: value } : { editor: value, userMessages: value };
}

function buildItems(config: PolishedTuiConfig): SettingItem[] {
	return (Object.keys(settingLabels) as SettingId[]).map((key) => ({
		id: key,
		label: settingLabels[key],
		description: settingDescriptions[key],
		currentValue: key === "starship" ? config.colorSources.starship : editorMessageValue(config),
		values: colorSourceValues,
	}));
}

export function registerZentuiSettingsCommand(pi: ExtensionAPI, deps: SettingsCommandDeps): void {
	pi.registerCommand("zentui", {
		description: "Configure Zentui colors",
		handler: async (_args, ctx) => {
			if (!ctx.hasUI) return;

			await ctx.ui.custom<void>((tui, theme, _keybindings, done) => {
				const settingsList = new SettingsList(
					buildItems(deps.getConfig()),
					5,
					deps.settingsListTheme ?? getSettingsListTheme(),
					(id, newValue) => {
						if (!isSettingId(id) || !isColorSource(newValue)) return;

						try {
							deps.setColorSources(patchForSetting(id, newValue));
							settingsList.updateValue(id, newValue);
							deps.requestRender();
							ctx.ui.notify(`${settingLabels[id]}: ${newValue}`, "info");
							tui.requestRender();
						} catch (error) {
							const message = error instanceof Error ? error.message : String(error);
							ctx.ui.notify(`Could not update Zentui settings: ${message}`, "error");
						}
					},
					() => done(undefined),
				);

				return {
					render(width: number) {
						const colorSource = deps.getConfig().colorSources.editor;
						const border = renderChromeBorder(
							theme,
							colorSource,
							EDITOR_BORDER_STYLE,
							"─".repeat(Math.max(0, width)),
						);
						const header = theme.fg("accent", theme.bold("Zentui settings"));
						const hint = theme.fg("dim", "Enter/Space cycles values · Esc closes");
						return [
							truncateToWidth(border, width, ""),
							truncateToWidth(header, width, ""),
							truncateToWidth(hint, width, ""),
							"",
							...settingsList.render(width),
							truncateToWidth(border, width, ""),
						];
					},
					invalidate() {
						settingsList.invalidate();
					},
					handleInput(data: string) {
						settingsList.handleInput(data);
					},
				};
			});
		},
	});
}
