# opencode-subagent-model

OpenCode TUI plugin that surfaces the model currently used by running subagents in the active session family.

This package has a minimal server entry point and a TUI entry point:

- `src/index.ts`: plugin bootstrap; currently a no-op server definition used for discovery/loading.
- `src/tui.tsx`: runtime UI registration, slot rendering, command registration, and event subscriptions.
- `src/lib/collect.ts`: pure data layer that aggregates session metadata, resolves model names, and formats summaries.

The plugin id is `opencode-subagent-model` and the TUI plugin id is `opencode-subagent-model.tui`.

## Scope and behavior

The plugin scans the session graph for child sessions (`parentID` is set) that belong to the same session family as the currently displayed session. It then filters to sessions whose TUI status is reported as `running` and displays a summary in the UI.

The status summary is rendered as either:

- a full summary, e.g. `sub explore · DeepSeek/DeepSeek Flash (high) · 42s`
- a compact summary, e.g. `sub 3`

The compact summary is controlled by a persisted setting under `context.storage.store("opencode-subagent-model")`.

The plugin registers:

- a live status slot in the TUI (`sidebar.content` by default)
- a slash command: `/subagents` (alias `/subagent-models`)
- a palette command: `Show running subagent models`
- a palette command: `Toggle compact subagent status`

## Technical details

### Model resolution

The resolved model is computed in `src/lib/collect.ts` using this priority order:

1. `SessionInfo.model`
2. the subagent's configured agent model (`AgentInfo.model`)
3. the nearest parent session model, walking ancestors safely to avoid cycles
4. `unknown model`

This is intentional: the plugin prefers the most local, session-specific source of truth while preserving a fallback chain across the session family.

### Label formatting

Label construction is normalized to:

- `ProviderName/ModelName`
- append ` (variant)` when the resolved model carries a variant
- fall back to provider ID or model ID when the friendly names are unavailable

For example:

- `OpenAI/GPT-4o`
- `Anthropic/Claude Sonnet 4 (thinking)`
- `deepseek/deepseek-chat`

### Session filtering

Sessions are considered live if they are in the same family and the TUI reports them as `running`.

The implementation relies on the same session metadata already exposed by the OpenCode UI runtime and does not maintain a separate background process.

### Event-driven refresh

The status widget subscribes to these event types to trigger recalculation:

- `session.created`
- `session.deleted`
- `session.moved`
- `session.forked`
- `session.renamed`
- `session.status`
- `session.idle`
- `session.agent.selected`
- `session.model.selected`
- `session.execution.started`
- `session.execution.succeeded`
- `session.execution.failed`
- `session.execution.interrupted`

This keeps the displayed summary synchronized with the current TUI state without polling.

## UI commands

### `/subagents`

The slash command accepts an optional filter string and opens a searchable list of running subagents.

The picker includes:

- subagent title
- agent name
- resolved model
- elapsed time
- session ID as footer metadata

Search behavior is text-based over the option title, description, and footer data.

Key behavior:

- `Enter` opens the selected subagent session
- `alt+o` opens the session without closing the picker
- a slash argument prefilters the list, e.g. `/subagents explore`

### `Toggle compact subagent status`

This command toggles the persisted compact flag. When enabled, the status slot renders `sub N` rather than the verbose summary. When the option is not explicitly configured, the toggle remains available to the user.

## Configuration

The plugin reads options from the OpenCode plugin config entry:

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

### Supported options

| Option | Type | Default | Meaning |
|---|---|---|---|
| `placement` | `"sidebar.content"` \| `"sidebar.footer"` \| `"prompt.footer"` | `"sidebar.content"` | Slot where the status item is rendered |
| `bind` | `string` | unset | Keybind used for the subagent dialog command |
| `compact` | `boolean` | unset | Forces compact rendering when set; leaves the user toggle enabled when unset |

The runtime implementation normalizes `placement` to the supported set and defaults to `sidebar.content` if no valid value is supplied.

## Architecture

### Entry points

`package.json` declares:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./tui": "./src/tui.tsx"
  }
}
```

This is consistent with the OpenCode plugin loading model: the package is discovered through the plugin directory, and the TUI behavior is provided by the `./tui` export.

### Pure data layer

`src/lib/collect.ts` intentionally imports no TUI SDK. It is designed to be Node-compatible and is structured around pure functions such as:

- `collect(...)`
- `resolveModel(...)`
- `summary(...)`
- `filterRows(...)`
- `elapsed(...)`
- `matches(...)`

This separation makes it easier to test the data semantics independently from TUI rendering.

## Plugin discovery and loading

The plugin is discovered from the configured OpenCode plugin directories. Typical locations are:

```text
~/.config/opencode/plugins/opencode-subagent-model/
```

or a project-local equivalent:

```text
<project>/.opencode/plugins/opencode-subagent-model/
```

The plugin directory itself may be symlinked into place:

```sh
ln -s /path/to/opencode-subagent-model ~/.config/opencode/plugins/opencode-subagent-model
```

Do not symlink files inside the plugin directory. The loader ignores plugin directories whose `package.json` or `src` entry is itself a symlink; only the directory link is accepted.

After installation, reload the TUI with `/reload` or restart the OpenCode process.

## Development

```sh
npm install
npm run typecheck
npm test
```

The project targets Node >= 22.6.0 and uses TypeScript with the OpenCode plugin/TUI runtime dependencies.

## Tests

The repository includes a unit test file for the pure model-resolution/data layer:

```text
src/lib/collect.test.ts
```

This validates the logic used for summary generation and model resolution without requiring TUI runtime integration.
