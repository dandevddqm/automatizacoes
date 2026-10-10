import { expect, test } from 'claude-code/testing'

import { juntar } from './faixa'
import { barrinhas, clima, formatarTokens, textoDelta } from './clima'

test('faixas de clima', () => {
  expect(clima(0)).toEqual({ simbolo: '🌞', palavra: 'Limpo', cor: 'yellow' })
  expect(clima(24).palavra).toBe('Limpo')
  expect(clima(25)).toEqual({ simbolo: '⛅', palavra: 'Nublado', cor: 'cyan' })
  expect(clima(49).palavra).toBe('Nublado')
  expect(clima(50)).toEqual({ simbolo: '☔', palavra: 'Chuva', cor: 'blue' })
  expect(clima(74).palavra).toBe('Chuva')
  expect(clima(75)).toEqual({ simbolo: '⚡', palavra: 'Tempestade', cor: 'magenta' })
  expect(clima(89).palavra).toBe('Tempestade')
  expect(clima(90)).toEqual({ simbolo: '🔥', palavra: 'Compacta logo', cor: 'red' })
  expect(clima(100).palavra).toBe('Compacta logo')
})

test('tokens abreviados', () => {
  expect(formatarTokens(134_000)).toBe('134k')
  expect(formatarTokens(200_000)).toBe('200k')
  expect(formatarTokens(950)).toBe('950')
  expect(formatarTokens(1_000_000)).toBe('1M')
})

test('delta do último turno', () => {
  expect(textoDelta(98_000)).toBe('+98k no último turno')
  expect(textoDelta(-120_000)).toBe('-120k no último turno')
})

test('barrinhas', () => {
  expect(barrinhas([0, 50, 100])).toBe('▁▅█')
  expect(barrinhas([])).toBe('')
})

test('tarefas primeiro, previsão depois, botão de fechar no fim', () => {
  const texto = { type: 'Box', children: [{ type: 'Text', children: ['E 8/8'] }] }
  const botao = { type: 'Button', props: { key: 'hide', label: '×' } }
  const previsao = { type: 'Box', children: [{ type: 'Text', children: ['Limpo'] }] }
  const faixa = { type: 'Box', props: { flexDirection: 'row' }, children: [texto, botao] }

  const r = juntar(faixa, previsao)

  expect(r.props).toEqual({ flexDirection: 'row' })
  expect(r.children?.[1]).toBe(botao)
  expect((r.children?.[0] as { children: unknown[] }).children).toEqual([texto, previsao])
})

test('sem botão no fim, os dois ficam lado a lado, tarefas antes', () => {
  const faixa = { type: 'Text', children: ['E 1/4'] }
  const previsao = { type: 'Box' }

  expect(juntar(faixa, previsao).children).toEqual([faixa, previsao])
})
