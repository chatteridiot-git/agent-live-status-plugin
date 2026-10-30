# Handoff

State at pause: renamed, installed, typechecked, tested. Not yet verified in a
live TUI.

## Verified

```sh
npx tsc --noEmit   # clean
npm test           # 13 pass, 0 fail
```

## Done

### Code

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

### Naming: everything is `opencode-subagent-model`

| Where | Value |
|---|---|
| Repo dir | `/mnt/d/Ai/opencode/opencode-subagent-model` |
| `package.json` name | `opencode-subagent-model` |
| Server plugin id | `opencode-subagent-model` |
| TUI plugin id | `opencode-subagent-model.tui` |
| Command ids | `opencode-subagent-model.show`, `opencode-subagent-model.toggleCompact` |
| Storage key | `opencode-subagent-model` |
| Installed dir | `~/.config/opencode/plugins/opencode-subagent-model/` |

User-facing names deliberately unchanged: slash `/subagents`, alias
`/subagent-models`, dialog titles, command group `Subagents`.

### Installed plugin

```
~/.config/opencode/plugins/opencode-subagent-model/
  package.json -> /mnt/d/Ai/opencode/opencode-subagent-model/package.json
  src          -> /mnt/d/Ai/opencode/opencode-subagent-model/src
```

The old `src` symlink pointed at `/mnt/d/Ai/opencode/plugin-custom/src`, which
no longer existed, so no version of this plugin was loading. The stale
`src.bak-1793262514` copy moved to
`/tmp/opencode/subagent-model-src.bak-1793262514`.

## Pending

### 1. Verify in a live TUI

`/reload`, then check:

- sidebar item appears, one line, colored label plus muted elapsed time
- `/subagents` lists running subagents and filters while typing
- `ctrl+o` opens the selected subagent session
- `Toggle compact subagent status` persists across a TUI restart
- `placement` / `bind` options take effect

### 2. Unverified runtime behaviour

- `tick` signal: whether `context.data.session.list()` and
  `context.data.session.status()` are reactive reads. If they are, the 13 event
  subscriptions and the counter are redundant and can be deleted. Do not delete
  without testing: live updates depend on it today.
- `enabled: () => true` on the dialog command. Making it reflect row count
  risks freezing the command if the keymap layer factory does not re-run.
- JSX layout: status item uses `<box flexDirection="row" gap={1}>` with two
  `<text>` children because `SpanProps` has no `fg`. Confirm it renders on one
  line in a narrow sidebar.

### 3. Optional

- CI running `npm run typecheck` and `npm test`.
- Rename the `caveman` plugin for the same consistency (dir `caveman`, package
  `caveman-opencode-plugin`).

## Resume

```sh
cd /mnt/d/Ai/opencode/opencode-subagent-model
npm run typecheck && npm test
```

Note: renaming a directory on this WSL `/mnt/d` mount while handles are open
leaves the entry unreadable from Linux. Rename from the Linux side with
`mv -T` to avoid it.
