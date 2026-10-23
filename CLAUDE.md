# CLAUDE.md — Memória do projeto Meu Bolso

Este arquivo é a memória deste projeto. Leia-o inteiro toda vez que abrir esta pasta e siga o que está aqui.

---

## 1. O que é este projeto

O **Meu Bolso** é um app de gastos pessoais, feito durante a Formação Claude Pro.

- **Quem usa:** só o dono do projeto, no celular e no computador.
- **O que ele faz:**
  - registra gastos;
  - mostra o total do mês, separado por categoria.
- **O que vem na sexta:** um assistente que lança o gasto a partir de uma frase escrita ou da foto do cupom fiscal.
- **Telas e categorias:** ainda não estão definidas. Elas vão sair de uma entrevista que o Claude vai conduzir com o dono do projeto.

---

## 2. Regras técnicas que não se discutem

- **Onde ficam os arquivos do app:** na pasta `app/`, com estes arquivos:
  - `index.html`
  - `estilo.css`
  - `app.js`
  - `configuracao.js`
  - `manifest.webmanifest`
  - `icone.svg`
- **Sem ferramentas extras:** sem Node, sem etapa de build, sem framework.
- **Banco de dados (Supabase):** o cliente entra direto pela internet (CDN), com esta linha:
  `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>`
- **Entrada no app:** por e-mail e senha, sem confirmação de e-mail.
- **Proteção dos dados:** as tabelas `gastos` e `resumos` têm proteção por linha (cada pessoa só enxerga o que é dela).
- **Configuração:** a URL do projeto e a chave pública do Supabase ficam em `app/configuracao.js`, dentro de `window.MEU_BOLSO`.
- **Chaves secretas:** a chave secreta do Supabase e a chave do Gemini **nunca** entram em arquivo nenhum.
- **Arquivos na raiz da pasta:**
  - `netlify.toml` publica a pasta `app`;
  - `.gitignore` deixa de fora `.env`, `.netlify` e `node_modules`.
- **Celular primeiro:** a tela pensada primeiro é a de um celular com 390 px de largura.
- **Mensagens de erro:** todo erro vira uma frase em português dizendo o que a pessoa deve fazer.

---

## 3. O que este app nunca faz

- Nunca pede, guarda ou mostra senha de banco, número de conta ou número de cartão.
- Nunca guarda a foto do cupom.
- Nunca envia e-mail ou mensagem.
- Nunca usa dado de outra pessoa.

---

## 4. Como trabalhar comigo

- **Antes de mexer em arquivos:** diga o plano em até dez linhas e espere a minha aprovação.
- **Uma mudança por vez:** mostre a diferença do que mudou.
- **Entregas:** toda entrega vai para um arquivo. Na conversa, mostre só os caminhos dos arquivos.
- **Linguagem:** fale em português, de um jeito que quem não programa entenda.
