import { Plugin } from "@opencode/plugin/tui"
import type { Context } from "@opencode/plugin/tui/context"
import type { JSX } from "@opentui/solid"
import { Show, createMemo, createSignal } from "solid-js"
import {
  collect,
  elapsed,
  filterRows,
  matches,
  summary,
  truncate,
  type RunningSubagent,
  type Sources,
} from "./lib/collect"

const WATCHED_EVENTS = [
  "session.created",
  "session.deleted",
  "session.moved",
  "session.forked",
  "session.renamed",
  "session.status",
  "session.idle",
  "session.agent.selected",
  "session.model.selected",
  "session.execution.started",
  "session.execution.succeeded",
  "session.execution.failed",
  "session.execution.interrupted",
] as const

type Placement = "sidebar.content" | "sidebar.footer" | "prompt.footer"

type Options = {
  placement: Placement
  compact?: boolean
  bind?: string
}

type SlotInput = { sessionID?: string }

function readOptions(context: Context): Options {
  const raw = context.options ?? {}
  const placement: Placement =
    raw.placement === "sidebar.footer" || raw.placement === "prompt.footer"
      ? raw.placement
      : "sidebar.content"
  return {
    placement,
    compact: typeof raw.compact === "boolean" ? raw.compact : undefined,
    bind: typeof raw.bind === "string" ? raw.bind : undefined,
  }
}

/** Reads every data source once, against the location the TUI is showing. */
function sources(context: Context): Sources {
  const location = context.location ?? context.data.location.default()
  return {
    sessions: context.data.session,
    agents: context.data.location.agent.list(location) ?? [],
    models: context.data.location.model.list(location) ?? [],
    providers: context.data.location.provider.list(location) ?? [],
  }
}

function Status(props: {
  context: Context
  sessionID?: string
  tick: () => number
  compact: () => boolean
}) {
  const rows = createMemo(() => {
    props.tick()
    return collect(sources(props.context), props.sessionID)
  })

  const label = createMemo(() => {
    const list = rows()
    if (list.length === 0) return ""
    if (props.compact()) return `sub ${list.length}`
    return summary(list)
  })

  const age = createMemo(() => {
    const list = rows()
    return list.length === 1 ? elapsed(list[0].since) : ""
  })

  return (
    <Show when={rows().length > 0}>
      <box flexDirection="row" gap={1}>
        <text fg={props.context.theme.text.feedback.success.base}>{label()}</text>
        <Show when={age()}>
          <text fg={props.context.theme.text.muted}>{age()}</text>
        </Show>
      </box>
    </Show>
  )
}

function claim(context: Context, placement: Placement, render: (input: SlotInput) => JSX.Element) {
  switch (placement) {
    case "sidebar.footer":
      return context.ui.slot({ append: "sidebar.footer", render })
    case "prompt.footer":
      return context.ui.slot({ append: "prompt.footer", render })
    default:
      return context.ui.slot({ append: "sidebar.content", render })
  }
}

function openSession(context: Context, sessionID: string) {
  const session = context.data.session.get(sessionID)
  // Tabs only hold root sessions: focusing a child would focus its parent.
  if (!session?.parentID && context.ui.tabs.focus(sessionID)) return
  context.ui.router.navigate({ type: "session", sessionID })
}

function describe(row: RunningSubagent) {
  return [row.title, elapsed(row.since)].filter(Boolean).join(" · ")
}

async function showDetails(context: Context, sessionID: string | undefined, query?: string) {
  const rows = filterRows(collect(sources(context), sessionID), query)
  if (rows.length === 0) {
    await context.ui.dialog.alert({
      title: "Subagent models",
      message: query ? `No running subagent matches "${query}".` : "No subagent is running.",
    })
    return
  }

  const choice = await context.ui.dialog.select<string>({
    title: `Subagents (${rows.length})`,
    placeholder: "Filter by agent, model, or title",
    options: rows.map((row) => ({
      title: truncate(`${row.agent} · ${row.model}`, 96),
      value: row.sessionID,
      description: describe(row),
      footer: row.sessionID,
    })),
    actions: [
      {
        bind: "alt+o",
        title: "Open session",
        side: "right",
        onTrigger: (value) => {
          openSession(context, value)
          context.ui.dialog.clear()
        },
      },
    ],
    search: (value, options) =>
      options.filter((option) =>
        matches(value, option.title, option.description ?? "", option.footer ?? ""),
      ),
  })

  if (choice) openSession(context, choice)
}

export default Plugin.define({
  id: "opencode-subagent-model.tui",
  setup(context) {
    const options = readOptions(context)
    const [settings, updateSettings] = context.storage.store("opencode-subagent-model", {
      initial: { compact: false },
    })
    const compact = () => options.compact ?? settings.compact

    const [tick, setTick] = createSignal(0)
    const bump = () => setTick((value) => value + 1)
    const stops = WATCHED_EVENTS.map((type) => context.data.on(type, bump))

    const removeSlot = claim(context, options.placement, (input) => (
      <Status context={context} sessionID={input.sessionID} tick={tick} compact={compact} />
    ))

    context.keymap.layer(() => ({
      mode: "global",
      commands: [
        {
          id: "opencode-subagent-model.show",
          title: "Show running subagent models",
          group: "Subagents",
          bind: options.bind,
          palette: true,
          slash: { name: "subagents", aliases: ["subagent-models"], arguments: true },
          enabled: () => true,
          run: (input) => showDetails(context, currentSessionID(context), input),
        },
        {
          id: "opencode-subagent-model.toggleCompact",
          title: "Toggle compact subagent status",
          group: "Subagents",
          palette: true,
          enabled: options.compact === undefined,
          run: async () => {
            await updateSettings((draft) => {
              draft.compact = !draft.compact
            })
            context.ui.toast.show({
              message: settings.compact ? "Subagent status: compact" : "Subagent status: full",
            })
          },
        },
      ],
    }))

    return () => {
      for (const stop of stops) stop()
      removeSlot()
    }
  },
})

function currentSessionID(context: Context) {
  const current = context.ui.router.current()
  return current.type === "session" ? current.sessionID : undefined
}
