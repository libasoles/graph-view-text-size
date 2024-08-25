import TextSizePlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";
import { TextSizePluginSettings } from "types";
import { calculateFontSize } from "utils";

// values used by the graph view settings
export const nodeMinSize = 0.1;
export const nodeMaxSize = 5;

// the multiplier range for the font size that we will apply to font size
export const minAllowed = 1;
const defaultMax = 2.5;
export const maxAllowed = 3;

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

		containerEl.createEl("p", {
			text: "This is an alpha version so you'll have to help. Focus on graph view after closing the settings for the changes to take effect.",
		});

		new Setting(containerEl)
			.setName("Max font size")
			.setDesc(
				"Font size will grow based on the node scale. That is controlled in the graph view settings. Here you are saying how big the font size can get. You are not setting the font size directly."
			)
			.addSlider((slider) => {
				slider
					.setLimits(minAllowed, maxAllowed, 0.1)
					.setValue(this.plugin.settings.maxSize)
					.setInstant(true)
					.onChange(async (value) => {
						this.plugin.settings.maxSize = value;

						demo.style.fontSize =
							calculateFontSize({
								fontSize: 10,
								multiplier: value,
							}) + "px";

						await this.plugin.saveSettings();
					});
			});

		const demo = containerEl.createEl("p", {
			text: "The quick brown fox jumps over the lazy dog",
			attr: {
				style:
					"font-size: " +
					calculateFontSize({
						fontSize: 10,
						multiplier: this.plugin.settings.maxSize,
					}) +
					"px",
			},
		});
	}
}
