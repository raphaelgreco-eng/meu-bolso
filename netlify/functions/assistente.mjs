// Meu Bolso — assistente que lança e consulta gastos.
// A chave do Gemini fica só no servidor (CHAVE_GEMINI, nas variáveis da Netlify).
// O Supabase é usado com o login da própria pessoa, para a proteção por linha valer.
// Aqui só entram a URL do projeto e a chave PÚBLICA do Supabase (as mesmas de app/configuracao.js).

const SUPABASE_URL = "https://jpkucpxnejptyvdwufya.supabase.co";
const SUPABASE_CHAVE_PUBLICA = "sb_publishable_AY6V4o_np83LexoJFBEJxA_KL22nb_K";

const MODELO = "gemini-3.5-flash-lite";
const FUSO = "America/Sao_Paulo";

export const config = { path: "/api/assistente" };

// ---------- Respostas ----------

function responder(corpo, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

class ErroDoApp extends Error {
  constructor(frase, status) {
    super(frase);
    this.status = status;
  }
}

const ERROS = {
  semChave: () => new ErroDoApp("O assistente está sem a chave do Gemini. Cadastre CHAVE_GEMINI nas variáveis da Netlify e publique de novo.", 500),
  loginVencido: () => new ErroDoApp("Sua entrada expirou. Toque em Sair e entre de novo.", 401),
  limite: () => new ErroDoApp("O assistente atingiu o limite de uso do Gemini. Espere um minuto e tente de novo, ou lance à mão.", 429),
  tabela: () => new ErroDoApp("A tabela gastos não existe no Supabase. Crie a tabela e tente de novo.", 500),
  geral: () => new ErroDoApp("O assistente não conseguiu responder agora. Tente de novo em instantes ou lance à mão.", 502)
};

// ---------- Datas e valores ----------

function hojeEmSaoPaulo() {
  // en-CA formata como AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(new Date());
}

function diaDaSemanaEmSaoPaulo() {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, weekday: "long" }).format(new Date());
}

function dataValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(texto))) return false;
  const d = new Date(texto + "T12:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === texto;
}

