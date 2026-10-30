# Handoff

State at pause: code complete and committed, not yet verified in a live TUI.

## Verified

```sh
npx tsc --noEmit   # clean
npm test           # 13 pass, 0 fail
```

## Done

- `src/lib/collect.ts` — pure data layer with narrow interfaces: `collect`,
  `resolveModel`, `labeler`, `summary`, `elapsed`, `truncate`, `cleanTitle`,
  `filterRows`.
- `src/lib/collect.test.ts` — 13 `node:test` cases, no new dependencies.
- `src/tui.tsx` — slot, event subscriptions, filterable `dialog.select` with an
  "Open session" action, compact toggle persisted via `storage.store`,
  `placement` / `bind` / `compact` options, muted elapsed time.
- Fixed `resolveModel` reading `context.location` instead of the resolved
  location; ancestor walk is cycle-safe via a `Set` guard.
- `LICENSE`, README options table, `typecheck` / `test` scripts, version 0.2.0.

## Pending

### 1. Rename to one name: `opencode-subagent-model`

Package name stays. Everything else moves to it.

| # | Where | From | To |
|---|---|---|---|
| 1 | Repo dir | `/mnt/d/Ai/opencode/agent-live-status-plugin` | `/mnt/d/Ai/opencode/opencode-subagent-model` |
| 2 | Installed dir | `~/.config/opencode/plugins/subagent-model` | `~/.config/opencode/plugins/opencode-subagent-model` |
| 3 | Installed `src` link | `-> /mnt/d/Ai/opencode/plugin-custom/src` (broken) | `-> <new repo>/src` |
| 4 | Installed junk | `src.bak-1793262514/` | delete |
| 5 | `src/index.ts` id | `subagent-model` | `opencode-subagent-model` |
| 6 | `src/tui.tsx` id | `subagent-model.tui` | `opencode-subagent-model.tui` |
| 7 | Command ids | `subagent-model.show`, `subagent-model.toggleCompact` | `opencode-subagent-model.show`, `opencode-subagent-model.toggleCompact` |
| 8 | Storage key | `"settings"` | `"opencode-subagent-model"` |
| 9 | README Load section | `plugins/subagent-model/` | `plugins/opencode-subagent-model/` |

Keep: `package.json` name, slash `/subagents` + alias `/subagent-models`, dialog
titles, `group: "Subagents"`.

After #1, move this session's working directory to the new path.

### 2. The installed plugin does not load

```
~/.config/opencode/plugins/subagent-model/
  package.json        version 0.1.0
  src -> /mnt/d/Ai/opencode/plugin-custom/src     BROKEN: target gone
  src.bak-1793262514/
```

`/mnt/d/Ai/opencode/plugin-custom` no longer exists. The live TUI runs no
version of this plugin. Fix with #2 and #3, then `/reload`.

### 3. Unverified runtime behaviour

- `tick` signal: whether `context.data.session.list()` and
  `context.data.session.status()` are reactive reads. If they are, the 13 event
  subscriptions and the counter are redundant and can be deleted. Do not delete
  without testing: live updates depend on it today.
- `enabled: () => true` on the dialog command. Making it reflect row count
  risks freezing the command if the keymap layer factory does not re-run. Test
  before changing.
- `context.storage.store` key namespacing is not documented. That is why #8
  namespaces the key manually.
- JSX layout: status item uses `<box flexDirection="row" gap={1}>` with two
  `<text>` children because `SpanProps` has no `fg`. Confirm it renders on one
  line in a narrow sidebar.

## Resume

```sh
cd /mnt/d/Ai/opencode/agent-live-status-plugin
npm test && npx tsc --noEmit
```

Then apply rename items 1–9, fix the installed symlink, `/reload`, and verify:
sidebar item, `/subagents`, `ctrl+o`, compact toggle, elapsed time.
