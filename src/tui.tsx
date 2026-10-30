import { Plugin } from "@opencode/plugin/tui"
import type { Context } from "@opencode/plugin/tui/context"
import type { ModelInfo, ModelRef, ProviderInfo, SessionInfo } from "@opencode/client"
import { Show, createMemo, createSignal } from "solid-js"

type RunningSubagent = {
  sessionID: string
  agent: string
  model: string
  title: string
}

const WATCHED_EVENTS = [
  "session.created",
  "session.deleted",
  "session.renamed",
  "session.status",
  "session.execution.started",
  "session.execution.succeeded",
  "session.execution.failed",
  "session.execution.interrupted",
  "session.agent.selected",
  "session.model.selected",
] as const

function modelLabel(model: ModelRef, models: ModelInfo[], providers: ProviderInfo[]) {
  const found = models.find(
    (entry) =>
      entry.providerID === model.providerID && (entry.modelID === model.id || entry.id === model.id),
  )
  const providerName =
    providers.find((entry) => entry.id === model.providerID)?.name ?? model.providerID
  const name = found?.name ?? model.id
  return `${providerName}/${name}${model.variant ? ` (${model.variant})` : ""}`
}

/** Session model, else the subagent's configured model, else the nearest parent's model. */
function resolveModel(
  context: Context,
  session: SessionInfo,
  models: ModelInfo[],
  providers: ProviderInfo[],
) {
  if (session.model) return modelLabel(session.model, models, providers)

  if (session.agent) {
    const agent = context.data.location.agent
      .list(context.location)
      ?.find((entry) => entry.id === session.agent)
    if (agent?.model) return modelLabel(agent.model, models, providers)
  }

  let parentID = session.parentID
  for (let depth = 0; parentID && depth < 16; depth++) {
    const parent = context.data.session.get(parentID)
    if (!parent) break
    if (parent.model) return modelLabel(parent.model, models, providers)
    parentID = parent.parentID
  }

  return "unknown model"
}

function collect(context: Context, sessionID: string | undefined): RunningSubagent[] {
  const location = context.location ?? context.data.location.default()
  const models = context.data.location.model.list(location) ?? []
  const providers = context.data.location.provider.list(location) ?? []
  const root = sessionID ? context.data.session.root(sessionID) : undefined

  return context.data.session
    .list()
    .filter((session) => session.parentID)
    .filter((session) => (root ? context.data.session.root(session.id) === root : true))
    .filter((session) => context.data.session.status(session.id) === "running")
    .map((session) => ({
      sessionID: session.id,
      agent: session.agent ?? "subagent",
      model: resolveModel(context, session, models, providers),
      title: session.title ?? session.id,
    }))
}

function summary(rows: RunningSubagent[]) {
  if (rows.length === 0) return ""
  if (rows.length === 1) return `sub ${rows[0].agent} · ${rows[0].model}`

  const counts = new Map<string, number>()
  for (const row of rows) counts.set(row.model, (counts.get(row.model) ?? 0) + 1)
  const models = [...counts.entries()]
    .map(([model, count]) => (count > 1 ? `${model} x${count}` : model))
    .join(", ")
  return `sub ${rows.length} · ${models}`
}

function Status(props: { context: Context; sessionID?: string; tick: () => number }) {
  const rows = createMemo(() => {
    props.tick()
    return collect(props.context, props.sessionID)
  })

  return (
    <Show when={rows().length > 0}>
      <text fg={props.context.theme.text.base}>{summary(rows())}</text>
    </Show>
  )
}

async function showDetails(context: Context, sessionID: string | undefined) {
  const rows = collect(context, sessionID)
  if (rows.length === 0) {
    await context.ui.dialog.alert({
      title: "Subagent models",
      message: "No subagent is running.",
    })
    return
  }

  await context.ui.dialog.alert({
    title: `Subagent models (${rows.length})`,
    message: rows.map((row) => `${row.agent} · ${row.model}\n  ${row.title}`).join("\n"),
  })
}

export default Plugin.define({
  id: "subagent-model.tui",
  setup(context) {
    const [tick, setTick] = createSignal(0)
    const bump = () => setTick((value) => value + 1)
    const stops = WATCHED_EVENTS.map((type) => context.data.on(type, bump))

    const removeSlot = context.ui.slot({
      append: "sidebar.content",
      render: (input) => (
        <Status context={context} sessionID={input.sessionID} tick={tick} />
      ),
    })

    context.keymap.layer(() => ({
      mode: "global",
      commands: [
        {
          id: "subagent-model.show",
          title: "Show running subagent models",
          group: "Subagents",
          palette: true,
          slash: { name: "subagents", aliases: ["subagent-models"] },
          enabled: () => true,
          run: () => showDetails(context, currentSessionID(context)),
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
