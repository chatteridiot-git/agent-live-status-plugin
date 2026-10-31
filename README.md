# opencode-subagent-model

OpenCode v2 plugin for showing which model each running subagent is using.

This package is loaded as the plugin package name `opencode-subagent-model` and registers a TUI plugin (`opencode-subagent-model.tui`). It does not change the server runtime; the actual UI logic lives in `src/tui.tsx` and the data/model resolution logic lives in `src/lib/collect.ts`.

## What it does

- Adds a live status item in the current session UI (`sidebar.content` by default) to summarize running child sessions.
  - single running subagent: `sub explore · Provider/Model (variant) · 42s`
  - multiple running subagents: `sub 3 · explore x2, general · Provider/Model x2, Provider/Model`
- Adds the slash command `/subagents` (alias `/subagent-models`) and the palette command `Show running subagent models`.
  - The picker lists each running subagent with its agent, model, title, and runtime.
  - Typing filters the list live.
  - Enter opens the subagent session; `alt+o` opens it without closing the picker.
  - A slash argument pre-filters the list, e.g. `/subagents explore`.
- Adds the palette command `Toggle compact subagent status`, which switches the status badge between the full summary and the compact `sub N` form.
  - The setting is stored in `context.storage.store("opencode-subagent-model")`.

The display label always uses `ProviderName/ModelName` and appends ` (variant)` when the resolved model includes a variant. If the provider or model name is missing, it falls back to the provider ID or model ID.

Subagents are child sessions (`parentID` set) in the same session family as the session currently being displayed. A session counts as running when the TUI reports it as `running`.

## Model resolution order

The plugin resolves the model in this order:

1. Session model (`SessionInfo.model`)
2. Subagent's configured agent model (`AgentInfo.model`)
3. Nearest parent session model (cycle-safe ancestor walk)
4. `unknown model`

This order is implemented in `collect.ts` and is used both for the summary and the details picker.

## Configuration

Pass options through the `plugins` entry in `opencode.jsonc`:

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

| Option | Type | Default | Meaning |
|---|---|---|---|
| `placement` | `"sidebar.content"` \| `"sidebar.footer"` \| `"prompt.footer"` | `"sidebar.content"` | Where the status item renders |
| `bind` | `string` | unset | Keybind for the dialog command |
| `compact` | `boolean` | unset | Forces the compact `sub N` form; leaving it unset keeps the toggle command available |

## Layout

```text
package.json              exports "." (server) and "./tui"
src/index.ts              no-op server entry for plugin discovery
src/tui.tsx               TUI plugin: slots, subscriptions, commands, dialogs
src/lib/collect.ts        data layer: collection, model resolution, formatting, summaries
src/lib/collect.test.ts   unit tests for the pure data layer
```

`src/lib/collect.ts` intentionally imports no TUI SDK and is plain Node-compatible code.

## Loading the plugin

The plugin is discovered from the global config directory:

```text
~/.config/opencode/plugins/opencode-subagent-model/
```

A project-local copy works the same way:

```text
<project>/.opencode/plugins/opencode-subagent-model/
```

The plugin directory itself may be symlinked into place:

```sh
ln -s /path/to/opencode-subagent-model ~/.config/opencode/plugins/opencode-subagent-model
```

Do not symlink files inside the plugin directory. Discovery ignores a directory whose `package.json` or `src` entry is itself a symlink; only the plugin directory may be linked.

After adding the directory, reload the TUI with `/reload` or restart OpenCode.

## Development

```sh
npm install
npm run typecheck
npm test
```
