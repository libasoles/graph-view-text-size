import TextSizePlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";
import { TextSizePluginSettings } from "types";
import { mapValue } from "utils";

export const minAllowed = 10;
const defaultMax = 40;
export const maxAllowed = 120;

export const DEFAULT_SETTINGS: TextSizePluginSettings = {
	maxSize: defaultMax,
};

export class TextSettingTab extends PluginSettingTab {
	plugin: TextSizePlugin;

	constructor(app: App, plugin: TextSizePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Max font size")
			.setDesc(
				"Font size will match the node scale settings until reaches this max value you are setting here."
			)
			.addSlider((slider) => {
				slider
					.setLimits(minAllowed, maxAllowed, 1)
					.setValue(this.plugin.settings.maxSize)
					.setInstant(true)
					.onChange(async (value) => {
						this.plugin.settings.maxSize = value;

						demo.style.fontSize = this.map(value) + "px";

						await this.plugin.saveSettings();
					});
			});

		const demo = containerEl.createEl("p", {
			text: "The quick brown fox jumps over the lazy dog",
			attr: {
				style:
					"font-size: " +
					this.map(this.plugin.settings.maxSize) +
					"px",
			},
		});
	}

	map(value: number) {
		return mapValue({
			value,
			inMin: minAllowed,
			inMax: maxAllowed,
			outMin: 10,
			outMax: 40,
		});
	}
}
