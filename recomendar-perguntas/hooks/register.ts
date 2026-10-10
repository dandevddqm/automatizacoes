import type { Register } from 'claude-code'

const REGRA = `# Recomendações com janela de perguntas

Sempre que você for fazer uma recomendação ao usuário (escolher entre abordagens, arquitetura, ferramenta, biblioteca, próximo passo, plano, mudança de design, correção entre alternativas), NÃO entregue só a recomendação em texto. Antes de seguir, abra uma janela de perguntas com a ferramenta AskUserQuestion:

- Faça no mínimo 3 perguntas; o ideal é de 3 a 5. Se houver mais pontos a decidir, pode fazer mais. A ferramenta aceita até 4 perguntas por chamada: com 5 ou mais, faça uma segunda chamada logo em seguida, sem texto longo entre elas.
- Cada pergunta traz de 2 a 4 opções claras e distintas, com uma descrição curta do que cada uma implica (vantagens e custos).
- Ponha primeiro a opção que você recomenda e termine o rótulo dela com "(Recomendado)".
- Cubra dimensões diferentes e relevantes ao caso: escopo, abordagem, prioridade, restrições, riscos, formato de entrega, o que fica de fora. Cada pergunta deve mudar o que você fará depois; não invente perguntas só para completar a cota.
- Use "multiSelect" quando as opções não forem excludentes.
- Escreva as perguntas no idioma do usuário (português do Brasil se ele escreve em português).
- Depois das respostas, siga com a recomendação final já ajustada a elas.

Não use a janela em respostas puramente factuais, em tarefas triviais sem decisão real, nem quando o usuário já escolheu o caminho ou pediu para não perguntar.`

export const register: Register = on => {
  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)

    if (!e.tools.includes('AskUserQuestion')) return composed

    return {
      sections: [
        ...composed.sections,
        { id: 'recomendar-perguntas:regra', text: REGRA, scope: 'session' },
      ],
    }
  })
}
