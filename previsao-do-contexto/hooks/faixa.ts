type No = { type?: string; props?: Record<string, string | number | boolean>; children?: unknown[] }

const isNo = (x: unknown): x is No => typeof x === 'object' && x !== null

/**
 * Junta, numa só linha, o que outro mod desenhou na faixa (`abaixo`) com a previsão (`linha`):
 * a barra do outro mod vem primeiro, a previsão depois, e o botão de fechar dele, se houver,
 * continua no fim. Se o desenho do outro mod não for um Box com botão no final, os dois ficam
 * lado a lado do mesmo jeito.
 */
export const juntar = (abaixo: unknown, linha: unknown): No => {
  const grupo = (filhos: unknown[]): No => ({
    type: 'Box',
    props: { flexDirection: 'row', flexShrink: 1, overflow: 'hidden', gap: 2 },
    children: filhos,
  })

  if (isNo(abaixo) && abaixo.type === 'Box' && Array.isArray(abaixo.children) && abaixo.children.length > 0) {
    const ultimo = abaixo.children[abaixo.children.length - 1]

    if (isNo(ultimo) && ultimo.type === 'Button') {
      return {
        type: 'Box',
        props: abaixo.props,
        children: [grupo([...abaixo.children.slice(0, -1), linha]), ultimo],
      }
    }
  }

  return { type: 'Box', props: { flexDirection: 'row', gap: 2, overflow: 'hidden' }, children: [abaixo, linha] }
}
