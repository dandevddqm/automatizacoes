import { expect, mock, test } from 'claude-code/testing'

const PLUGIN = 'u'
const BAND = {
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: true, maxRows: 5 },
} as const

test('mostra % e etapas a partir do TodoWrite', async ($, on) => {
  const clock = mock.clock(on)
  on('prompt.submit', (_$, e) => ({ text: e.text }))
  on('tool.call', () => ({ result: { text: 'ok' } }))

  void $.prompt.submit({ text: 'faça algo' })
  await clock.advance(10_000)
  await $.tool.call({
    tool: 'TodoWrite',
    todos: [
      { content: 'a', status: 'completed', activeForm: 'a' },
      { content: 'b', status: 'in_progress', activeForm: 'b' },
      { content: 'c', status: 'pending', activeForm: 'c' },
      { content: 'd', status: 'pending', activeForm: 'd' },
    ],
  })
  await clock.advance(1000)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: PLUGIN, surface, ...BAND })
    const row = await ui.find({ type: 'Text', text: /^E / })
    expect(row?.text).toMatch(/38%/)
    expect(row?.text).toContain("E 1/4")
    expect(row?.text).toContain("T ")
    // largura constante entre dois instantes: 1 linha, sem quebra
    const first = row?.text.length
    await clock.advance(5000)
    const again = await ui.find({ type: 'Text', text: /^E / })
    expect(again?.text.length).toBe(first)
    await ui.unmount()
  }
})

test('sem tarefa ainda, não desenha nada acima do prompt', async ($, on) => {
  mock.clock(on)
  on('ui.render', ($, e) => {
    const { Box } = $.ui.resolve(e)

    return <Box key="engine" />
  })
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...BAND })
  expect(await ui.find({ type: 'Text', text: /--%|^T / })).toBeUndefined()
  await ui.unmount()
})

test('publica os limites 5 e S na linha de status do rodapé', async ($, on) => {
  mock.clock(on)
  const lines: unknown[] = []
  on('ui.status', (_$, e) => (lines.push(e), { value: undefined }))
  on('session.usage', () => ({
    value: {
      startedAt: 0,
      context: { window: 1000 },
      rateLimits: [
        { kind: 'five_hour', percentUsed: 18, resetsAt: '2026-10-10T15:00:00Z' },
        { kind: 'seven_day', percentUsed: 59 },
      ],
    },
  }))
  on('command.register', () => ({ value: true }))
  mock.store(on)
  on('session.start', () => ({ cwd: '/tmp' }))
  await $.session.start({ source: 'startup', cwd: '/tmp' })

  const text = JSON.stringify(lines)
  expect(text).toMatch(/18%/)
  expect(text).toContain('🟩')
  expect(text).not.toContain('u001b')
  expect(text).toMatch(/59%/)
})

test('sem lista de etapas, E mostra as ferramentas executadas', async ($, on) => {
  const clock = mock.clock(on)
  on('prompt.submit', (_$, e) => ({ text: e.text }))
  on('tool.call', () => ({ result: { text: 'ok' } }))

  await $.prompt.submit({ text: 'faça algo' })
  await $.tool.call({ tool: 'Read', file_path: '/tmp/a' })
  await $.tool.call({ tool: 'Read', file_path: '/tmp/b' })
  await clock.advance(2000)

  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', ...BAND })
  const row = await ui.find({ type: 'Text', text: /^E / })
  expect(row?.text).toContain('E 2 ')
  expect(row?.text).toContain('T ')
  await ui.unmount()
})
