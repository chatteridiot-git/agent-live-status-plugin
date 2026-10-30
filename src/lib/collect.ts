/**
 * Pure data layer for the subagent status plugin.
 *
 * Nothing here imports the TUI SDK: every function takes plain data, so it can
 * be unit tested without a running OpenCode instance.
 */

export type ModelRef = {
  id: string
  providerID: string
  variant?: string
}

export type ModelInfo = {
  id: string
  modelID: string
  providerID: string
  name: string
}

export type ProviderInfo = {
  id: string
  name: string
}

export type AgentInfo = {
  id: string
  model?: ModelRef
}

export type SessionInfo = {
  id: string
  parentID?: string
  agent?: string
  model?: ModelRef
  title?: string
  time?: { created?: number }
}

export type SessionSource = {
  list(): SessionInfo[]
  get(sessionID: string): SessionInfo | undefined
  root(sessionID: string): string
  status(sessionID: string): "idle" | "running"
}

export type Sources = {
  sessions: SessionSource
  agents?: AgentInfo[]
  models?: ModelInfo[]
  providers?: ProviderInfo[]
}

export type RunningSubagent = {
  sessionID: string
  agent: string
  model: string
  title: string
  since?: number
}

export const UNKNOWN_MODEL = "unknown model"
export const UNKNOWN_AGENT = "subagent"

/** Builds `ProviderName/ModelName (variant)`, falling back to raw IDs. */
export function labeler(models: ModelInfo[] = [], providers: ProviderInfo[] = []) {
  const byModel = new Map<string, string>()
  for (const entry of models) {
    byModel.set(`${entry.providerID}:${entry.modelID}`, entry.name)
    byModel.set(`${entry.providerID}:${entry.id}`, entry.name)
  }
  const byProvider = new Map(providers.map((entry) => [entry.id, entry.name]))

  return (model: ModelRef) => {
    const name = byModel.get(`${model.providerID}:${model.id}`) ?? model.id
    const provider = byProvider.get(model.providerID) ?? model.providerID
    return `${provider}/${name}${model.variant ? ` (${model.variant})` : ""}`
  }
}

/**
 * Session model, else the subagent's configured model, else the nearest
 * ancestor session model, else `unknown model`.
 */
export function resolveModel(
  session: SessionInfo,
  sources: Sources,
  label = labeler(sources.models, sources.providers),
): string {
  if (session.model) return label(session.model)

  if (session.agent) {
    const agent = sources.agents?.find((entry) => entry.id === session.agent)
    if (agent?.model) return label(agent.model)
  }

  const seen = new Set([session.id])
  let parentID = session.parentID
  while (parentID && !seen.has(parentID)) {
    seen.add(parentID)
    const parent = sources.sessions.get(parentID)
    if (!parent) break
    if (parent.model) return label(parent.model)
    parentID = parent.parentID
  }

  return UNKNOWN_MODEL
}

/** Collapses newlines and repeated spaces so titles stay on one line. */
export function cleanTitle(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

/** Running child sessions in the same family as `sessionID`. */
export function collect(sources: Sources, sessionID?: string): RunningSubagent[] {
  const label = labeler(sources.models, sources.providers)
  const scope = sessionID ? sources.sessions.root(sessionID) : undefined

  const roots = new Map<string, string>()
  const rootOf = (id: string) => {
    const cached = roots.get(id)
    if (cached !== undefined) return cached
    const value = sources.sessions.root(id)
    roots.set(id, value)
    return value
  }

  const rows: RunningSubagent[] = []
  for (const session of sources.sessions.list()) {
    if (!session.parentID) continue
    if (scope && rootOf(session.id) !== scope) continue
    if (sources.sessions.status(session.id) !== "running") continue
    rows.push({
      sessionID: session.id,
      agent: session.agent ?? UNKNOWN_AGENT,
      model: resolveModel(session, sources, label),
      title: cleanTitle(session.title ?? session.id),
      since: session.time?.created,
    })
  }

  return rows
}

type Tally = { value: string; count: number }

function tally(values: string[]): Tally[] {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts].map(([value, count]) => ({ value, count }))
}

function withCount(entry: Tally): string {
  return entry.count > 1 ? `${entry.value} x${entry.count}` : entry.value
}

/**
 * One row: `sub explore · Provider/Model (high)`.
 * Several: `sub 3 · explore · Provider/Model (high) x3`.
 */
export function summary(rows: RunningSubagent[]): string {
  if (rows.length === 0) return ""
  if (rows.length === 1) return `sub ${rows[0].agent} · ${rows[0].model}`

  const agents = tally(rows.map((row) => row.agent))
  const models = tally(rows.map((row) => row.model))
  const agentPart = agents.length === 1 ? agents[0].value : agents.map(withCount).join(", ")
  return `sub ${rows.length} · ${agentPart} · ${models.map(withCount).join(", ")}`
}

/** `42s`, `3m`, `1h 2m`. Empty when the start time is unknown. */
export function elapsed(since: number | undefined, now = Date.now()): string {
  if (!since) return ""
  const seconds = Math.max(0, Math.round((now - since) / 1000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

export function truncate(value: string, width: number): string {
  if (width <= 0) return ""
  if (value.length <= width) return value
  if (width === 1) return "…"
  return `${value.slice(0, width - 1)}…`
}

/** Case-insensitive substring match across `fields`. An empty query always matches. */
export function matches(query: string | undefined, ...fields: string[]): boolean {
  const needle = query?.trim().toLowerCase()
  if (!needle) return true
  return fields.join(" ").toLowerCase().includes(needle)
}

/** Case-insensitive match on agent, model, title, and session ID. */
export function filterRows(rows: RunningSubagent[], query: string | undefined): RunningSubagent[] {
  return rows.filter((row) => matches(query, row.agent, row.model, row.title, row.sessionID))
}
