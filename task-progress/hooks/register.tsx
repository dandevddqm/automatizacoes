import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Limit, Task } from '../types'

const idle: Task = {
  isRunning: false,
  startedAt: 0,
  now: 0,
  total: 0,
  done: 0,
  active: 0,
  calls: 0,
  lastSeconds: 0,
  history: [],
  callsHistory: [],
}

const task = atom({ plugin: 'u', key: 'task' } as const, idle)
const limits = atom({ plugin: 'u', key: 'limits' } as const, [] as Limit[])
const isHidden = atom({ plugin: 'u', key: 'isHidden' } as const, false)

const label: Record<string, string> = { five_hour: '5', seven_day: 'S' }

const TASK_BAR = 12
const LIMIT_BAR = 6

const bar = (pct: number, width: number) => {
  const filled = Math.round((Math.max(0, Math.min(100, pct)) / 100) * width)

  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

const two = (n: number) => String(n).padStart(2, '0')

/** Sempre 7 caracteres: "  00:42" ou "1:02:09". */
const clock = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds))
  const h = Math.floor(s / 3600)
  const text =
    h > 0
      ? `${h}:${two(Math.floor((s % 3600) / 60))}:${two(s % 60)}`
      : `${two(Math.floor(s / 60))}:${two(s % 60)}`

  return text.padStart(7, ' ')
}

/** Sempre 5 caracteres: "3d05h", "2h10m", "  45m". */
const until = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const text = d > 0 ? `${d}d${two(h)}h` : h > 0 ? `${h}h${two(m)}m` : `${m}m`

  return text.padStart(5, ' ')
}

const percent = (pct: number) => `${String(Math.round(pct)).padStart(3, ' ')}%`

const average = (xs: number[]) => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length)

/** Percentual e duração total estimada da tarefa. */
const estimate = (t: Task) => {
  const elapsed = Math.max(0, (t.now - t.startedAt) / 1000)

  if (t.total > 0) {
    const fraction = (t.done + 0.5 * t.active) / t.total
    const pct = t.done >= t.total ? 100 : Math.min(99, fraction * 100)
    const total = fraction > 0.05 ? elapsed / fraction : average(t.history)

    return { elapsed, pct, total }
  }

  const typical = average(t.history)

  if (typical === 0) return { elapsed, pct: undefined, total: 0 }

  return { elapsed, pct: Math.min(95, (elapsed / typical) * 100), total: Math.max(typical, elapsed) }
}

/**
 * Etapas da tarefa. Com lista do Claude: feitas/total. Sem lista: ferramentas
 * já executadas sobre a média das últimas tarefas (só o número, se ainda não há histórico).
 */
const steps = (t: Task) => {
  if (t.total > 0) return `${t.done}/${t.total}`

  const typical = Math.round(average(t.callsHistory))

  if (t.isRunning && typical > 0) return `${t.calls}/${Math.max(typical, t.calls)}`
  if (t.calls > 0) return `${t.calls}`

  return undefined
}

// Quadrados coloridos: verde abaixo de 70%, amarelo até 89%, vermelho a partir de 90%.
const square = (pct: number) => (pct >= 90 ? '🟥' : pct >= 70 ? '🟨' : '🟩')

const colorBar = (pct: number, width: number) => {
  const filled = Math.round((Math.max(0, Math.min(100, pct)) / 100) * width)

  return square(pct).repeat(filled) + '⬛'.repeat(width - filled)
}

/** "5 🟩🟩⬛⬛⬛⬛  29% ↻1h27m    ·    S 🟩🟩🟩🟩⬛⬛  60% ↻1d06h" */
const limitsLine = (rl: Limit[], now: number) =>
  rl
    .filter(l => l.kind in label)
    .map(l => {
      const left = l.resetsAt === undefined ? '' : ` ↻${until((Date.parse(l.resetsAt) - now) / 1000).trim()}`

      return `${label[l.kind]} ${colorBar(l.percentUsed, LIMIT_BAR)} ${percent(l.percentUsed)}${left}`
    })
    .join('      ·      ')

// Os limites 5 e S ficam na linha de status do rodapé, ao lado do modelo.
async function showLimits($: EngineInterface, hidden?: boolean) {
  const isOff = hidden ?? (await read($, isHidden))
  const line = isOff ? '' : limitsLine(await read($, limits), await $.clock.now())

  $.ui.status(line === '' ? undefined : line)
}

