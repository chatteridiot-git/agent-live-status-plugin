# opencode-subagent-model

OpenCode TUI plugin that shows which model each running subagent is using.

This plugin watches the active session family and surfaces a live summary of child sessions that are currently running. It is designed for OpenCode v2 and shows model information directly in the TUI without changing your normal session flow.

## What it adds

- a live status summary in the session UI (`sidebar.content` by default)
- a slash command: `/subagents` (alias `/subagent-models`)
- a palette command: `Show running subagent models`
- a palette command: `Toggle compact subagent status`

Examples of the status line:

- one subagent: `sub explore · OpenAI/GPT-4o · 42s`
- several subagents: `sub 3 · explore x2, general · OpenAI/GPT-4o x2, Anthropic/Claude Sonnet 4`

## How it works

The plugin looks at child sessions in the same session family as the session you are viewing. It only includes sessions that are reported by the TUI as `running`.

For each running subagent, it resolves the best available model using this order:

1. the session's model (`SessionInfo.model`)
2. the subagent's configured agent model (`AgentInfo.model`)
3. the nearest parent session model, walking ancestors safely to avoid cycles
4. `unknown model`

The display label is normalized to `ProviderName/ModelName`, with ` (variant)` appended when the model has a variant. If the provider or model name is missing, it falls back to the provider ID or model ID.

## Commands

### `/subagents`

Opens a searchable picker listing each running subagent with:

- agent name
- resolved model
- session title
- elapsed time
- session ID

You can type to filter the list. Press Enter to open the selected session, or use `alt+o` to open it without closing the picker.

A slash argument filters the list immediately, for example:

```text
/subagents explore
```

### `Show running subagent models`

This is the same picker as the slash command, exposed as a palette action.

### `Toggle compact subagent status`

Switches the status line between the full summary and a compact `sub N` indicator. The choice is stored in plugin storage and persists between sessions.

## Configuration

Add the plugin in `opencode.jsonc`:

```jsonc
{
  "plugins": [
    {
      "package": "opencode-subagent-model",
      "options": {
        "placement": "sidebar.content",
        "bind": "ctrl+shift+s",
        "compact": false
      }
    }
  ]
}
```

### Options

| Option | Type | Default | Meaning |
|---|---|---|---|
| `placement` | `"sidebar.content"` \| `"sidebar.footer"` \| `"prompt.footer"` | `"sidebar.content"` | Where the status summary is rendered |
| `bind` | `string` | unset | Keybind for the Subagent picker command |
| `compact` | `boolean` | unset | Forces compact mode; leaving this unset keeps the toggle action available |

## Installation

The plugin is discovered from the OpenCode plugin directories. The common location is:

```text
~/.config/opencode/plugins/opencode-subagent-model/
```

A project-local copy also works:

```text
<project>/.opencode/plugins/opencode-subagent-model/
```

You may symlink the plugin directory into place:

```sh
ln -s /path/to/opencode-subagent-model ~/.config/opencode/plugins/opencode-subagent-model
```

Important: do not symlink files inside the plugin directory. Discovery only accepts a symlinked plugin directory, not a symlinked `package.json` or `src` entry.

After installing it, reload the TUI with `/reload` or restart OpenCode.

## Development

```sh
npm install
npm run typecheck
npm test
```

The project uses TypeScript and targets Node >= 22.6.0.

## Repository layout

```text
package.json             package metadata and exports
src/index.ts             no-op server entry for plugin discovery
src/tui.tsx              TUI registration, commands, slots, dialogs
src/lib/collect.ts       data collection and model resolution logic
src/lib/collect.test.ts  unit tests for the pure data layer
```

## License

MIT
