# opencode-subagent-model

OpenCode v2 TUI plugin that shows which model each running subagent is using.

If you run multiple subagents in one session, this plugin makes it easy to see what each one is doing at a glance. It adds a live status summary to the TUI and includes a searchable picker for all running subagents.

## What it does

- Adds a live status item in the session UI (`sidebar.content` by default)
- Shows the model for each running subagent
- Adds the `/subagents` slash command
- Adds palette actions for browsing active subagents and toggling compact mode
- Lets you jump straight to a subagent session from the picker

Example status output:

```text
sub explore · OpenAI/GPT-4o · 42s
```

or for multiple subagents:

```text
sub 3 · explore x2, general · OpenAI/GPT-4o x2, Anthropic/Claude Sonnet 4
```

## Commands

### `/subagents`

Opens a searchable list of all running subagents in the current session family.

The picker includes:

- agent name
- model
- session title
- elapsed time
- session ID

Type to filter, press Enter to open the selected session, or use `alt+o` to open it without closing the picker.

You can pre-filter the list with a slash argument:

```text
/subagents explore
```

### Palette commands

- `Show running subagent models`
- `Toggle compact subagent status`

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
| `placement` | `"sidebar.content"` \| `"sidebar.footer"` \| `"prompt.footer"` | `"sidebar.content"` | Where the status item renders |
| `bind` | `string` | unset | Keybind for the subagent picker |
| `compact` | `boolean` | unset | Forces compact mode (`sub N`) |

## Installation

The plugin is discovered from the OpenCode plugin directories.

Global config path:

```text
~/.config/opencode/plugins/opencode-subagent-model/
```

Project-local path:

```text
<project>/.opencode/plugins/opencode-subagent-model/
```

You can also symlink it into place:

```sh
ln -s /path/to/opencode-subagent-model ~/.config/opencode/plugins/opencode-subagent-model
```

After installing it, reload the TUI with `/reload` or restart OpenCode.

## Model resolution

The plugin resolves the best model using this priority:

1. the session model
2. the subagent's configured agent model
3. the nearest parent session model
4. `unknown model`

The final label is formatted as `ProviderName/ModelName`, with ` (variant)` added when relevant.

## Development

```sh
npm install
npm run typecheck
npm test
```

## Repository layout

```text
package.json             package metadata and exports
src/index.ts             plugin bootstrap entry
src/tui.tsx              TUI commands, slots, and dialogs
src/lib/collect.ts       model resolution and summary logic
src/lib/collect.test.ts  unit tests for the data layer
```

## License

MIT
