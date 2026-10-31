# opencode-subagent-model

OpenCode v2 TUI plugin that shows which model each running subagent is using.

This plugin helps you quickly see what each active subagent is running on without opening each session manually. It adds a live status summary in the TUI and gives you a searchable picker for all currently running subagents.

## Features

- Live subagent status in the session UI (`sidebar.content` by default)
- Model-aware summaries for running child sessions
- Slash command: `/subagents` and `/subagent-models`
- Palette command: `Show running subagent models`
- Compact mode toggle for a minimal `sub N` status line
- Search + filter for agent, model, title, and elapsed time

## Example status output

Single running subagent:

```text
sub explore · OpenAI/GPT-4o · 42s
```

Multiple running subagents:

```text
sub 3 · explore x2, general · OpenAI/GPT-4o x2, Anthropic/Claude Sonnet 4
```

## How it works

The plugin looks at child sessions in the same session family as the session you are viewing and only includes sessions whose TUI status is `running`.

It resolves the best model for each subagent using this priority:

1. session model
2. subagent agent model
3. nearest parent session model
4. `unknown model`

The label is displayed as `ProviderName/ModelName`, and if the model has a variant, it appends ` (variant)`.

## Commands

### `/subagents`

Opens a searchable list of running subagents.

The picker includes:

- agent name
- resolved model
- session title
- elapsed time
- session ID

You can type to filter the list. Press Enter to open a session, or use `alt+o` to open it without closing the picker.

Example:

```text
/subagents explore
```

### Palette commands

- `Show running subagent models`
- `Toggle compact subagent status`

## Configuration

Add the plugin to the `plugins` array in `opencode.jsonc`:

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
| `placement` | `"sidebar.content"` \| `"sidebar.footer"` \| `"prompt.footer"` | `"sidebar.content"` | Where the status line renders |
| `bind` | `string` | unset | Keybind for the subagent picker |
| `compact` | `boolean` | unset | Forces the compact `sub N` mode |

## Installation

The plugin is discovered from the OpenCode plugin directories.

Common location:

```text
~/.config/opencode/plugins/opencode-subagent-model/
```

Project-local location:

```text
<project>/.opencode/plugins/opencode-subagent-model/
```

You can symlink it into place:

```sh
ln -s /path/to/opencode-subagent-model ~/.config/opencode/plugins/opencode-subagent-model
```

After installing it, reload the TUI with `/reload` or restart OpenCode.

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
src/tui.tsx              TUI commands, slots, and UI logic
src/lib/collect.ts       pure data collection and model-resolution layer
src/lib/collect.test.ts  unit tests for summary/model behavior
```

## License

MIT
