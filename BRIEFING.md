# BRIEFING — Meu Bolso

Resultado da entrevista de definição do app. Formato CLARO. As regras do CLAUDE.md continuam valendo e têm prioridade.

---

## C — Contexto

- **Nome:** Meu Bolso.
- **Quem usa:** só o dono do projeto, no celular e no computador.
- **Onde lança a maior parte dos gastos:** no caixa do mercado, em pé e com o celular em uma mão. Por isso tudo precisa ser rápido, grande e fácil de tocar com o polegar.
- **Para que serve:** registrar gastos e ver quanto saiu no mês, por categoria.

---

## L — Limites

- **Toques para lançar um gasto:** no máximo **4**, contados a partir da tela aberta até o gasto salvo.
- **Senha a cada abertura:** o app pede e-mail e senha toda vez que é aberto e não mostra nenhum valor antes disso.
- **O app nunca:**
  - mostra valores antes de a senha ser digitada;
  - pede, guarda ou mostra senha de banco, número de conta ou cartão;
  - guarda a foto do cupom;
  - envia e-mail ou mensagem;
  - usa dado de outra pessoa;
  - mostra saldo, contas a pagar ou contas atrasadas, porque ele registra só o que já foi gasto.
- **Cores:** laranja forte e azul-escuro, com sensação de **leveza e rapidez**: bastante espaço em branco e poucos elementos. A paleta é apenas inspirada em app de banco, sem logo, nome ou qualquer coisa que imite a marca de um banco.
- **O que faria o dono abandonar o app:** letras pequenas, botões difíceis de tocar, e demora de mais de 2 segundos para abrir ou salvar.

---

## A — Ação

Uma tela só, feita primeiro para celular de 390 px, com estes blocos de cima para baixo:

1. **Os primeiros cinco segundos:** o **total gasto no mês**, em número grande, e logo abaixo os **últimos gastos lançados**.
2. **Lançamento à mão:** valor, categoria (botões grandes, um toque) e salvar. A data é a de hoje, sem precisar escolher. No máximo 4 toques.
3. **Lista do mês:** todos os gastos do mês atual, do mais recente para o mais antigo, com valor, categoria e data, e o total por categoria.
4. **Categorias** (com os nomes do dono, nesta ordem):
   - Combustível
   - Mercado
   - Assinaturas
   - Cursos
   - Aluguel
   - Casa
   - Outros
5. **Espaço do assistente:** um lugar já reservado na tela para o assistente que chega **na sexta**. Ele vai lançar o gasto a partir de uma frase ou da foto do cupom, e a foto não é guardada. Até lá, o espaço mostra apenas um aviso de "em breve".

---

## R — Resultado

Ao digitar a senha e abrir o app, em até cinco segundos o dono consegue responder, sem tocar em nada:

> **"Quanto eu já gastei este mês, e quais foram os meus últimos gastos?"**

---

## O — Observáveis (cinco testes que provam que o app está pronto)

1. **Senha antes de tudo:** ao abrir o app, nenhum valor aparece antes de e-mail e senha. Ao fechar e abrir de novo, a senha é pedida outra vez.
2. **Cinco segundos:** logo depois de entrar, o total do mês e os últimos gastos aparecem na tela do celular de 390 px, sem rolar e sem tocar em nada.
3. **4 toques:** é possível lançar um gasto de Mercado com no máximo 4 toques, usando uma mão só, e ele aparece na hora nos últimos gastos e no total do mês.
4. **Rapidez:** o app abre e salva um gasto em até 2 segundos. Botões têm pelo menos 44 px de altura e o texto principal é legível sem dar zoom.
5. **Categorias e erros:** as sete categorias aparecem com os nomes exatos acima, e o total por categoria bate com a soma dos gastos. Se a internet cair, aparece uma frase em português dizendo o que fazer.
