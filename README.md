# opencode-subagent-model

OpenCode v2 TUI plugin. Shows the model that each running subagent uses.

## What it does

- Adds a live status item to the session sidebar (`sidebar.content`), so it shows
  in the right area instead of under the prompt box:
  - one subagent: `sub explore · DeepSeek/DeepSeek Flash (high) · 42s`
  - several subagents: `sub 3 · explore x2, general · DeepSeek/DeepSeek Flash (high) x2, OpenAI/GPT`
- Adds `/subagents` (alias `/subagent-models`) and the palette command
  **Show running subagent models**. The picker lists every running subagent with
  its agent, model, session title, and elapsed time. Type to filter. Enter opens
  the subagent session; `ctrl+o` opens it without closing the picker.
  A slash argument pre-filters: `/subagents explore`.
- Adds the palette command **Toggle compact subagent status**, which switches the
  status item to `sub 3`. The choice is persisted with `storage.store`.

Model label is always `ProviderName/ModelName`, plus ` (variant)` when the model
uses a variant. Provider name falls back to the provider ID, model name to the
model ID.

Subagents are child sessions (`parentID` set) in the same session family as the
session you are viewing. A session counts as running when the TUI reports its
status as `running`.

Model resolution order:

1. Session model (`SessionInfo.model`)
2. Subagent's configured agent model (`AgentInfo.model`)
3. Nearest parent session model (cycle-safe ancestor walk)
4. `unknown model`

## Options

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
| `compact` | `boolean` | unset | Forces `sub N`; unset keeps the toggle command available |

## Layout

```
package.json              exports "." (server) and "./tui"
src/index.ts              no-op server part so the package loads through opencode.json
src/tui.tsx               TUI part: slot, event subscriptions, commands, dialogs
src/lib/collect.ts        pure data layer: collect, resolveModel, summary, formatting
src/lib/collect.test.ts   unit tests for the pure layer
```

`src/lib/collect.ts` imports no TUI SDK, so it runs under plain Node.

## Load

Discovered from the global config directory:

```
~/.config/opencode/plugins/opencode-subagent-model/
```

A project-local copy works the same way:

```
<project>/.opencode/plugins/opencode-subagent-model/
```

After adding the directory, reload the TUI (`/reload`) or restart it.

## Develop

```sh
npm install
npm run typecheck
npm test
```
