export type Previsao = {
  /** Tokens usados na janela ao fim do último turno. */
  tokens: number
  /** Tamanho da janela de contexto do modelo. */
  janela: number
  /** Percentual usado, 0 a 100. */
  percentual: number
  /** Quanto o último turno somou (negativo após compactar ou limpar). */
  delta: number
  /** Percentual usado ao fim de cada um dos últimos 12 turnos. */
  historico: number[]
}

declare module 'claude-code' {
  interface PluginState {
    'previsao-do-contexto': { previsao: Previsao | null }
  }
}
