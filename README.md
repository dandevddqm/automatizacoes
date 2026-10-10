# automatizacoes

Mods do Claude Code, em português, que desenham uma faixa acima do prompt.

| Mod | O que faz |
| --- | --- |
| `previsao-do-contexto` | Previsão do tempo da janela de contexto: ícone e palavra por faixa de uso (🌞 Limpo, ⛅ Nublado, ☔ Chuva, ⚡ Tempestade, 🔥 Compacta logo), porcentagem e tokens, mini gráfico dos últimos 12 turnos e quanto o último turno somou. |
| `u` (pasta `task-progress`) | Barra da tarefa: etapas `E x/y`, progresso `T`, tempo decorrido e estimado, e uso das janelas de 5 horas e semanal na linha de status. |

Com os dois instalados, a barra da tarefa e a previsão aparecem na mesma linha, as tarefas primeiro.
O `previsao-do-contexto` funciona sozinho; sem o `u`, mostra só a previsão.

## Instalação

No prompt de uma sessão do Claude Code **no terminal** (aceite com `y` adicionar o marketplace e escolha o escopo `user`):

```
/plugin install previsao-do-contexto --marketplace dandevddqm/automatizacoes
/plugin install u --marketplace dandevddqm/automatizacoes
```

Depois de instalado no terminal, no escopo de usuário, o mod também carrega no Claude Code desktop dessa máquina.
O comando `/plugin install` não funciona dentro do desktop.

Os mods ficam em arquivos locais de cada computador: instale em cada máquina onde quiser usá-los.

## Atualizar

Ao mudar um mod, suba a versão no `plugin.json` dele; sem isso o Claude Code continua usando a cópia em cache.

```
claude plugin marketplace update automatizacoes
claude plugin update previsao-do-contexto@automatizacoes --scope user
```

## Testes

```
claude plugin validate previsao-do-contexto
claude plugin test previsao-do-contexto
```
