import { expect, test } from 'claude-code/testing'

const BASE = { model: 'm', promptModel: 'm', surfaces: [], outputStyle: null, traits: [] } as const
const ASK = 'recomendar-perguntas:regra'

test('acrescenta a regra quando AskUserQuestion está disponível', async ($, on) => {
  on('prompt.compose', () => ({ sections: [{ id: 'intro', text: 'oi', scope: 'shared' }] }))

  const r = await $.prompt.compose({ ...BASE, tools: ['AskUserQuestion', 'Read'] })
  const ids = r.sections.map(s => s.id)

  expect(ids).toEqual(['intro', ASK])
  expect(r.sections[1]?.text).toMatch(/no mínimo 3 perguntas/)
})

test('não mexe no prompt sem AskUserQuestion', async ($, on) => {
  on('prompt.compose', () => ({ sections: [{ id: 'intro', text: 'oi', scope: 'shared' }] }))

  const r = await $.prompt.compose({ ...BASE, tools: ['Read'] })

  expect(r.sections.map(s => s.id)).toEqual(['intro'])
})
