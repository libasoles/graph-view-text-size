import { View, WorkspaceLeaf } from "obsidian";

export interface Leaf extends WorkspaceLeaf {
	containerEl: HTMLElement;
}

export interface AugmentedView extends View {
	renderer: Renderer;
}

export interface Renderer {
	nodes: Node[];
	fNodeSizeMult: number;
}

export interface Node {
	text: {
		originalColor?: string;
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
	getSize: () => number;
}

export interface TextSizePluginSettings {
	dependOnNodeSize: boolean;
	matchNodeColor: boolean;
	maxSize: number;
}
