import { View } from "obsidian";

export interface AugmentedView extends View {
	renderer: Renderer;
}

export interface Renderer {
	nodes: Node[];
	fNodeSizeMult: number;
}

export interface Node {
	text: {
		originalFontSize?: string;
		style: {
			fontSize: string;
			fill: string;
		};
	};
	renderer: Renderer;
	circle: {
		tint: number;
	};
}

export interface TextSizePluginSettings {
	matchNodeColor: boolean;
	maxSize: number;
}
