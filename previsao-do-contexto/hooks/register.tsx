import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Previsao } from '../types'
import { juntar } from './faixa'
import { barrinhas, clima, formatarTokens, textoDelta } from './clima'

const previsao = atom({ plugin: 'previsao-do-contexto', key: 'previsao' } as const, null)

const TURNOS = 12

export const register: Register = on => {
  on('turn.complete', async ($, e, next) => {
    // Só a conversa principal; subagentes têm a própria janela.
    if (e.agentId === undefined) {
      const { context } = await $.session.usage()
      const tokens = context.tokens ?? 0
      const percentual = Math.round(context.percent ?? (context.window > 0 ? (tokens / context.window) * 100 : 0))

      await update($, previsao, (anterior: Previsao | null): Previsao => ({
        tokens,
        janela: context.window,
        percentual,
        delta: tokens - (anterior?.tokens ?? 0),
        historico: [...(anterior?.historico ?? []), percentual].slice(-TURNOS),
      }))
    }

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    // A faixa acima do prompt é uma só e este hook é o mais externo: o que outro
    // mod desenha abaixo (a barra de tarefas do task-progress, por exemplo) vem
    // em `next` e é mantido, na mesma linha, antes da previsão.
    const abaixo = await next(e)
    const atual = await read($, previsao)

    if (e.props.hasSurvey || atual === null) {
      return abaixo
    }

    const { Box, Text } = $.ui.resolve(e)
    const { simbolo, palavra, cor } = clima(atual.percentual)

    const linha = (
      <Box>
        <Text color={cor} bold>
          {simbolo} {palavra}
        </Text>
        <Text dimColor>
          {'  '}
          {atual.percentual}% · {formatarTokens(atual.tokens)} / {formatarTokens(atual.janela)}
          {'  '}
        </Text>
        <Text color={cor}>{barrinhas(atual.historico)}</Text>
        <Text dimColor>
          {'  '}
          {textoDelta(atual.delta)}
        </Text>
      </Box>
    )

    // As tarefas do outro mod ficam sempre em primeiro lugar, na mesma linha da previsão.
    return abaixo ? (juntar(abaixo, linha) as typeof linha) : linha
  })
}
