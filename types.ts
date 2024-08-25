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
			originalFontSize?: string;
			style: {
				fontSize: string;
			};
		};
	};
}

export interface TextSizePluginSettings {
	maxSize: number;
}