export const register: Register = on => {
  let stop: { cancel: () => void } | undefined

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'progresso',
      description: 'Mostra ou esconde a barra de progresso da tarefa',
    })

    const numbers = (value: unknown) =>
      Array.isArray(value) ? value.filter((n): n is number => typeof n === 'number') : []
    const history = numbers(await $.store.get('history'))
    const callsHistory = numbers(await $.store.get('callsHistory'))
    await update($, task, t => ({ ...t, history, callsHistory }))

    const usage = await $.session.usage()
    await update($, limits, () => usage.rateLimits.map(l => ({ ...l })))
    await showLimits($)

    return next(e)
  })

  on('command.run', { command: 'progresso' }, async $ => {
    const hidden = await read($, isHidden)
    await update($, isHidden, () => !hidden)
    await showLimits($, !hidden)

    return { text: hidden ? 'Barra de progresso visível.' : 'Barra de progresso escondida.' }
  })

  on('session.measure', async ($, e, next) => {
    await update($, limits, () => e.rateLimits.map(l => ({ ...l })))
    await showLimits($)

    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    const now = await $.clock.now()
    await update($, task, t => ({
      ...idle,
      history: t.history,
      callsHistory: t.callsHistory,
      isRunning: true,
      startedAt: now,
      now,
    }))

    stop?.cancel()
    stop = $.clock.every(1000, async () => {
      const tick = await $.clock.now()
      await update($, task, t => (t.isRunning ? { ...t, now: tick } : t))
    })

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    if (e.tool !== 'TodoWrite') {
      await update($, task, t => (t.isRunning ? { ...t, calls: t.calls + 1 } : t))
    }

    return next(e)
  })

  on('tool.call', { tool: 'TodoWrite' }, async ($, e, next) => {
    const todos = e.todos
    await update($, task, t => ({
      ...t,
      total: todos.length,
      done: todos.filter(x => x.status === 'completed').length,
      active: todos.filter(x => x.status === 'in_progress').length,
    }))

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)

    stop?.cancel()
    stop = undefined

    const now = await $.clock.now()
    const current = await read($, task)
    const seconds = Math.round((now - current.startedAt) / 1000)
    // Só tarefas sem lista de etapas alimentam as estimativas por histórico.
    const isPlain = current.total === 0 && e.reason === 'answer' && seconds > 0
    const history = isPlain ? [...current.history, seconds].slice(-10) : current.history
    const callsHistory =
      isPlain && current.calls > 0
        ? [...current.callsHistory, current.calls].slice(-10)
        : current.callsHistory

    await $.store.set('history', history)
    await $.store.set('callsHistory', callsHistory)
    await update($, task, t => ({
      ...t,
      isRunning: false,
      now,
      done: t.total > 0 && e.reason === 'answer' ? t.total : t.done,
      active: 0,
      lastSeconds: seconds,
      history,
      callsHistory,
    }))

    const usage = await $.session.usage()
    await update($, limits, () => usage.rateLimits.map(l => ({ ...l })))
    await showLimits($)

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (await read($, isHidden))) return next(e)

    const t = await read($, task)
    const { Box, Text, Button } = $.ui.resolve(e)
    const stepsText = steps(t)
    let row

    if (t.isRunning) {
      const s = estimate(t)
      const left = s.total > 0 ? `−${clock(s.total - s.elapsed).trim()}` : ''

      row = (
        <Text key="task" wrap="truncate-end">
          {stepsText === undefined ? null : (
            <Text>
              <Text bold>E </Text>
              <Text color="claude">{stepsText}</Text>
              {'   '}
            </Text>
          )}
          <Text bold>T </Text>
          <Text color="claude">{bar(s.pct ?? 0, TASK_BAR)}</Text>
          {s.pct === undefined ? null : <Text color="claude"> {percent(s.pct)}</Text>}
          <Text dimColor>
            {'  '}{clock(s.elapsed)}  {left}
          </Text>
        </Text>
      )
    } else if (t.lastSeconds > 0) {
      row = (
        <Text key="task" dimColor wrap="truncate-end">
          U {clock(t.lastSeconds)}
          {stepsText === undefined ? '' : `   E ${stepsText}`}
        </Text>
      )
    } else {
      return next(e)
    }

    return (
      <Box flexDirection="row" flexWrap="nowrap" alignItems="center" justifyContent="space-between" gap={1} overflow="hidden">
        <Box flexShrink={1} overflow="hidden">
          {row}
        </Box>
        <Button
          key="hide"
          label="×"
          onPress={async () => {
            await update($, isHidden, () => true)
            await showLimits($, true)
          }}
        />
      </Box>
    )
  })
}
