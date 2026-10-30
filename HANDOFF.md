# Handoff

State at pause: renamed, installed, typechecked, tested. Not yet verified in a
live TUI.

## Verified

```sh
npx tsc --noEmit   # clean
npm test           # 14 pass, 0 fail
```

## Done

### Code

- `src/lib/collect.ts` — pure data layer with narrow interfaces: `collect`,
  `resolveModel`, `labeler`, `summary`, `elapsed`, `truncate`, `cleanTitle`,
  `filterRows`.
- `src/lib/collect.test.ts` — 14 `node:test` cases, no new dependencies.
- `src/tui.tsx` — slot, event subscriptions, filterable `dialog.select` with an
  "Open session" action, compact toggle persisted via `storage.store`,
  `placement` / `bind` / `compact` options, muted elapsed time.
- `dialog.select` now passes an explicit `search` callback (`matches` in
  `collect.ts`). Filtering is no longer assumed to be a host default: typing
  matches option title, description, and session ID.
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
~/.config/opencode/plugins/opencode-subagent-model -> /mnt/d/Ai/opencode/opencode-subagent-model
```

The plugin directory is a symlink to this repo. Verified through the API:

```json
{"id": "opencode-subagent-model", "features": {"server": true, "tui": true}, "state": {"status": "active"}}
```

Discovery does **not** follow file symlinks inside a plugin directory. A dir
containing a symlinked `package.json` or `src` is skipped silently, with no log
line and no error state. A symlinked directory itself is followed. Tested all
three shapes through `GET /api/plugin`:

| Installed shape | Discovered |
|---|---|
| real `package.json` + real `src/` | yes |
| `package.json` and `src` as symlinks | no |
| whole dir as a symlink | yes |

That silent skip is what made the first two attempts fail: the plugin never
reached the server, so no TUI part existed and `/reload` showed an error. The
old `src -> /mnt/d/Ai/opencode/plugin-custom/src` link had the same defect.

### Diagnosing plugin load

```sh
opencode api get "/api/plugin?location%5Bdirectory%5D=/abs/path/to/project"
```

Prints every plugin with `source`, `features`, and `state`. Absent from this
list means not discovered at all.

## Pending

### 1. Verify in a live TUI

`/reload`, then check:

- sidebar item appears, one line, colored label plus muted elapsed time
- `/subagents` lists running subagents and filters while typing (filter is now
  explicit; confirm the host still shows the query field)
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
