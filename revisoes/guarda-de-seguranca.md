# Relatório de segurança: Meu Bolso

Pasta revisada: `C:\Users\rapha\Desktop\Cluade Code\Treinamento\meu-bolso`. A pasta `.git` ficou de fora, como pedido.

## Resumo

Não encontrei chave secreta, senha escrita nos arquivos, token fixo nem dado pessoal. O `.gitignore` está correto. Os únicos achados são duas ocorrências da chave pública do Supabase, que são permitidas nos lugares onde estão. Procurei por `sb_secret`, `service_role`, `AIza`, `eyJ`, `Bearer`, e-mails, CPF e telefones. Também olhei a pasta `supabase`, os arquivos `.md` e `.txt`, o `.claude/launch.json` e a função do assistente.

## Tabela

| Arquivo | O que encontrou | Gravidade | O que fazer |
|---|---|---|---|
| `app/configuracao.js` | Chave pública do Supabase (`sb_p…`). É o lugar permitido para ela. | BAIXA | Nada. Essa chave é feita para ficar à vista. |
| `netlify/functions/assistente.mjs` | Chave pública do Supabase (`sb_p…`) na linha 7, no topo da função. É o lugar permitido. A URL do projeto Supabase também aparece, e isso é normal. | BAIXA | Nada. |
| `netlify/functions/assistente.mjs` | A chave do Gemini é lida de `process.env.CHAVE_GEMINI`, ou seja, fica nas variáveis da Netlify e não no arquivo. O token que chega de fora é lido do cabeçalho, o que é correto. | BAIXA | Nada. Só confirme que a chave do Gemini está cadastrada na Netlify. |
| `app/app.js` | Usa `session.access_token`, o campo `senha` do formulário e mensagens de erro. Nenhum valor fixo escrito. | BAIXA | Nada. |
| `supabase/*.sql` e `01-comando-das-tabelas.txt` | Só comandos de tabela. Não há chave, e-mail nem dado pessoal. | BAIXA | Nada. |
| `.gitignore` | Tem as linhas `.env`, `.netlify` e `node_modules`. | BAIXA | Nada. |
| Demais arquivos (`CLAUDE.md`, `BRIEFING.md`, `02-CLAUDE-exemplo.md`, `.claude/`, `netlify.toml`, `index.html`, `estilo.css`, manifesto, ícone) | A palavra "senha" aparece só em texto explicativo ou no campo do formulário. Nenhum valor secreto. | BAIXA | Nada. |

Nenhum item é de gravidade ALTA ou MÉDIA.

PODE ENVIAR
