# opencode-subagent-model

OpenCode v2 TUI plugin. Shows the model that each running subagent uses.

## What it does

- Adds a live status item to the session sidebar (`sidebar.content`), so it shows
  in the right area instead of under the prompt box:
  - one subagent: `sub explore · DeepSeek/DeepSeek Flash (high)`
  - several subagents: `sub 3 · DeepSeek/DeepSeek Flash (high) x3`

Model label is always `ProviderName/ModelName`, plus ` (variant)` when the model
uses a variant. Provider name falls back to the provider ID, model name to the
model ID.
- Adds `/subagents` (alias `/subagent-models`) and the palette command
  **Show running subagent models**. The dialog lists every running subagent
  with its agent, model, and session title.

Subagents are child sessions (`parentID` set) in the same session family as the
session you are viewing. A session counts as running when the TUI reports its
status as `running`.

Model resolution order:

1. Session model (`SessionInfo.model`)
2. Subagent's configured agent model (`AgentInfo.model`)
3. Nearest parent session model
4. `unknown model`

## Layout

```
package.json     exports "." (server) and "./tui"
src/index.ts     no-op server part so the package loads through opencode.json
src/tui.tsx      TUI part: slot, event subscriptions, command
```

## Load

Discovered from the global config directory:

```
~/.config/opencode/plugins/subagent-model/
```

A project-local copy works the same way:

```
<project>/.opencode/plugins/subagent-model/
```

After adding the directory, reload the TUI (`/reload`) or restart it.

## Develop

```sh
npm install
npx tsc --noEmit
```