function dataBR(iso) {
  const [ano, mes, dia] = iso.split("-");
  return dia + "/" + mes + "/" + ano;
}

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function lerValor(v) {
  let t = String(v ?? "").replace(/[R$\s]/g, "");
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

// ---------- Supabase, com o token da pessoa ----------

function cabecalhosSupabase(token, extra = {}) {
  return {
    apikey: SUPABASE_CHAVE_PUBLICA,
    Authorization: "Bearer " + token,
    ...extra
  };
}

async function erroDoSupabase(resposta) {
  let corpo = {};
  try { corpo = await resposta.json(); } catch { /* corpo vazio */ }
  console.error("Supabase recusou:", resposta.status, corpo);
  const codigo = String(corpo.code || "");
  const texto = String(corpo.message || "").toLowerCase();
  if (resposta.status === 401 || codigo === "PGRST301" || texto.includes("jwt")) return ERROS.loginVencido();
  if (codigo === "42P01" || codigo === "PGRST205" || (resposta.status === 404 && texto.includes("gastos"))) return ERROS.tabela();
  if (codigo === "23514") return new ErroDoApp("O banco recusou um dos dados do gasto. Confira o valor e a categoria e tente de novo.", 400);
  if (codigo === "42501" || texto.includes("row-level security")) {
    return new ErroDoApp("O banco recusou a operação. Saia e entre de novo; se continuar, confira a proteção por linha da tabela gastos no Supabase.", 403);
  }
  return ERROS.geral();
}

async function conferirLogin(token) {
  const r = await fetch(SUPABASE_URL + "/auth/v1/user", { headers: cabecalhosSupabase(token) });
  if (!r.ok) throw ERROS.loginVencido();
  const usuario = await r.json();
  if (!usuario || !usuario.id) throw ERROS.loginVencido();
  return usuario;
}

async function gravarGasto(token, gasto) {
  const r = await fetch(SUPABASE_URL + "/rest/v1/gastos", {
    method: "POST",
    headers: cabecalhosSupabase(token, { "Content-Type": "application/json", Prefer: "return=minimal" }),
    body: JSON.stringify(gasto)
  });
  if (!r.ok) throw await erroDoSupabase(r);
}

// Soma no próprio servidor os valores que o banco devolveu; o total nunca vem do modelo.
async function somarGastos(token, desde, ate, categoria) {
  const LOTE = 1000;
  let centavos = 0;
  let quantidade = 0;
  for (let inicio = 0; ; inicio += LOTE) {
    const filtro = new URLSearchParams({ select: "valor", order: "data.asc,id.asc" });
    filtro.append("data", "gte." + desde);
    filtro.append("data", "lte." + ate);
    if (categoria) filtro.append("categoria", "eq." + categoria);
    filtro.append("limit", String(LOTE));
    filtro.append("offset", String(inicio));

    const r = await fetch(SUPABASE_URL + "/rest/v1/gastos?" + filtro, { headers: cabecalhosSupabase(token) });
    if (!r.ok) throw await erroDoSupabase(r);
    const linhas = await r.json();
    for (const linha of linhas) centavos += Math.round(Number(linha.valor) * 100);
    quantidade += linhas.length;
    if (linhas.length < LOTE) break;
  }
  return { total: centavos / 100, quantidade };
}

// ---------- Gemini ----------

function ferramentas(categorias) {
  return [{
    function_declarations: [
      {
        name: "registrar_gasto",
        description: "Lança um gasto da pessoa. Use quando ela contar um gasto ou mandar a foto de um cupom fiscal.",
        parameters: {
          type: "object",
          properties: {
            data: { type: "string", description: "Data do gasto no formato AAAA-MM-DD." },
            descricao: { type: "string", description: "Onde ou com o quê foi o gasto, curto. No cupom, o nome da loja." },
            valor: { type: "number", description: "Valor em reais, maior que zero. No cupom, o VALOR TOTAL." },
            categoria: { type: "string", enum: categorias, description: "Uma das categorias da pessoa." }
          },
          required: ["data", "descricao", "valor", "categoria"]
        }
      },
      {
        name: "consultar_gastos",
        description: "Consulta quanto a pessoa gastou num período, opcionalmente numa categoria.",
        parameters: {
          type: "object",
          properties: {
            desde: { type: "string", description: "Primeiro dia do período, AAAA-MM-DD." },
            ate: { type: "string", description: "Último dia do período, AAAA-MM-DD." },
            categoria: { type: "string", enum: categorias, description: "Categoria, se a pergunta for sobre uma só." }
          },
          required: ["desde", "ate"]
        }
      }
    ]
  }];
}

function instrucoes(hoje, categorias) {
  return [
    "Você é o assistente do Meu Bolso, um app de gastos pessoais. Responda sempre em português do Brasil, curto.",
    `Hoje é ${diaDaSemanaEmSaoPaulo()}, ${hoje} (horário de São Paulo). Use esta data para entender "hoje", "ontem", "este mês" etc.`,
    `As categorias são: ${categorias.join(", ")}. Escolha sempre uma delas; se nenhuma servir, use "Outros" quando existir.`,
    "Se a pessoa contar um gasto, chame registrar_gasto. Se não disser a data, use hoje.",
    "Se a pessoa perguntar quanto gastou, chame consultar_gastos com o período certo. Nunca calcule nem invente totais.",
    "Quando vier a foto de um cupom fiscal: use o VALOR TOTAL do cupom (não um item, não o troco, não o valor pago), a data de emissão do cupom e o nome da loja como descrição.",
    "Se faltar o valor ou a foto não der para ler, não chame ferramenta: pergunte o que falta em uma frase."
  ].join("\n");
}

async function perguntarAoGemini(chave, { mensagem, imagem, mime, categorias, hoje }) {
  const partes = [];
  if (mensagem) partes.push({ text: mensagem });
  if (imagem) {
    partes.push({ inline_data: { mime_type: mime || "image/jpeg", data: imagem } });
    if (!mensagem) partes.push({ text: "Lance o gasto deste cupom fiscal." });
  }

  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": chave },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: instrucoes(hoje, categorias) }] },
      contents: [{ role: "user", parts: partes }],
      tools: ferramentas(categorias),
      generationConfig: { temperature: 0 }
    })
  });

  if (!r.ok) {
    const texto = await r.text();
    console.error("Gemini recusou:", r.status, texto);
    if (r.status === 429) throw ERROS.limite();
    if (r.status === 401 || r.status === 403 || /api key/i.test(texto)) throw ERROS.semChave();
    throw ERROS.geral();
  }

  const corpo = await r.json();
  const partesResposta = corpo?.candidates?.[0]?.content?.parts || [];
  const chamada = partesResposta.find((p) => p.functionCall)?.functionCall;
  const texto = partesResposta.map((p) => p.text || "").join("").trim();
  return { chamada, texto };
}

