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

## Verified in a live TUI (2026-10-30)

Ran with real background subagents as children of the same session.

- Sidebar item renders on one line: label plus muted elapsed. One row shows
  `sub general · OpenCode Go/DeepSeek V4.1 Flash` and `4m`; two rows show
  `sub 2 · …` with no elapsed.
- `/reload` keeps the slot, elapsed keeps counting.
- `/subagents`: title, one row per running child, gray description, footer
  session ID. Typing filters (`hold` keeps the match, `zzz` empties the list);
  the `search` callback works in this host build.
- `Enter` opens the child transcript. `alt+o` opens it and now also closes the
  dialog.
- `Toggle compact subagent status` shows the right toast, collapses to `sub 1`,
  keeps elapsed, and survives a TUI restart. Toggling back restores the full
  label.
- Live updates: deleting a running child removed its row without a restart, so
  the event subscriptions do their job.

Two bugs found and fixed during that run:

- `ctrl+o` was bound to the host's `open.menu`, so it opened the recent-sessions
  picker. The action is now `alt+o`.
- `tabs.focus(childID)` focuses the child's **root** tab, so opening a subagent
  landed back on the parent. Children now go through `router.navigate`;
  `tabs.focus` is used only for root sessions.
- The title `Subagent models (1)` was clipped to `models (1)` in the dialog
  header; it is now `Subagents (1)`.

## Pending

### 1. Options

`placement`, `bind`, and forced `compact` are untested. They need a config entry
and a restart, and a `package` entry can hide the local directory install.

### 2. Unverified runtime behaviour

- `tick` signal: live updates work, but it is still unknown whether
  `context.data.session.list()` and `context.data.session.status()` are reactive
  reads. If they are, the 13 event subscriptions and the counter are redundant.
  Do not delete without testing.
- `enabled: () => true` on the dialog command. Making it reflect row count
  risks freezing the command if the keymap layer factory does not re-run.
- JSX layout: the two `<text>` children did not wrap at the widths tested, but a
  deliberately narrow sidebar was not tried.

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
