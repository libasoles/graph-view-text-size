# Graph View Text Size

This is an `alpha` plugin for [Obsidian](https://obsidian.md).

## What it solves

Text size in graph view is too small to read. This is a simple plugin to increase the text size based on the node size.

You can adjust the maximum text size in the plugin settings.

![demo.png](./demo.png)

> This is a very hacky solution, since there's no official API to modify the graph view. It may break in future updates.

## Manually installing the plugin

This is a beta version, so it's not published. Clone the repo to your vault:

From the command line:

`cd [VaultFolder]/.obsidian/plugins/`

`git clone git@github.com:libasoles/graph-view-text-size.git`

## Why I did this anyway?

I use lenses to read and I have a hard time reading the graph view. And I saw a couple of feature requests in the forum:
[obsidian forum feature request (1)](https://forum.obsidian.md/t/request-adjust-graph-font-size-css-solution/6461)
[obsidian forum feature request (2)](https://forum.obsidian.md/t/obsidian-graph-view-as-community-plugin/18042/3)

Then I saw a couple plugins that managed to modify the graph view, so I decided to give it a try. So, this is insspired on [obsidian-graph-nested-tags](https://github.com/drPilman/obsidian-graph-nested-tags) and [folders-graph](https://github.com/Ratibus11/folders2graph)
