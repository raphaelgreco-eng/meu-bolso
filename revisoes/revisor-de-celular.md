# Revisão de celular (390 px) do Meu Bolso

Li `index.html`, `estilo.css` e `app.js` e imaginei o app aberto num celular de 390 px de largura. Não abri o app num aparelho de verdade, então os itens marcados "a confirmar" dependem de um teste no celular. Não li `manifest.webmanifest` nem `configuracao.js`.

Arquivos analisados, todos em `C:\Users\rapha\Desktop\Cluade Code\Treinamento\meu-bolso\app\`:
- `index.html`
- `estilo.css`
- `app.js`

## Tabela de achados

| Item | O que está errado | Onde | Gravidade | Correção em uma frase |
|---|---|---|---|---|
| 7. Contraste (botão principal) | Texto branco sobre laranja `#F26A1B` dá cerca de 3,1 para 1, abaixo do mínimo de 4,5. Isso vale para "Entrar", "Salvar gasto" e para a categoria escolhida. | `estilo.css`: `.primario`, `.categoria[aria-pressed="true"]`, variável `--laranja` | ALTA | Escurecer o laranja desses botões (por exemplo um laranja-tijolo perto de `#B84A08`) ou trocar o texto por azul-escuro `#0B2A5B`. |
| 5. Erros somem sozinhos | As frases de erro de carregar, apagar e outras ações aparecem num aviso que some em 3 segundos. Frases longas em português, como "Sua entrada expirou. Toque em Sair e entre de novo.", não dão tempo de ler. | `app.js`: função `aviso()` (`setTimeout` de 3000) | ALTA | Deixar o aviso de erro na tela até a pessoa tocar nele, ou por pelo menos 8 segundos, mantendo 3 segundos só para "Gasto salvo". |
| 5. Erro da assistente vem pronta do servidor | A frase `corpo.erro` que o servidor devolve é mostrada sem conferir. Se vier em inglês ou técnica, vai direto para a tela. Também há um texto técnico: "Abra o app pelo site da Netlify". | `app.js`: `falarComAssistente`, linhas 453 a 458 | MÉDIA | Mostrar `corpo.erro` só se for um texto em português curto; senão usar a frase padrão "O assistente não conseguiu responder agora. Tente de novo em instantes." |
| 5. Erros com linguagem de programador | Algumas frases falam de "Supabase", "tabela", "proteção por linha", "coluna origem". Quem usa não sabe o que fazer com isso. | `app.js`: função `frase()`, linhas 35 a 37, 43 a 51, 109 e 148 | MÉDIA | Trocar por frases do tipo "Não deu para salvar. Saia, entre de novo e tente outra vez" e deixar o detalhe técnico só no `console.error`. |
| 5. Falha ao carregar parece "sem gastos" | Se `carregarMes` der erro, a tela continua com R$ 0,00 e a frase "Nenhum gasto lançado este mês." As frases de lista vazia também aparecem antes de os dados chegarem. A pessoa acha que perdeu os gastos. | `index.html`: `#ultimos-vazio`, `#barras-vazio`, `#lista-vazia`; `app.js`: `carregarMes` | MÉDIA | Começar com "Carregando seus gastos…" e, se falhar, escrever "Não consegui carregar seus gastos. Toque em Sair e entre de novo" no lugar da frase de vazio. |
| 3. Campo de data apertado (a confirmar) | A 390 px, "Onde ou com o quê" e "Data" ficam lado a lado, com cerca de 181 px e 129 px de largura. O campo de data, com letra de 17 px e ícone, pode ficar cortado ou empurrar o cartão para o lado. | `estilo.css`: `.linha-campos` (`min-width: 380px`), `input` | MÉDIA | Usar uma coluna só até uns 480 px, ou `grid-template-columns: minmax(0,1fr) minmax(0,1fr)` com `min-width: 0` nos campos. |
| 5. Entrar não funciona se a internet falhar ao abrir | Se o Supabase não carregar, `iniciar()` mostra o erro e para antes de ligar os botões. Tocar em "Entrar" recarrega a página e a mensagem some. | `app.js`: `iniciar()`, linhas 104 a 111 | MÉDIA | Ligar o `submit` do formulário antes dessas checagens para ele sempre mostrar "Não foi possível carregar o app. Confira a internet e abra a página de novo." |
| 7. Contraste (botão desativado) | Com `opacity: 0.6`, o botão laranja desativado fica com texto branco sobre laranja claro, cerca de 2 para 1. | `estilo.css`: `.btn:disabled` | MÉDIA | Para desativado usar cores próprias (fundo cinza `#D5D9E2` com texto `#4A5266`) e o texto "Entrando…" ou "Salvando…". |
| 8. Foco visível nos campos | `input:focus` tira o contorno e põe uma sombra de 3 px em `#FFF1E7`, quase invisível sobre o branco. Só a borda laranja fina mostra o foco. | `estilo.css`: `input:focus` | BAIXA | Usar `input:focus-visible { outline: 3px solid #0B2A5B; outline-offset: 2px; }`. |
| 8. Foco visível nos botões | Nenhum botão tem estilo próprio de foco, mas também ninguém removeu o padrão do navegador. Funciona, só não combina com as cores. | `estilo.css`: `.btn`, `.categoria`, `.btn-texto`, `.btn-apagar` | BAIXA | Acrescentar uma regra `:focus-visible` com contorno azul para todos os botões. |
| 7. Bordas dos campos muito fracas | A borda `#E3E7EF` sobre branco mal aparece, e o campo some no cartão. O trilho das barras também é claro demais. | `estilo.css`: `input`, `.categoria`, `.trilho` | BAIXA | Escurecer a borda dos campos e das categorias para um cinza-azulado tipo `#8791A8`. |
| 3. Topo em tela cheia (a confirmar) | O `viewport-fit=cover` deixa o app ocupar a tela toda, mas o topo só tem 16 px de folga. Instalado na tela inicial, o título "Meu Bolso" e o botão "Sair" podem ficar sob o relógio ou o entalhe. | `index.html` meta viewport; `estilo.css`: `.tela` | BAIXA | Somar `env(safe-area-inset-top)` ao padding de cima de `.tela`. |
| 6. Senha ao criar conta | O campo de senha sempre diz `current-password`, mesmo no "Criar conta". O celular não oferece sugerir uma senha nova. | `index.html`: `#senha` | BAIXA | Trocar `autocomplete` para `new-password` ao tocar em "Criar conta". |
| 1. Alvo de toque | Botões e campos têm 44 a 60 px de altura: `.btn` 52, `input` 48, `.categoria` 48, `.btn-texto` 44, `.btn-apagar` 44x44. | `estilo.css` | nada a corrigir | Manter. |
| 2. Tamanho do texto | O menor texto é de 14 px (`.detalhe`, `.btn-apagar`). Os campos têm 17 px ou mais, então o celular não dá zoom sozinho. O `viewport` não trava o zoom. | `estilo.css` | nada a corrigir | Manter. |
| 3. Rolagem para o lado | Em geral está bem: `box-sizing: border-box`, imagem do ícone com tamanho fixo pequeno, nomes longos cortados com reticências, `min-width: 0` na lista, sem tabelas e sem larguras fixas. O único risco é o campo de data (linha acima). | `estilo.css`, `index.html` | nada a corrigir | Manter. |
| 4. Lista vazia | As três listas têm frase escrita: "Nenhum gasto lançado este mês.", "As barras aparecem quando houver gastos no mês." e "Nenhum gasto neste mês ainda." O problema é só o momento em que aparecem (ver acima). | `index.html`, `app.js` | nada a corrigir | Manter. |
| 6. Teclado numérico | O campo Valor tem `inputmode="decimal"` e aceita vírgula. | `index.html`: `#valor` | nada a corrigir | Manter. |
| 7. Contraste (textos gerais) | O texto cinza `#5B6680` sobre branco, o azul sobre o laranja-claro e o `#C9D4EA` sobre o azul-escuro passam. O título laranja sobre o azul-escuro fica no limite (cerca de 4,6). | `estilo.css` | nada a corrigir | Manter. |

## Os três que mais atrapalham

1. **Texto branco sobre laranja difícil de ler.** O botão que a pessoa mais usa ("Salvar gasto"), o "Entrar" e a categoria escolhida têm contraste fraco, pior ainda ao ar livre e quando o botão fica desativado.
2. **Avisos de erro que somem em 3 segundos.** Quando algo dá errado, a frase que diz o que fazer desaparece antes de ser lida, e a pessoa fica sem saber se o gasto foi salvo ou apagado.
3. **Falha ao carregar parece "nenhum gasto".** Sem internet ou com a entrada vencida, o app mostra R$ 0,00 e "Nenhum gasto lançado este mês", e a pessoa pode achar que perdeu os dados. Logo atrás vêm as mensagens técnicas (Supabase, tabela, coluna) e o campo de data apertado.

Conclusão: o app está bem montado para toque, tamanho de texto e teclado numérico, mas precisa corrigir o contraste do laranja, o tempo dos avisos de erro e a tela de falha ao carregar.
