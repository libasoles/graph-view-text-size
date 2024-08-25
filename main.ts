import { Plugin, WorkspaceLeaf } from "obsidian";
import {
	DEFAULT_SETTINGS,
	minAllowed,
	nodeMaxSize,
	nodeMinSize,
	TextSettingTab,
} from "settings";
import { AugmentedView, Node, Renderer, TextSizePluginSettings } from "types";
import { calculateFontSize, decimalToHex, mapValue, memoize } from "utils";

export default class TextSizePlugin extends Plugin {
	settings: TextSizePluginSettings;

	memoizedCalculateFontSize = memoize(calculateFontSize);
	memoizedMap = memoize(mapValue);

	async refresh(leaf: WorkspaceLeaf) {
		// TODO: works fine on graph but doesn't seem to affect localgraph
		leaf.view.unload();
		leaf.view.load();
	}

	async updateGraphViews() {
		const graphViews = this.app.workspace.getLeavesOfType("graph");
		const locaGraphViews = this.app.workspace.getLeavesOfType("localgraph");

		graphViews.forEach(async (leaf: WorkspaceLeaf) => {
			await this.observeNodeSizeSetting(leaf);

			this.refresh(leaf);
		});

		locaGraphViews.forEach(async (leaf: WorkspaceLeaf) => {
			await this.observeNodeSizeSetting(leaf);

			this.refresh(leaf);
		});
	}

	private async observeNodeSizeSetting(leaf: WorkspaceLeaf) {
		const renderer = (leaf.view as AugmentedView).renderer;
		this.subscribeToValueChanges(renderer, () =>
			this.adjustFontSizeForAllNodes(renderer)
		);

		this.adjustFontSizeForAllNodes(renderer);
	}

	async adjustFontSizeForAllNodes(renderer: Renderer) {
		setTimeout(() => {
			renderer.nodes.forEach(this.adjustFontSizeForNode.bind(this));
		}, 0);
	}

	async adjustFontSizeForNode(target: Node) {
		const nodeSize = target.renderer.fNodeSizeMult;

		if (!target.text) return;

		if (!target.text.originalFontSize) {
			const fontSize = target.text.style.fontSize;
			target.text.originalFontSize = fontSize;
		}
		const originalFontSize = parseInt(target.text.originalFontSize);

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

		target.text.style.fontSize = newFontSize + "px";

		if (this.settings.matchNodeColor) {
			const nodeColor = target.circle.tint;
			target.text.style.fill = decimalToHex(nodeColor);
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

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.updateGraphViews();
		await this.saveData(this.settings);
	}
}
