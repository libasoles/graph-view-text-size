import { View } from "obsidian";

export interface AugmentedView extends View {
	renderer: Renderer;
}

export interface Renderer {
	links: Link[];
	fNodeSizeMult: number;
}

interface Link {
	target: {
		text: {
			style: {
				fontSize: string;
			};
		};
	};
}

export interface TextSizePluginSettings {
	maxSize: number;
}