// ---------- Ações ----------

async function registrar(token, args, categorias, hoje, origem) {
  const valor = lerValor(args.valor);
  if (!(valor > 0)) {
    return { resposta: "Não entendi o valor do gasto. Escreva de novo com o valor, por exemplo: mercado 50 hoje.", lancou: false };
  }
  const categoria = categorias.includes(args.categoria)
    ? args.categoria
    : (categorias.includes("Outros") ? "Outros" : categorias[0]);
  const data = dataValida(args.data) ? args.data : hoje;
  const descricao = String(args.descricao || "").trim().slice(0, 80) || categoria;

  await gravarGasto(token, { data, descricao, valor, categoria, origem });
  return {
    resposta: `Lancei ${moeda.format(valor)} em ${categoria}: ${descricao}, ${dataBR(data)}.`,
    lancou: true
  };
}

async function consultar(token, args, categorias, hoje) {
  let desde = dataValida(args.desde) ? args.desde : hoje.slice(0, 8) + "01";
  let ate = dataValida(args.ate) ? args.ate : hoje;
  if (desde > ate) [desde, ate] = [ate, desde];
  const categoria = categorias.includes(args.categoria) ? args.categoria : null;

  const { total, quantidade } = await somarGastos(token, desde, ate, categoria);
  const onde = categoria ? ` com ${categoria}` : "";
  const periodo = desde === ate ? `em ${dataBR(desde)}` : `de ${dataBR(desde)} a ${dataBR(ate)}`;
  const vezes = quantidade === 1 ? "1 gasto" : `${quantidade} gastos`;
  return {
    resposta: `Você gastou ${moeda.format(total)}${onde} ${periodo} (${vezes}).`,
    lancou: false
  };
}

// ---------- Entrada ----------

export default async (req) => {
  if (req.method !== "POST") return responder({ erro: "Use o app para falar com o assistente." }, 405);

  try {
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) throw ERROS.loginVencido();
    await conferirLogin(token);

    const chave = process.env.CHAVE_GEMINI;
    if (!chave) throw ERROS.semChave();

    let corpo;
    try { corpo = await req.json(); } catch { corpo = {}; }
    const mensagem = String(corpo.mensagem || "").trim().slice(0, 500);
    const imagem = typeof corpo.imagem === "string" ? corpo.imagem : "";
    const mime = typeof corpo.mime === "string" && corpo.mime.startsWith("image/") ? corpo.mime : "image/jpeg";
    const categorias = Array.isArray(corpo.categorias)
      ? corpo.categorias.filter((c) => typeof c === "string" && c.trim()).map((c) => c.trim()).slice(0, 30)
      : [];
    if (!categorias.length) categorias.push("Outros");

    if (!mensagem && !imagem) {
      return responder({ erro: "Escreva o gasto ou a pergunta, ou mande a foto do cupom." }, 400);
    }

    const hoje = hojeEmSaoPaulo();
    const { chamada, texto } = await perguntarAoGemini(chave, { mensagem, imagem, mime, categorias, hoje });

    if (chamada?.name === "registrar_gasto") {
      return responder(await registrar(token, chamada.args || {}, categorias, hoje, imagem ? "foto" : "texto"));
    }
    if (chamada?.name === "consultar_gastos") {
      return responder(await consultar(token, chamada.args || {}, categorias, hoje));
    }
    return responder({
      resposta: texto || "Não entendi. Escreva o gasto com o valor, por exemplo: mercado 50 hoje.",
      lancou: false
    });
  } catch (erro) {
    if (erro instanceof ErroDoApp) return responder({ erro: erro.message }, erro.status);
    console.error("Erro no assistente:", erro);
    return responder({ erro: "O assistente não conseguiu responder agora. Confira a internet e tente de novo." }, 500);
  }
};
