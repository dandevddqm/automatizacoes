export type Limit = { kind: string; percentUsed: number; resetsAt?: string }

export type Task = {
  isRunning: boolean
  startedAt: number
  now: number
  total: number
  done: number
  active: number
  /** Ferramentas executadas na tarefa (sem a lista de etapas). */
  calls: number
  lastSeconds: number
  /** Duração (s) das últimas tarefas sem lista de todos, base da estimativa. */
  history: number[]
  /** Ferramentas executadas nas últimas tarefas sem lista de etapas. */
  callsHistory: number[]
}

declare module 'claude-code' {
  interface PluginState {
    'u': { task: Task; limits: Limit[]; isHidden: boolean }
  }
}
