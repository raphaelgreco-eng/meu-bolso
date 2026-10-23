// Meu Bolso — lógica do app.
// A sessão não fica guardada: a senha é pedida toda vez que o app é aberto.

(function () {
  "use strict";

  const cfg = window.MEU_BOLSO || {};
  const CATEGORIAS = cfg.CATEGORIAS || ["Outros"];
  const $ = (id) => document.getElementById(id);
  const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  let cliente = null;
  let usuario = null;
  let categoriaEscolhida = null;
  let gastosDoMes = [];
  let temporizadorAviso = null;

  // ---------- Erros em português ----------

  function frase(erro) {
    // A mensagem original fica no console, para diagnóstico; na tela vai só a frase em português.
    console.error("Meu Bolso — erro original:", erro);
    const m = String((erro && (erro.message || erro.error_description)) || erro || "").toLowerCase();
    const codigo = String((erro && erro.code) || "");
    if (!navigator.onLine || m.includes("failed to fetch") || m.includes("network") || m.includes("load failed")) {
      return "Sem conexão com a internet. Confira o Wi-Fi ou os dados móveis e tente de novo.";
    }
    if (m.includes("invalid login credentials")) return "E-mail ou senha não conferem. Confira os dois e tente de novo.";
    if (m.includes("already registered") || m.includes("already been registered") || m.includes("already exists")) {
      return "Este e-mail já tem conta. Toque em Entrar.";
    }
    if (m.includes("password") && (m.includes("at least") || m.includes("short") || m.includes("characters"))) {
      return "A senha precisa ter pelo menos 6 caracteres. Escolha uma senha maior.";
    }
    if (m.includes("email not confirmed")) {
      return "Este e-mail ainda não foi confirmado. Desligue a confirmação de e-mail no Supabase e tente de novo.";
    }
    if (m.includes("email") && (m.includes("invalid") || m.includes("valid"))) {
      return "Este e-mail não parece válido. Confira se está escrito certo.";
    }
    if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas seguidas. Espere um minuto e tente de novo.";
    if (m.includes("jwt") || m.includes("session") || m.includes("token")) return "Sua entrada expirou. Toque em Sair e entre de novo.";
    if (m.includes("row-level security") || m.includes("permission denied")) {
      return "O banco recusou a operação. Saia e entre de novo; se continuar, confira a proteção por linha da tabela no Supabase.";
    }
    if (codigo === "23514" || m.includes("check constraint")) {
      if (m.includes("categoria")) return "Esta categoria não é aceita pelo banco. Confira os nomes das categorias no Supabase.";
      if (m.includes("origem")) return "O banco não aceitou a origem do gasto. Confira os valores aceitos na coluna origem no Supabase.";
      if (m.includes("valor")) return "O banco não aceitou este valor. Digite um valor maior que zero, por exemplo 12,50.";
      return "O banco recusou um dos dados do gasto. Confira as regras da tabela gastos no Supabase.";
    }
    if (codigo === "23502" || m.includes("null value")) {
      return "Falta preencher um dado obrigatório do gasto. Confira valor, categoria e data e tente de novo.";
    }
    if (codigo === "22P02" || codigo === "22007" || codigo === "22008" || m.includes("invalid input syntax")) {
      return "Um dos dados está num formato que o banco não entende. Confira o valor (ex.: 12,50) e a data.";
    }
    if (codigo === "23503" || m.includes("foreign key")) {
      return "O banco não reconheceu a sua conta neste gasto. Toque em Sair e entre de novo.";
    }
    return "Algo deu errado. Tente de novo em instantes.";
  }

  function mostrarErro(elemento, texto) {
    elemento.textContent = texto;
    elemento.hidden = !texto;
  }

  function aviso(texto) {
    const el = $("aviso");
    el.textContent = texto;
    el.hidden = false;
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => { el.hidden = true; }, 3000);
  }

  // ---------- Datas e valores ----------

  function iso(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function hojeISO() {
    return iso(new Date());
  }

  function diaMes(dataISO) {
    const [, mes, dia] = String(dataISO).split("-");
    return dia + "/" + mes;
  }

  function lerValor(texto) {
    let t = String(texto).replace(/[R$\s]/g, "");
    if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
    const n = Number(t);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
  }

  // ---------- Início ----------

  function iniciar() {
    const erroEntrada = $("erro-entrada");

    if (!window.supabase) {
      mostrarErro(erroEntrada, "Não foi possível carregar o app. Confira a internet e abra a página de novo.");
      return;
    }
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_CHAVE_PUBLICA || cfg.SUPABASE_URL.includes("COLE")) {
      mostrarErro(erroEntrada, "O app ainda não foi configurado. Cole a URL e a chave pública em app/configuracao.js.");
      return;
    }

    cliente = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_CHAVE_PUBLICA, {
      auth: { persistSession: false, autoRefreshToken: true, detectSessionInUrl: false }
    });

    $("form-entrada").addEventListener("submit", (e) => { e.preventDefault(); entrar(false); });
    $("btn-criar").addEventListener("click", () => entrar(true));
    $("btn-sair").addEventListener("click", sair);
    $("form-gasto").addEventListener("submit", (e) => { e.preventDefault(); salvarGasto(); });
    $("form-assistente").addEventListener("submit", (e) => { e.preventDefault(); assistenteEmBreve(); });
    $("btn-foto").addEventListener("click", assistenteEmBreve);

    desenharCategorias();
    $("data").value = hojeISO();
    $("mes-nome").textContent = new Date().toLocaleDateString("pt-BR", { month: "long" });
  }

  // ---------- Entrar, criar conta e sair ----------

  async function entrar(criarConta) {
    const erroEntrada = $("erro-entrada");
    const email = $("email").value.trim();
    const senha = $("senha").value;

    if (!email || !senha) return mostrarErro(erroEntrada, "Preencha o e-mail e a senha.");
    if (criarConta && senha.length < 6) return mostrarErro(erroEntrada, "A senha precisa ter pelo menos 6 caracteres. Escolha uma senha maior.");

    mostrarErro(erroEntrada, "");
    ocupado(true);
    try {
      const resposta = criarConta
        ? await cliente.auth.signUp({ email, password: senha })
        : await cliente.auth.signInWithPassword({ email, password: senha });

      if (resposta.error) return mostrarErro(erroEntrada, frase(resposta.error));
      if (!resposta.data.session) {
        return mostrarErro(erroEntrada, "Conta criada, mas o Supabase está pedindo confirmação por e-mail. Desligue essa confirmação no Supabase e toque em Entrar.");
      }

      usuario = resposta.data.session.user;
      $("senha").value = "";
      abrirPrincipal();
    } catch (erro) {
      mostrarErro(erroEntrada, frase(erro));
    } finally {
      ocupado(false);
    }
  }

  function ocupado(sim) {
    $("btn-entrar").disabled = sim;
    $("btn-criar").disabled = sim;
  }

  async function sair() {
    try { await cliente.auth.signOut(); } catch (erro) { /* sai mesmo sem internet */ }
    usuario = null;
    gastosDoMes = [];
    $("tela-principal").hidden = true;
    $("tela-entrada").hidden = false;
    $("cartao-resumo").hidden = true;
    window.scrollTo(0, 0);
  }

  function abrirPrincipal() {
    $("tela-entrada").hidden = true;
    $("tela-principal").hidden = false;
    window.scrollTo(0, 0);
    carregarMes();
    carregarResumo();
  }

  // ---------- Gastos do mês ----------

  async function carregarMes() {
    const agora = new Date();
    const inicio = iso(new Date(agora.getFullYear(), agora.getMonth(), 1));
    const fim = iso(new Date(agora.getFullYear(), agora.getMonth() + 1, 0));

    try {
      const { data, error } = await cliente
        .from("gastos")
        .select("id, data, descricao, valor, categoria, origem, criado_em")
        .eq("dono", usuario.id)
        .gte("data", inicio)
        .lte("data", fim)
        .order("data", { ascending: false })
        .order("criado_em", { ascending: false });

      if (error) return aviso(frase(error));
      gastosDoMes = data || [];
      desenharMes();
    } catch (erro) {
      aviso(frase(erro));
    }
  }

  function desenharMes() {
    const total = gastosDoMes.reduce((soma, g) => soma + Number(g.valor), 0);
    $("total-mes").textContent = moeda.format(total);

    // Últimos gastos lançados
    const ultimos = [...gastosDoMes]
      .sort((a, b) => String(b.criado_em).localeCompare(String(a.criado_em)))
      .slice(0, 3);
    const listaUltimos = $("ultimos");
    listaUltimos.replaceChildren(...ultimos.map((g) => {
      const li = document.createElement("li");
      li.append(
        criar("span", "nome", (g.descricao || g.categoria) + " · " + diaMes(g.data)),
        criar("span", "valor", moeda.format(Number(g.valor)))
      );
      return li;
    }));
    $("ultimos-vazio").hidden = ultimos.length > 0;

    // Barras por categoria
    const porCategoria = {};
    gastosDoMes.forEach((g) => { porCategoria[g.categoria] = (porCategoria[g.categoria] || 0) + Number(g.valor); });
    const comValor = CATEGORIAS.filter((c) => porCategoria[c] > 0);
    Object.keys(porCategoria).forEach((c) => { if (!comValor.includes(c)) comValor.push(c); });
    comValor.sort((a, b) => porCategoria[b] - porCategoria[a]);
    const maior = Math.max(1, ...comValor.map((c) => porCategoria[c]));

    $("barras").replaceChildren(...comValor.map((c) => {
      const li = document.createElement("li");
      const cabeca = criar("div", "cabeca");
      cabeca.append(criar("span", "", c), criar("strong", "", moeda.format(porCategoria[c])));
      const trilho = criar("div", "trilho");
      const preenchido = criar("div", "preenchido");
      preenchido.style.width = Math.max(2, (porCategoria[c] / maior) * 100) + "%";
      trilho.append(preenchido);
      li.append(cabeca, trilho);
      return li;
    }));
    $("barras-vazio").hidden = comValor.length > 0;

    // Lista do mês
    $("lista").replaceChildren(...gastosDoMes.map((g) => {
      const li = document.createElement("li");
      const info = criar("div", "info-gasto");
      info.append(
        criar("span", "nome", g.descricao || g.categoria),
        criar("span", "detalhe", diaMes(g.data) + " · " + g.categoria)
      );
      const apagar = criar("button", "btn-apagar", "Apagar");
      apagar.type = "button";
      apagar.setAttribute("aria-label", "Apagar gasto de " + moeda.format(Number(g.valor)));
      apagar.addEventListener("click", () => apagarGasto(g));
      li.append(info, criar("span", "valor", moeda.format(Number(g.valor))), apagar);
      return li;
    }));
    $("lista-vazia").hidden = gastosDoMes.length > 0;
  }

  function criar(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  async function apagarGasto(gasto) {
    const nome = gasto.descricao || gasto.categoria;
    if (!window.confirm("Apagar o gasto \"" + nome + "\" de " + moeda.format(Number(gasto.valor)) + "?")) return;

    try {
      const { error } = await cliente.from("gastos").delete().eq("id", gasto.id);
      if (error) return aviso(frase(error));
      aviso("Gasto apagado.");
      carregarMes();
    } catch (erro) {
      aviso(frase(erro));
    }
  }

  // ---------- Lançar à mão ----------

  function desenharCategorias() {
    $("categorias").replaceChildren(...CATEGORIAS.map((c) => {
      const botao = criar("button", "categoria", c);
      botao.type = "button";
      botao.setAttribute("aria-pressed", "false");
      botao.addEventListener("click", () => {
        categoriaEscolhida = c;
        document.querySelectorAll(".categoria").forEach((b) => b.setAttribute("aria-pressed", String(b === botao)));
      });
      return botao;
    }));
  }

  async function salvarGasto() {
    const erroGasto = $("erro-gasto");
    const valor = lerValor($("valor").value);
    const descricao = $("descricao").value.trim();
    const data = $("data").value || hojeISO();

    if (!(valor > 0)) return mostrarErro(erroGasto, "Digite o valor do gasto, por exemplo 12,50.");
    if (!categoriaEscolhida) return mostrarErro(erroGasto, "Toque em uma categoria para o gasto.");

    mostrarErro(erroGasto, "");
    const botao = $("btn-salvar");
    botao.disabled = true;
    try {
      const { error } = await cliente.from("gastos").insert({
        dono: usuario.id,
        data: data,
        descricao: descricao || null,
        valor: valor,
        categoria: categoriaEscolhida,
        origem: "manual"
      });
      if (error) return mostrarErro(erroGasto, frase(error));

      $("valor").value = "";
      $("descricao").value = "";
      $("data").value = hojeISO();
      categoriaEscolhida = null;
      document.querySelectorAll(".categoria").forEach((b) => b.setAttribute("aria-pressed", "false"));
      aviso("Gasto salvo.");
      carregarMes();
    } catch (erro) {
      mostrarErro(erroGasto, frase(erro));
    } finally {
      botao.disabled = false;
    }
  }

  // ---------- Resumo da semana ----------

  async function carregarResumo() {
    try {
      const { data, error } = await cliente
        .from("resumos")
        .select("texto, criado_em")
        .order("criado_em", { ascending: false })
        .limit(1);

      const texto = !error && data && data[0] && data[0].texto;
      $("resumo-texto").textContent = texto || "";
      $("cartao-resumo").hidden = !texto;
    } catch (erro) {
      $("cartao-resumo").hidden = true;
    }
  }

  // ---------- Assistente (chega na sexta) ----------

  function assistenteEmBreve() {
    const el = $("assistente-aviso");
    el.textContent = "O assistente chega na sexta.";
    el.hidden = false;
  }

  iniciar();
})();
