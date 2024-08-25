import { Plugin, WorkspaceLeaf } from "obsidian";
import { DEFAULT_SETTINGS, minAllowed, TextSettingTab } from "settings";
import { AugmentedView, Renderer, TextSizePluginSettings } from "types";
import { mapValue, memoize } from "utils";

export const nodeMinSize = 0.1;
export const nodeMaxSize = 5;

export default class TextSizePlugin extends Plugin {
	settings: TextSizePluginSettings;

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

	calculateFontSize({
		fontSize,
		nodeSize,
	}: {
		fontSize: number;
		nodeSize: number;
	}): number {
		return Math.ceil(fontSize * nodeSize);
	}

	memoizedCalculateFontSize = memoize(this.calculateFontSize);
	memoizedMap = memoize(mapValue);

	async adjustFontSize(renderer: Renderer) {
		const nodeSize = renderer.fNodeSizeMult;
		const lista = [];
		renderer.links.forEach((link) => {
			const { target } = link;
			if (!target.text) return;

			if (!target.text.originalFontSize) {
				const fontSize = link.target.text.style.fontSize;
				target.text.originalFontSize = fontSize;
			}
			lista.push(target.text.originalFontSize);
			const originalFontSize = target.text.originalFontSize;

			const newRawFontSize = this.memoizedCalculateFontSize({
				fontSize: originalFontSize,
				nodeSize,
			});

			const newFontSize = this.memoizedMap({
				value: newRawFontSize,
				inMin: 25,
				inMax: 35,
				outMin: minAllowed,
				outMax: this.settings.maxSize,
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

		// proxy
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

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"dice",
			"Reload",
			(evt: MouseEvent) => {
				window.location.reload();
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

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
