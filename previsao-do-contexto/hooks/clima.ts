const BARRAS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']

export type Clima = { simbolo: string; palavra: string; cor: string }

export const clima = (percentual: number): Clima => {
  if (percentual >= 90) return { simbolo: '🔥', palavra: 'Compacta logo', cor: 'red' }
  if (percentual >= 75) return { simbolo: '⚡', palavra: 'Tempestade', cor: 'magenta' }
  if (percentual >= 50) return { simbolo: '☔', palavra: 'Chuva', cor: 'blue' }
  if (percentual >= 25) return { simbolo: '⛅', palavra: 'Nublado', cor: 'cyan' }
  return { simbolo: '🌞', palavra: 'Limpo', cor: 'yellow' }
}

export const formatarTokens = (n: number): string => {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(abs % 1_000_000 === 0 ? 0 : 1)}M`
  if (abs >= 1_000) return `${Math.round(abs / 1_000)}k`
  return String(abs)
}

export const barrinhas = (historico: readonly number[]): string =>
  historico
    .map(p => BARRAS[Math.min(BARRAS.length - 1, Math.max(0, Math.floor((p / 100) * BARRAS.length)))])
    .join('')

export const textoDelta = (delta: number): string =>
  `${delta < 0 ? '-' : '+'}${formatarTokens(delta)} no último turno`
