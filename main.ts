import { Plugin, WorkspaceLeaf } from "obsidian";
import {
	DEFAULT_SETTINGS,
	minAllowed,
	nodeMaxSize,
	nodeMinSize,
	TextSettingTab,
} from "settings";
import { AugmentedView, Renderer, TextSizePluginSettings } from "types";
import { calculateFontSize, mapValue, memoize } from "utils";

export default class TextSizePlugin extends Plugin {
	settings: TextSizePluginSettings;

	memoizedCalculateFontSize = memoize(calculateFontSize);
	memoizedMap = memoize(mapValue);

	async refresh(leaf: WorkspaceLeaf) {
		leaf.view.unload();
		leaf.view.load();
	}

	async updateGraphViews() {
		const graphViews = this.app.workspace.getLeavesOfType("graph");
		const locaGraphViews = this.app.workspace.getLeavesOfType("localgraph");

		graphViews.forEach((leaf: WorkspaceLeaf) => {
			this.observeNodeSizeSetting(leaf);

			this.refresh(leaf);
		});

		locaGraphViews.forEach((leaf: WorkspaceLeaf) => {
			this.refresh(leaf);
			this.observeNodeSizeSetting(leaf);

			this.refresh(leaf);
		});
	}

	private async observeNodeSizeSetting(leaf: WorkspaceLeaf) {
		const renderer = (leaf.view as AugmentedView).renderer;
		this.subscribeToValueChanges(renderer, () =>
			this.adjustFontSize(renderer)
		);

		this.adjustFontSize(renderer);
	}

	async adjustFontSize(renderer: Renderer) {
		const nodeSize = renderer.fNodeSizeMult;

		renderer.links.forEach((link) => {
			const { target } = link;

			if (!target.text) return;

			if (!target.text.originalFontSize) {
				const fontSize = link.target.text.style.fontSize;
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
		});
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
