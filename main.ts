import { Plugin } from "obsidian";
import {
	DEFAULT_SETTINGS,
	InPlaceSettings,
	minAllowed,
	nodeMaxSize,
	nodeMinSize,
	TextSettingTab,
} from "settings";
import {
	AugmentedView,
	Leaf,
	Node,
	Renderer,
	TextSizePluginSettings,
} from "types";
import { calculateFontSize, decimalToHex, mapValue, memoize } from "utils";

export default class TextSizePlugin extends Plugin {
	settings: TextSizePluginSettings;
	inPlaceSettings: InPlaceSettings;

	memoizedCalculateFontSize = memoize(calculateFontSize);
	memoizedMap = memoize(mapValue);

	async refresh(leaf: Leaf) {
		// TODO: works fine on graph but doesn't seem to affect localgraph
		leaf.view.unload();
		leaf.view.load();
	}

	async updateGraphViews() {
		const graphViews = this.app.workspace.getLeavesOfType("graph");
		const locaGraphViews = this.app.workspace.getLeavesOfType("localgraph");

		graphViews.forEach(async (leaf: Leaf) => {
			await this.observeNodeSizeSetting(leaf);

			this.inPlaceSettings.addSettings(leaf.containerEl);

			this.refresh(leaf);
		});

		locaGraphViews.forEach(async (leaf: Leaf) => {
			await this.observeNodeSizeSetting(leaf);

			this.inPlaceSettings.addSettings(leaf.containerEl);

			this.refresh(leaf);
		});
	}

	private async observeNodeSizeSetting(leaf: Leaf) {
		const renderer = (leaf.view as AugmentedView).renderer;
		this.subscribeToValueChanges(renderer, () =>
			this.adjustFontSizeForAllNodes(renderer)
		);

		this.adjustFontSizeForAllNodes(renderer);
	}

	async adjustFontSizeForAllNodes(renderer: Renderer) {
		setTimeout(() => {
			renderer.nodes.forEach((target) => {
				this.adjustFontSize(target);

				this.adjustColorForNode(target);
			});
		}, 0);
	}

	async adjustFontSize(node: Node) {
		const nodeSize = node.renderer.fNodeSizeMult;

		if (!node.text) return;

		if (!node.text.originalFontSize) {
			const fontSize = node.text.style.fontSize;
			node.text.originalFontSize = fontSize;
		}
		const originalFontSize = parseInt(node.text.originalFontSize);

		const multiplier = this.memoizedMap({
			value: nodeSize,
			inMin: nodeMinSize,
			inMax: nodeMaxSize,
			outMin: minAllowed,
			outMax: this.settings.maxSize,
		});

		const newFontSize = this.memoizedCalculateFontSize({
			fontSize: originalFontSize,
			multiplier,
		});

		node.text.style.fontSize = newFontSize + "px";
	}

	async adjustColorForNode(node: Node) {
		if (!node.text) return;

		if (this.settings.matchNodeColor) {
			if (!node.text.originalColor) {
				const color = node.text.style.fill;
				node.text.originalColor = color;
			}

			const nodeColor = node.circle.tint;
			node.text.style.fill = decimalToHex(nodeColor);
		} else {
			// revert color
			if (node.text.originalColor)
				node.text.style.fill = node.text.originalColor;
		}
	}

	private subscribeToValueChanges(renderer: Renderer, onChange: () => void) {
		Object.defineProperty(renderer, "_fNodeSizeMult", {
			value: renderer.fNodeSizeMult,
			writable: true,
			configurable: true,
			enumerable: false,
		});

		// proxy to observe grah view settings changes
		Object.defineProperty(renderer, "fNodeSizeMult", {
			get: function () {
				return this._fNodeSizeMult;
			},
			set: function (value) {
				this._fNodeSizeMult = value;

				onChange();
			},
			configurable: true,
			enumerable: true,
		});
	}

	async onload() {
		await this.loadSettings();

		this.inPlaceSettings = new InPlaceSettings(this);

		// TODO: not sure what events to listen to
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", async () => {
				await this.updateGraphViews();
			})
		);

		this.registerEvent(
			this.app.workspace.on("layout-change", async () => {
				await this.updateGraphViews();
			})
		);

		this.registerEvent(
			this.app.workspace.on("editor-change", async () => {
				await this.updateGraphViews();
			})
		);

		this.addSettingTab(new TextSettingTab(this.app, this));
	}

	onunload() {
		this.inPlaceSettings.remove();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		// TODO: local graph is not reacting immediately to changes
		await this.saveData(this.settings);
		await this.updateGraphViews();
	}
}
