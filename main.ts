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
import {
	calculateFontSize,
	decimalToHex,
	mapValue,
	memoize,
	nextTick,
} from "utils";

export default class TextSizePlugin extends Plugin {
	settings: TextSizePluginSettings;
	inPlaceSettings: InPlaceSettings;

	mainNode: string;

	calculateFontSize = memoize(calculateFontSize);
	mapValue = memoize(mapValue);

	private async refresh(leaf: Leaf) {
		// TODO: works fine on 'graph' but doesn't seem to affect 'localgraph'
		leaf.view.unload();
		leaf.view.load();
	}

	private async updateGraphViews() {
		const graphViews = this.app.workspace.getLeavesOfType("graph");
		const locaGraphViews = this.app.workspace.getLeavesOfType("localgraph");

		const update = async (leaf: Leaf) => {
			await this.modifyRenderer(leaf);

			this.inPlaceSettings.addSettings(leaf.containerEl);

			this.refresh(leaf);
		};

		graphViews.forEach(update);
		locaGraphViews.forEach(update);
	}

	private async modifyRenderer({ view }: Leaf) {
		const renderer = (view as AugmentedView).renderer;
		subscribeToValueChanges(renderer, () =>
			this.adjustFontSizeForAllNodes(renderer)
		);

		await this.adjustFontSizeForAllNodes(renderer);
	}

	private async adjustFontSizeForAllNodes(renderer: Renderer) {
		nextTick(() => {
			renderer.nodes.forEach((node) => {
				this.adjustFontSize(node);
				this.adjustTextColor(node);
			});
		});
	}

	private async adjustFontSize(node: Node) {
		if (!node.text) return;

		// if (node.text.style.fontSize === node.text.originalFontSize) return;

		if (!node.text.originalFontSize) {
			const fontSize = node.text.style.fontSize;
			node.text.originalFontSize = fontSize; // cache font size
		}

		const originalFontSize = parseInt(node.text.originalFontSize);

		const nodeSize = node.getSize();

		const multiplier = !this.settings.dependOnNodeSize
			? this.settings.maxSize
			: this.mapValue({
					value: nodeSize,
					inMin: nodeMinSize,
					inMax: nodeMaxSize,
					outMin: minAllowed,
					outMax: this.settings.maxSize,
			  });

		const newFontSize = this.calculateFontSize({
			fontSize: originalFontSize,
			multiplier,
		});

		node.text.style.fontSize = newFontSize + "px";
	}

	private async adjustTextColor(node: Node) {
		if (!node.text) return;

		const shouldTextMatchNodeColor = this.settings.matchNodeColor;

		if (!shouldTextMatchNodeColor) {
			if (node.text.originalColor)
				node.text.style.fill = node.text.originalColor; // revert text color

			return;
		}

		if (!node.text.originalColor) {
			const color = node.text.style.fill;
			node.text.originalColor = color; // cache color
		}

		const nodeColor = node.circle.tint;
		node.text.style.fill = decimalToHex(nodeColor);
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
		this.inPlaceSettings.removeInlineSettings();
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

function subscribeToValueChanges(renderer: Renderer, onChange: () => void) {
	Object.defineProperty(renderer, "_fNodeSizeMult", {
		value: renderer.fNodeSizeMult,
		writable: true,
		configurable: true,
		enumerable: false,
	});

	// "proxy" to observe graph view settings changes
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
