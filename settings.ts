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
	enableInPlaceSettings: false,
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
			text: "This is an alpha version so you'll have to help. Focus on graph view after closing the settings for the changes to take effect (specially on local grah view).",
		});

		new Setting(containerEl)
			.setName("Display these controls in Graph View settings")
			.setDesc(
				"Experimental. It might stop working after tinkering with it a bit. You can always come back and configure the plugin here."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.enableInPlaceSettings)
					.onChange(async (value) => {
						this.plugin.settings.enableInPlaceSettings = value;

						this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Match node color")
			.setDesc(
				"Font color will match the node color. Don't expect fully accurate results yet. This is experimental."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.matchNodeColor)
					.onChange(async (value) => {
						this.plugin.settings.matchNodeColor = value;

						this.plugin.saveSettings();
					});
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

export class InPlaceSettings {
	plugin: TextSizePlugin;

	constructor(plugin: TextSizePlugin) {
		this.plugin = plugin;
	}

	getTargetNode(containerEl: HTMLElement) {
		return containerEl
			.getElementsByClassName("graph-control-section")[2]
			.getElementsByClassName("tree-item-children")[0] as HTMLElement;
	}

	addSettings(containerEl: HTMLElement) {
		const isFeatureEnabled = this.plugin.settings.enableInPlaceSettings;

		if (!isFeatureEnabled) {
			this.removeInlineSettings();

			return;
		}

		const parentNode = this.getTargetNode(containerEl);

		this.addMatchNodeColorSetting(parentNode);
		this.addMaxSizeSetting(parentNode);
	}

	removeInlineSettings() {
		const containerElements =
			document.getElementsByClassName("graph-controls");

		for (let i = 0; i < containerElements.length; i++) {
			const container = containerElements[i] as HTMLElement;

			const parentNode = this.getTargetNode(container);

			const childrenToRemove = parentNode.getElementsByClassName(
				"custom-plugin-setting"
			);

			Array.from(childrenToRemove).forEach((child) => {
				parentNode.removeChild(child);
			});
		}

		// TODO: reset settings when plugin is disabled
		// this.plugin.settings.enableInPlaceSettings = false;
		// this.plugin.settings.matchNodeColor = false;
		// this.plugin.settings.maxSize = defaultMax;
	}

	addMatchNodeColorSetting(parentNode: HTMLElement) {
		const alreadyApplied =
			parentNode.getElementsByClassName("custom-plugin-toggle").length >
			0;

		if (alreadyApplied) return;

		// const target = parentNode.getElementsByClassName(
		// 	"mod-toggle"
		// )[0] as HTMLElement;

		const target = parentNode.getElementsByClassName(
			"mod-slider"
		)[1] as HTMLElement;

		const container = parentNode.insertAfter(
			document.createElement("div"),
			target
		);
		container.addClass("custom-plugin-setting");

		// TODO: for some reason, the label is not visible
		new Setting(container)
			.setName("Match node colors")
			.setTooltip("Experimental")
			.setClass("custom-plugin-toggle")
			.setClass("mod-toggle")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.matchNodeColor)
					.onChange(async (value) => {
						this.plugin.settings.matchNodeColor = value;
						this.plugin.saveSettings();
					});
			});
	}

	addMaxSizeSetting(parentNode: HTMLElement) {
		const alreadyApplied =
			parentNode.getElementsByClassName("custom-plugin-slider").length >
			0;

		if (alreadyApplied) return;

		const target = parentNode.getElementsByClassName(
			"mod-slider"
		)[1] as HTMLElement;

		const container = parentNode.insertAfter(
			document.createElement("div"),
			target
		);
		container.addClass("custom-plugin-setting");

		new Setting(container)
			.setName("Font max size")
			.setTooltip("Experimental")
			.setClass("custom-plugin-slider")
			.setClass("mod-slider")
			.addSlider((slider) => {
				slider
					.setLimits(minAllowed, maxAllowed, 0.1)
					.setValue(defaultMax)
					.setInstant(true)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.maxSize = value;
						this.plugin.saveSettings();
					});
			});
	}
}
