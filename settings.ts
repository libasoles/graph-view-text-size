import TextSizePlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";
import { TextSizePluginSettings } from "types";
import { calculateFontSize } from "utils";

// node size range
export const nodeMinSize = 0.1;
export const nodeMaxSize = 80;

// the multiplier range for the font size that we will apply to font size
export const minAllowed = 1;
export const defaultMax = 4;
export const maxAllowed = 6;

export const DEFAULT_SETTINGS: TextSizePluginSettings = {
	dependOnNodeSize: true,
	matchNodeColor: false,
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
			text: "This is a beta version so you'll have to help. For local Graph View, focus on the window after closing the settings for the changes to take effect.",
		});

		new Setting(containerEl)
			.setName("Match node color")
			.setDesc("Font color will match the node color.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.matchNodeColor)
					.onChange(async (value) => {
						this.plugin.settings.matchNodeColor = value;

						this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Text size depends on node size")
			.setDesc(
				"Recommended. Otherwise, all text will have the same size."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.dependOnNodeSize)
					.onChange(async (value) => {
						this.plugin.settings.dependOnNodeSize = value;

						this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Max font size")
			.setDesc(
				"How big the font size can get. If text size is dependant on node size, then you are not setting the font size directly, just a max size."
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

						this.plugin.saveSettings();
					});
			});

		// Demo is not really accurate but gives an idea of the possible font size
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
