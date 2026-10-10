import { expect, test } from 'claude-code/testing'

const BAND = {
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 5 },
} as const

test('põe a previsão na mesma linha da barra de outro mod', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box>
        <Text>LINHA-DE-TAREFA</Text>
      </Box>
    )
  })
  on('session.usage', () => ({
    value: { startedAt: 0, context: { tokens: 91_000, window: 1_000_000, percent: 9 }, rateLimits: [] },
  }))
  on('turn.complete', () => ({ text: '' }))
  await $.turn.complete({ answer: '', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'previsao-do-contexto', surface, ...BAND })
    expect(await ui.find({ type: 'Text', text: /Limpo/ })).toBeTruthy()
    expect(await ui.find({ type: 'Text', text: /LINHA-DE-TAREFA/ })).toBeTruthy()
    await ui.unmount()
  }
})

test('mantém a barra de outro mod com Button, como a do task-progress', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    return (
      <Box flexDirection="row" flexWrap="nowrap" alignItems="center" justifyContent="space-between" gap={1} overflow="hidden">
        <Box flexShrink={1} overflow="hidden">
          <Text key="task" wrap="truncate-end">
            <Text bold>T </Text>
            <Text color="claude">BARRA-DA-TAREFA</Text>
          </Text>
        </Box>
        <Button key="hide" label="×" onPress={() => {}} />
      </Box>
    )
  })
  on('session.usage', () => ({
    value: { startedAt: 0, context: { tokens: 91_000, window: 1_000_000, percent: 9 }, rateLimits: [] },
  }))
  on('turn.complete', () => ({ text: '' }))
  await $.turn.complete({ answer: '', durationMs: 1, isAborted: false, turnId: 't4', reason: 'answer' })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'previsao-do-contexto', surface, ...BAND })
    expect(await ui.find({ type: 'Text', text: /Limpo/ })).toBeTruthy()
    expect(await ui.find({ type: 'Text', text: /BARRA-DA-TAREFA/ })).toBeTruthy()
    await ui.unmount()
  }
})
