/* =========================================================================
   CÁPSULA DO TEMPO DIGITAL — AULA 4
   "Como a cápsula chega até outro computador?"   (EF06CO07)

   HTML + CSS + JavaScript puro. Sem frameworks, sem dependências.

   IDEIA CENTRAL DESTA VERSÃO
   Toda a história acontece dentro de uma única tela e, principalmente,
   dentro do desenho: os pacotes CHEGAM VISIVELMENTE À TELA DO COMPUTADOR
   DE DESTINO, se reorganizam ali e viram o arquivo ali mesmo.

   MAPA DO ARQUIVO
   1. CONFIGURAÇÃO ...... o que você vai querer editar (cores, textos, rotas…)
   2. UTILIDADES ........ funções auxiliares
   3. DESENHO DA CENA ... computadores, roteadores, conexões
   4. MÁQUINA DE ESTADOS  stepper + explicação + botões
   5. PACOTES ........... criação, transmissão e chegada no destino
   6. ORGANIZAR ......... reordenação dentro da tela do destino
   7. RECONSTRUIR ....... os pacotes viram o arquivo, no destino
   8. ATIVIDADE ......... ordenar as quatro etapas
   9. INICIALIZAÇÃO
   ========================================================================= */

"use strict";

/* =========================================================================
   1. CONFIGURAÇÃO
   ========================================================================= */

/* ---- VELOCIDADE DAS ANIMAÇÕES ----------------------------------------
   Multiplicador global. 1 = normal (a travessia leva ~6 s).
   0.6 deixa mais lento para observar em aula; 1.5 acelera.
   ---------------------------------------------------------------------- */
const VELOCIDADE = 1;

/* Duração das outras animações, em milissegundos */
const DUR_ORGANIZAR = 900; // reordenar os pacotes dentro da tela
const DUR_RECONSTRUIR = 700; // pacotes se unirem e virarem o arquivo
const PULSO_ROTEADOR = 420; // tempo que o roteador fica destacado

/* ---- NOMES DOS COMPUTADORES E DO ARQUIVO ------------------------------ */
const NOME_ORIGEM = "Computador de origem";
const NOME_DESTINO = "Computador de destino";
const NOME_ARQUIVO = "Capsula_do_Tempo.zip";

/* ---- GEOMETRIA DA CENA ------------------------------------------------
   Tudo é desenhado dentro deste viewBox e escala junto com a janela.
   PARA MUDAR A QUANTIDADE DE ROTEADORES: acrescente/remova entradas em NOS
   (tipo "roteador"), ajuste CONEXOES e as ROTAS mais abaixo.
   ---------------------------------------------------------------------- */
/* A cena tem duas alturas: sem a faixa de comparação o desenho ocupa tudo
   (fica maior); quando a comparação aparece, o viewBox cresce para revelá-la.
   As coordenadas dos nós não mudam — só a área visível. */
const CENA = { largura: 1300, alturaNormal: 400, alturaComparacao: 486 };

const NOS = {
  origem: { x: 140, y: 188, tipo: "computador", nome: NOME_ORIGEM },
  r1: {
    x: 520,
    y: 188,
    tipo: "roteador",
    nome: "Roteador 1",
    rotuloAbaixo: true,
  },
  r2: {
    x: 730,
    y: 72,
    tipo: "roteador",
    nome: "Roteador 2",
    rotuloAbaixo: false,
  },
  r3: {
    x: 730,
    y: 304,
    tipo: "roteador",
    nome: "Roteador 3",
    rotuloAbaixo: true,
  },
  r4: {
    x: 930,
    y: 188,
    tipo: "roteador",
    nome: "Roteador 4",
    rotuloAbaixo: true,
  },
  destino: { x: 1140, y: 188, tipo: "computador", nome: NOME_DESTINO },
};

/* Ligações desenhadas entre os nós (os "cabos" da rede) */
const CONEXOES = [
  ["origem", "r1"],
  ["r1", "r2"],
  ["r1", "r3"],
  ["r2", "r4"],
  ["r3", "r4"],
  ["r4", "destino"],
];

/* Medidas das caixas (usadas no desenho e no posicionamento dos pacotes) */
const MONITOR = { largura: 230, altura: 190 }; // computadores
const TELA = { largura: 202, altura: 162 }; // parte interna (a "tela")
const ROTEADOR_CAIXA = { largura: 116, altura: 66 };

/* ---- ROTAS ------------------------------------------------------------
   Dois caminhos possíveis entre origem e destino.
   Os pacotes PODEM percorrer caminhos diferentes — não dizemos que cada
   pacote segue um caminho diferente.
   ---------------------------------------------------------------------- */
const ROTAS = {
  superior: ["origem", "r1", "r2", "r4", "destino"],
  inferior: ["origem", "r1", "r3", "r4", "destino"],
};

/* ---- PACOTES ----------------------------------------------------------
   PARA MUDAR A QUANTIDADE DE PACOTES: acrescente ou remova itens.
   (A grade de saída e os lugares na tela do destino se ajustam sozinhos.)

   PARA MUDAR AS ROTAS: troque "superior" por "inferior" (ou vice-versa).

   POR QUE ELES CHEGAM FORA DE ORDEM
   Cada pacote tem um atraso de saída (atrasoMs) e um tempo por trecho
   (hopMs). Como os tempos diferem, a ordem de chegada não é a de saída.
   Os valores abaixo produzem SEMPRE a chegada 2, 1, 4, 3, 6, 5 — nada é
   sorteado, para que a demonstração seja idêntica em todas as turmas.
   Chegada = atrasoMs + hopMs × 4 (a rota tem 4 trechos).
   ---------------------------------------------------------------------- */
const PACOTES = [
  { id: 1, rota: "superior", atrasoMs: 0, hopMs: 975 }, // chega em 3900 ms
  { id: 2, rota: "superior", atrasoMs: 0, hopMs: 850 }, // chega em 3400 ms
  { id: 3, rota: "inferior", atrasoMs: 300, hopMs: 1150 }, // chega em 4900 ms
  { id: 4, rota: "superior", atrasoMs: 300, hopMs: 1025 }, // chega em 4400 ms
  { id: 5, rota: "inferior", atrasoMs: 600, hopMs: 1325 }, // chega em 5900 ms
  { id: 6, rota: "inferior", atrasoMs: 600, hopMs: 1200 }, // chega em 5400 ms
];

/* ---- TEXTOS DE CADA ETAPA ---------------------------------------------
   PARA MUDAR OS TEXTOS DA SIMULAÇÃO: edite aqui.
   Mantenha o texto curto: a barra inferior mostra no máximo duas linhas.
   ---------------------------------------------------------------------- */
const TEXTOS = {
  ready: {
    emoji: "📦",
    titulo: "1. O arquivo está no computador de origem",
    texto:
      "A cápsula está pronta para ser enviada. O computador de destino ainda está vazio.",
    botao: "Enviar a cápsula",
  },
  packetizing: {
    emoji: "🧩",
    titulo: "2. Os dados são enviados em pacotes",
    texto:
      "Os dados são enviados em partes menores chamadas pacotes. Cada pacote leva parte dos dados e informações que ajudam na entrega.",
    botao: "Continuar",
  },
  transmitting: {
    emoji: "🌐",
    titulo: "3. Os pacotes atravessam a rede",
    texto:
      "Os roteadores ajudam a encaminhar os pacotes até o destino. Os pacotes podem percorrer caminhos diferentes pela rede.",
    botao: "Transmitindo…",
  },
  arrived: {
    emoji: "💡",
    titulo: "Os pacotes chegaram ao destino",
    texto:
      "Eles chegaram na mesma ordem em que saíram? Compare a saída e a chegada logo abaixo da rede.",
    botao: "Continuar",
  },
  reordering: {
    emoji: "🔢",
    titulo: "4. O computador organiza os dados",
    texto:
      "O computador usa as informações recebidas para organizar os dados corretamente.",
    botao: "Continuar",
  },
  reconstructed: {
    emoji: "✅",
    titulo: "5. Os dados são reconstruídos no destino",
    texto:
      "✅ A cápsula chegou! Os dados foram transmitidos em pacotes e reconstruídos no computador que os recebeu.",
    botao: "Ir para a atividade",
  },
  activity: {
    emoji: "✨",
    titulo: "Agora é a sua vez",
    texto: "Coloque as quatro etapas do processo na ordem em que aconteceram.",
    botao: "Ir para a atividade",
  },
};

/* Aviso que aparece dentro da tela do destino enquanto ela está vazia */
const TEXTO_TELA_VAZIA = "aguardando os dados…"; // cabe dentro da tela do destino

/* Emoji do cabeçalho (mude aqui se quiser outro) */
const EMOJI_CABECALHO = "📦";

/* =========================================================================
   2. UTILIDADES
   ========================================================================= */

const NS = "http://www.w3.org/2000/svg";
const $ = (sel) => document.querySelector(sel);

/* Lê uma cor declarada em style.css (:root).
   Atributos de SVG não entendem var(--cor); por isso a leitura aqui.
   Assim as cores continuam definidas em um lugar só: o CSS. */
const _cores = {};
function cor(nome) {
  if (!(nome in _cores)) {
    _cores[nome] =
      getComputedStyle(document.documentElement)
        .getPropertyValue(nome)
        .trim() || "#14707D";
  }
  return _cores[nome];
}

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] != null) el.setAttribute(k, attrs[k]);
  return el;
}

function svgTexto(conteudo, attrs = {}) {
  const t = svgEl("text", attrs);
  t.textContent = conteudo;
  return t;
}

/* ACESSIBILIDADE: quem pediu menos movimento no sistema recebe a mesma
   sequência, porém em passos discretos, sem deslocamento contínuo. */
const menosMovimento = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

/* Temporizadores controlados, para que "Recomeçar" cancele tudo */
let timers = [];
function esperar(ms, fn) {
  const t = setTimeout(fn, menosMovimento ? Math.min(ms, 150) : ms);
  timers.push(t);
  return t;
}
function limparTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}

/* =========================================================================
   3. DESENHO DA CENA
   ========================================================================= */

const svgCena = $("#cena");
const camadaConexoes = $("#camadaConexoes");
const camadaNos = $("#camadaNos");
const camadaComparacao = $("#camadaComparacao");
const camadaPacotes = $("#camadaPacotes");

let linhasPorTrecho = {}; // "a|b" -> <line>   (para destacar o trecho usado)
let gruposRoteador = {}; // id    -> <g>      (para pulsar o roteador)
let arquivoOrigem = null;
let arquivoDestino = null;
let avisoTelaDestino = null;

/** Mostra (ou não) a faixa inferior da cena, aumentando o viewBox. */
function ajustarViewBox(comComparacao) {
  const h = comComparacao ? CENA.alturaComparacao : CENA.alturaNormal;
  svgCena.setAttribute("viewBox", `0 0 ${CENA.largura} ${h}`);
}

/** Chave única de um trecho, independente do sentido. */
function chaveTrecho(a, b) {
  return [a, b].sort().join("|");
}

/** Desenha os cabos da rede. */
function desenharConexoes() {
  camadaConexoes.textContent = "";
  linhasPorTrecho = {};
  CONEXOES.forEach(([a, b]) => {
    const na = NOS[a],
      nb = NOS[b];
    const linha = svgEl("line", {
      x1: na.x,
      y1: na.y,
      x2: nb.x,
      y2: nb.y,
      class: "conexao",
    });
    camadaConexoes.appendChild(linha);
    linhasPorTrecho[chaveTrecho(a, b)] = linha;
  });
}

/** Ícone de arquivo ZIP (usado na origem e, no fim, no destino). */
function desenharArquivo(cx, cy, escala = 1) {
  const g = svgEl("g", {
    class: "arquivo",
    transform: `translate(${cx} ${cy}) scale(${escala})`,
  });
  g.appendChild(
    svgEl("rect", {
      class: "arquivo-corpo",
      x: -27,
      y: -48,
      width: 54,
      height: 62,
      rx: 12,
    }),
  );
  g.appendChild(
    svgEl("line", {
      class: "arquivo-linha",
      x1: -27,
      y1: -28,
      x2: 27,
      y2: -28,
    }),
  );
  g.appendChild(
    svgEl("rect", {
      class: "arquivo-fecho",
      x: -7,
      y: -28,
      width: 14,
      height: 14,
      rx: 4,
    }),
  );
  g.appendChild(
    svgTexto(NOME_ARQUIVO, { class: "texto-arquivo", x: 0, y: 36 }),
  );
  return g;
}

/** Computador (origem ou destino). A "tela" do destino recebe os pacotes. */
function desenharComputador(id, no) {
  const g = svgEl("g", {
    class: "computador " + (id === "destino" ? "destino" : "origem"),
  });
  const mx = no.x - MONITOR.largura / 2;
  const my = no.y - MONITOR.altura / 2;

  // rótulo ACIMA do monitor, com um emoji amigável
  g.appendChild(
    svgTexto((id === "destino" ? "🖥️ " : "🖥️ ") + no.nome, {
      class: "rotulo-maquina",
      x: no.x,
      y: my - 16,
    }),
  );

  // monitor + tela + pé (aparência definida no style.css)
  g.appendChild(
    svgEl("rect", {
      class: "monitor",
      x: mx,
      y: my,
      width: MONITOR.largura,
      height: MONITOR.altura,
      rx: 22,
    }),
  );
  g.appendChild(
    svgEl("rect", {
      class: "tela",
      x: no.x - TELA.largura / 2,
      y: no.y - TELA.altura / 2,
      width: TELA.largura,
      height: TELA.altura,
      rx: 14,
    }),
  );
  g.appendChild(
    svgEl("rect", {
      class: "pe",
      x: no.x - 30,
      y: my + MONITOR.altura,
      width: 60,
      height: 11,
      rx: 5,
    }),
  );
  g.appendChild(
    svgEl("rect", {
      class: "pe",
      x: no.x - 58,
      y: my + MONITOR.altura + 11,
      width: 116,
      height: 11,
      rx: 5,
    }),
  );

  if (id === "origem") {
    // O arquivo permanece NA ORIGEM durante toda a simulação:
    // enviar não apaga o arquivo do computador de quem envia.
    arquivoOrigem = desenharArquivo(no.x, no.y + 6);
    g.appendChild(arquivoOrigem);
  } else {
    // aviso enquanto a tela do destino está vazia
    avisoTelaDestino = svgTexto(TEXTO_TELA_VAZIA, {
      class: "texto-tela",
      x: no.x,
      y: no.y + 6,
    });
    g.appendChild(avisoTelaDestino);

    // arquivo reconstruído (começa invisível)
    arquivoDestino = desenharArquivo(no.x, no.y + 6);
    arquivoDestino.style.opacity = "0";
    g.appendChild(arquivoDestino);
  }
  return g;
}

/** Roteador: caixa arredondada com um símbolo de encaminhamento (↗ ↘). */
function desenharRoteador(id, no) {
  const g = svgEl("g", {
    class: "roteador",
    role: "img",
    "aria-label": no.nome,
  });
  const w = ROTEADOR_CAIXA.largura,
    h = ROTEADOR_CAIXA.altura;

  g.appendChild(
    svgEl("rect", {
      class: "caixa",
      x: no.x - w / 2,
      y: no.y - h / 2,
      width: w,
      height: h,
      rx: 18,
    }),
  );

  // símbolo: entra por um lado e sai por dois — "encaminha"
  const cxs = no.x,
    cys = no.y;
  g.appendChild(
    svgEl("path", {
      class: "simbolo",
      d: `M ${cxs - 36} ${cys} H ${cxs - 8}
        M ${cxs - 8} ${cys} L ${cxs + 22} ${cys - 16}
        M ${cxs - 8} ${cys} L ${cxs + 22} ${cys + 16}`,
    }),
  );
  // pontas das setas
  g.appendChild(
    svgEl("path", {
      class: "simbolo",
      d: `M ${cxs + 12} ${cys - 19} L ${cxs + 24} ${cys - 17} L ${cxs + 18} ${cys - 7}`,
    }),
  );
  g.appendChild(
    svgEl("path", {
      class: "simbolo",
      d: `M ${cxs + 12} ${cys + 19} L ${cxs + 24} ${cys + 17} L ${cxs + 18} ${cys + 7}`,
    }),
  );

  // rótulo permanente: "Roteador 1", "Roteador 2"…
  const dy = no.rotuloAbaixo ? h / 2 + 27 : -(h / 2 + 15);
  g.appendChild(
    svgTexto(no.nome, { class: "rotulo-roteador", x: no.x, y: no.y + dy }),
  );

  gruposRoteador[id] = g;
  return g;
}

function desenharNos() {
  camadaNos.textContent = "";
  gruposRoteador = {};
  arquivoOrigem = arquivoDestino = avisoTelaDestino = null;
  for (const id in NOS) {
    const no = NOS[id];
    camadaNos.appendChild(
      no.tipo === "computador"
        ? desenharComputador(id, no)
        : desenharRoteador(id, no),
    );
  }
}

/** Destaca brevemente um roteador quando um pacote passa por ele. */
function pulsarRoteador(id) {
  const g = gruposRoteador[id];
  if (!g) return;
  g.classList.add("pulso");
  esperar(PULSO_ROTEADOR, () => g.classList.remove("pulso"));
}

/* ---- faixa de comparação saída × chegada, DENTRO do próprio desenho ---- */
function mostrarComparacao(ordemChegada) {
  camadaComparacao.textContent = "";

  const x0 = 310,
    y0 = 378,
    w = 680,
    h = 98;
  camadaComparacao.appendChild(
    svgEl("rect", {
      class: "comparacao-fundo",
      x: x0,
      y: y0,
      width: w,
      height: h,
      rx: 20,
    }),
  );

  const linhas = [
    {
      rotulo: "Saíram da origem:",
      valores: PACOTES.map((p) => p.id),
      y: y0 + 30,
    },
    { rotulo: "Chegaram ao destino:", valores: ordemChegada, y: y0 + 72 },
  ];

  linhas.forEach((linha) => {
    camadaComparacao.appendChild(
      svgTexto(linha.rotulo, {
        class: "comparacao-rotulo",
        x: x0 + 228,
        y: linha.y + 7,
      }),
    );
    linha.valores.forEach((v, i) => {
      const cx = x0 + 258 + i * 56;
      camadaComparacao.appendChild(
        svgEl("rect", {
          class: "comparacao-caixa",
          x: cx,
          y: linha.y - 17,
          width: 42,
          height: 34,
          rx: 11,
        }),
      );
      camadaComparacao.appendChild(
        svgTexto(String(v), {
          class: "comparacao-num",
          x: cx + 21,
          y: linha.y + 8,
        }),
      );
    });
  });

  ajustarViewBox(true);
}

function esconderComparacao() {
  camadaComparacao.textContent = "";
  ajustarViewBox(false);
}

/* =========================================================================
   4. MÁQUINA DE ESTADOS
   ========================================================================= */

/* Cada estado controla: stepper, texto da barra, botões e o que acontece
   na tela do computador de destino. */
const ESTADOS = [
  "ready", // arquivo parado na origem
  "packetizing", // os dados viram pacotes, ao lado da origem
  "transmitting", // os pacotes atravessam a rede
  "arrived", // todos chegaram (fora de ordem) — pausa automática
  "reordering", // o destino organiza os pacotes
  "reconstructed", // os pacotes viram o arquivo, no destino
  "activity", // atividade de ordenação
];

/* Qual etapa do stepper cada estado destaca */
const PASSO_DO_ESTADO = {
  ready: 0,
  packetizing: 1,
  transmitting: 2,
  arrived: 2,
  reordering: 3,
  reconstructed: 4,
  activity: 4,
};

let estado = "ready";

const stepper = $("#stepper");
const explicacao = $(".explicacao");
const etapaEmoji = $("#etapaEmoji");
const etapaTitulo = $("#etapaTitulo");
const etapaTexto = $("#etapaTexto");
const btnPrincipal = $("#btnPrincipal");
const btnPausar = $("#btnPausar");
const btnRecomecar = $("#btnRecomecar");
const cenaWrap = $("#cenaWrap");
const secaoAtividade = $("#atividade");

/** Atualiza stepper, explicação e rótulo do botão principal. */
function aplicarEstado(novo) {
  estado = novo;
  const t = TEXTOS[novo];

  if (etapaEmoji) etapaEmoji.textContent = t.emoji || "💡";
  etapaTitulo.textContent = t.titulo;
  etapaTexto.textContent = t.texto;
  btnPrincipal.textContent = t.botao;

  explicacao.classList.toggle("destaque", novo === "arrived");
  explicacao.classList.toggle("final", novo === "reconstructed");

  // STEPPER: ativo, concluídos (✓) e futuros — o estado é comunicado por
  // cor, tamanho, negrito, número, ícone, ✓ e aria-current (nunca só cor).
  const atual = PASSO_DO_ESTADO[novo];
  [...stepper.children].forEach((li, i) => {
    li.classList.toggle("ativo", i === atual);
    li.classList.toggle("feito", i < atual);
    if (i === atual) li.setAttribute("aria-current", "step");
    else li.removeAttribute("aria-current");
  });
}

/** Clique no botão principal. */
function avancar() {
  switch (estado) {
    case "ready":
      criarPacotes();
      break;
    case "packetizing":
      iniciarTransmissao();
      break;
    case "arrived":
      organizarPacotes();
      break;
    case "reordering":
      reconstruirArquivo();
      break;
    case "reconstructed":
      abrirAtividade();
      break;
  }
}

/* =========================================================================
   5. PACOTES
   ========================================================================= */

let pacotes = []; // estado vivo de cada pacote
let ordemChegada = []; // ids na ordem em que chegaram
let relogio = 0; // tempo da transmissão (ms)
let rodando = false;
let ultimoQuadro = null;
let raf = null;
let trechosAtivos = ""; // cache para não mexer no DOM a cada quadro

const PACOTE = { largura: 54, altura: 44 };

/** Posição de saída (grade ao lado do computador de origem). */
function posicaoSaida(indice, total) {
  const colunas = 3;
  const linhas = Math.ceil(total / colunas);
  const passoX = 57,
    passoY = 62;
  const x0 = NOS.origem.x + MONITOR.largura / 2 + 62; // logo à direita do monitor
  const y0 = NOS.origem.y - ((linhas - 1) * passoY) / 2;
  return {
    x: x0 + (indice % colunas) * passoX,
    y: y0 + Math.floor(indice / colunas) * passoY,
  };
}

/** Lugar de um pacote DENTRO da tela do computador de destino.
    posicao 0..5 → grade de 3 colunas, lida da esquerda para a direita. */
function lugarNaTelaDestino(posicao, total) {
  const colunas = 3;
  const linhas = Math.ceil(total / colunas);
  const passoX = 64,
    passoY = 66;
  const x0 = NOS.destino.x - ((colunas - 1) * passoX) / 2;
  const y0 = NOS.destino.y + 6 - ((linhas - 1) * passoY) / 2;
  return {
    x: x0 + (posicao % colunas) * passoX,
    y: y0 + Math.floor(posicao / colunas) * passoY,
  };
}

/** Ordem de chegada calculada a partir dos tempos configurados. */
function ordemDeChegadaPrevista() {
  return PACOTES.map((p) => ({
    id: p.id,
    quando: p.atrasoMs + p.hopMs * (ROTAS[p.rota].length - 1),
  }))
    .sort((a, b) => a.quando - b.quando)
    .map((p) => p.id);
}

/** Pontos do trajeto: sai da grade, passa pelos roteadores e termina
    DENTRO da tela do destino, no lugar correspondente à ordem de chegada. */
function pontosDoTrajeto(pacote) {
  const nomes = ROTAS[pacote.rota];
  const desvio = ((pacote.id % 3) - 1) * 21; // evita sobreposição exata
  const pontos = [posicaoSaida(pacote.indice, pacotes.length)];
  for (let i = 1; i < nomes.length - 1; i++) {
    pontos.push({ x: NOS[nomes[i]].x, y: NOS[nomes[i]].y + desvio });
  }
  pontos.push(lugarNaTelaDestino(pacote.posicaoChegada, pacotes.length));
  return pontos;
}

function desenharPacote(pacote) {
  const g = svgEl("g", {
    class: "pacote",
    role: "img",
    "aria-label": `Pacote ${pacote.id}`,
  });
  const w = PACOTE.largura,
    h = PACOTE.altura;
  g.appendChild(
    svgEl("rect", {
      class: "corpo",
      x: -w / 2,
      y: -h / 2,
      width: w,
      height: h,
      rx: 13,
    }),
  );
  g.appendChild(
    svgEl("rect", {
      class: "faixa",
      x: -w / 2,
      y: -h / 2,
      width: w,
      height: 13,
      rx: 6,
    }),
  );
  g.appendChild(svgTexto(String(pacote.id), { class: "numero", x: 0, y: 12 }));
  return g;
}

/** Move um pacote (usamos transform de CSS: é animável por transição). */
function posicionar(pacote, x, y) {
  pacote.elemento.style.transform = `translate(${x}px, ${y}px)`;
  pacote.x = x;
  pacote.y = y;
}

/* ---- ETAPA 2: os dados passam a ser enviados em pacotes ---- */
function criarPacotes() {
  const previsao = ordemDeChegadaPrevista();

  pacotes = PACOTES.map((p, i) => ({
    ...p,
    indice: i,
    posicaoChegada: previsao.indexOf(p.id), // lugar que ocupará na tela do destino
    chegou: false,
    trechoAtual: -1,
    elemento: null,
    pontos: null,
    x: 0,
    y: 0,
  }));

  camadaPacotes.textContent = "";
  pacotes.forEach((p) => {
    const el = desenharPacote(p);
    p.elemento = el;
    camadaPacotes.appendChild(el);
    const saida = posicaoSaida(p.indice, pacotes.length);
    posicionar(p, saida.x, saida.y);
    p.pontos = pontosDoTrajeto(p);
    el.style.opacity = "0";
    esperar(90 * p.indice, () => {
      el.style.transition = "opacity .3s ease";
      el.style.opacity = "1";
    });
  });

  aplicarEstado("packetizing");
}

/* ---- ETAPA 3: travessia da rede ---- */
function iniciarTransmissao() {
  aplicarEstado("transmitting");
  btnPrincipal.disabled = true;

  if (menosMovimento) {
    // Sem movimento contínuo: cada pacote aparece diretamente no seu lugar
    // dentro da tela do destino, um de cada vez, na ordem prevista.
    const ordem = ordemDeChegadaPrevista();
    ordem.forEach((id, i) => {
      esperar(500 * (i + 1), () => {
        const p = pacotes.find((x) => x.id === id);
        const destino = p.pontos[p.pontos.length - 1];
        p.elemento.style.transition = "none";
        posicionar(p, destino.x, destino.y);
        registrarChegada(p);
        if (i === ordem.length - 1) finalizarTransmissao();
      });
    });
    return;
  }

  relogio = 0;
  ultimoQuadro = null;
  rodando = true;
  btnPausar.disabled = false;
  btnPausar.textContent = "Pausar";
  pacotes.forEach((p) => {
    p.elemento.style.transition = "none";
  });
  raf = requestAnimationFrame(quadro);
}

function quadro(marca) {
  if (!rodando) return;
  if (ultimoQuadro === null) ultimoQuadro = marca;
  relogio += (marca - ultimoQuadro) * VELOCIDADE;
  ultimoQuadro = marca;

  atualizarPacotes();

  if (pacotes.every((p) => p.chegou)) finalizarTransmissao();
  else raf = requestAnimationFrame(quadro);
}

/** Recalcula a posição de cada pacote e destaca trechos e roteadores. */
function atualizarPacotes() {
  const emUso = new Set();

  pacotes.forEach((p) => {
    if (p.chegou) return;

    const t = relogio - p.atrasoMs;
    if (t <= 0) return; // ainda não saiu

    const nomes = ROTAS[p.rota];
    const trechos = p.pontos.length - 1;
    const i = Math.floor(t / p.hopMs);

    if (i >= trechos) {
      registrarChegada(p);
      return;
    }

    // mudou de trecho → acabou de passar por um roteador: destaca
    if (i !== p.trechoAtual) {
      p.trechoAtual = i;
      if (i > 0) pulsarRoteador(nomes[i]);
    }
    emUso.add(chaveTrecho(nomes[i], nomes[i + 1]));

    const f = (t % p.hopMs) / p.hopMs;
    const a = p.pontos[i],
      b = p.pontos[i + 1];
    posicionar(p, a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f);
  });

  // destaca só os trechos realmente em uso (sem mexer no DOM à toa)
  const assinatura = [...emUso].sort().join(",");
  if (assinatura !== trechosAtivos) {
    trechosAtivos = assinatura;
    for (const chave in linhasPorTrecho) {
      linhasPorTrecho[chave].classList.toggle("ativa", emUso.has(chave));
    }
  }
}

/** O pacote entrou na tela do computador de destino. */
function registrarChegada(pacote) {
  if (pacote.chegou) return;
  pacote.chegou = true;
  ordemChegada.push(pacote.id);

  const lugar = lugarNaTelaDestino(pacote.posicaoChegada, pacotes.length);
  posicionar(pacote, lugar.x, lugar.y);
  pacote.elemento.classList.add("no-destino");
  pacote.elemento.setAttribute(
    "aria-label",
    `Pacote ${pacote.id} recebido na posição ${pacote.posicaoChegada + 1}`,
  );

  // o aviso "aguardando os dados…" some quando o primeiro pacote chega
  if (avisoTelaDestino) avisoTelaDestino.style.opacity = "0";
}

/** Todos chegaram: pausa automaticamente e mostra a comparação. */
function finalizarTransmissao() {
  if (estado !== "transmitting") return;
  rodando = false;
  if (raf) cancelAnimationFrame(raf);
  trechosAtivos = "";
  for (const k in linhasPorTrecho) linhasPorTrecho[k].classList.remove("ativa");

  btnPausar.disabled = true;
  btnPrincipal.disabled = false;
  mostrarComparacao(ordemChegada);
  aplicarEstado("arrived");
}

/** Pausar / retomar a travessia. */
function alternarPausa() {
  if (estado !== "transmitting") return;
  if (rodando) {
    rodando = false;
    if (raf) cancelAnimationFrame(raf);
    btnPausar.textContent = "Continuar";
  } else {
    rodando = true;
    ultimoQuadro = null;
    btnPausar.textContent = "Pausar";
    raf = requestAnimationFrame(quadro);
  }
}

/* =========================================================================
   6. ORGANIZAR — dentro da tela do computador de destino
   ========================================================================= */

/* Os pacotes que estão na tela do destino deslizam da ordem de chegada
   (2 1 4 3 6 5) para a ordem correta (1 2 3 4 5 6). Nada acontece fora
   do computador: a reorganização é visível no mesmo lugar da chegada. */
function organizarPacotes() {
  aplicarEstado("reordering");
  btnPrincipal.disabled = true;
  esconderComparacao();

  const ordenados = [...pacotes].sort((a, b) => a.id - b.id);
  ordenados.forEach((p, posicao) => {
    const lugar = lugarNaTelaDestino(posicao, pacotes.length);
    p.elemento.style.transition = menosMovimento
      ? "none"
      : `transform ${DUR_ORGANIZAR}ms cubic-bezier(.22,.7,.3,1)`;
    posicionar(p, lugar.x, lugar.y);
    p.elemento.classList.remove("no-destino");
    p.elemento.classList.add("organizado");
  });

  esperar(DUR_ORGANIZAR, () => {
    btnPrincipal.disabled = false;
  });
}

/* =========================================================================
   7. RECONSTRUIR — os pacotes viram o arquivo, no destino
   ========================================================================= */

function reconstruirArquivo() {
  aplicarEstado("reconstructed");
  btnPrincipal.disabled = true;

  const centro = { x: NOS.destino.x, y: NOS.destino.y + 6 };

  pacotes.forEach((p) => {
    p.elemento.style.transition = `transform ${DUR_RECONSTRUIR}ms ease-in, opacity ${DUR_RECONSTRUIR}ms ease-in`;
    posicionar(p, centro.x, centro.y); // os pacotes se juntam…
    p.elemento.style.opacity = "0"; // …e desaparecem ao se unir
  });

  esperar(DUR_RECONSTRUIR - 120, () => {
    if (arquivoDestino) {
      arquivoDestino.style.transition = "opacity .45s ease";
      arquivoDestino.style.opacity = "1";
    }
  });

  esperar(DUR_RECONSTRUIR + 250, () => {
    camadaPacotes.textContent = "";
    btnPrincipal.disabled = false;
  });
}

/* =========================================================================
   8. ATIVIDADE — ordenar as quatro etapas
   ========================================================================= */

/* A ordem correta é a ordem dos ids (1, 2, 3, 4). */
const CARTOES = [
  { id: 1, texto: "Dados organizados em pacotes" },
  { id: 2, texto: "Pacotes atravessam a rede" },
  { id: 3, texto: "Dados são organizados no destino" },
  { id: 4, texto: "Arquivo é reconstruído" },
];

/* Ordem inicial embaralhada, sempre a mesma (previsível para a aula) */
const ORDEM_INICIAL = [3, 1, 4, 2];

const listaOrdenacao = $("#ordenacao");
const btnVerificar = $("#btnVerificar");
const btnVerNovamente = $("#btnVerNovamente");
const feedback = $("#feedback");
const fechamento = $("#fechamento");

let arrastado = null;

function montarAtividade() {
  listaOrdenacao.textContent = "";
  ORDEM_INICIAL.forEach((id) => {
    listaOrdenacao.appendChild(criarCartao(CARTOES.find((c) => c.id === id)));
  });
  atualizarSetas();
  feedback.textContent = "";
  fechamento.hidden = true;
  secaoAtividade.classList.remove("concluida");
}

function criarCartao(dados) {
  const li = document.createElement("li");
  li.draggable = true;
  li.dataset.id = String(dados.id);

  const pos = document.createElement("span");
  pos.className = "posicao";
  pos.setAttribute("aria-hidden", "true");

  const rotulo = document.createElement("span");
  rotulo.className = "rotulo";
  rotulo.textContent = dados.texto;

  const setas = document.createElement("span");
  setas.className = "setas";

  const subir = document.createElement("button");
  subir.type = "button";
  subir.className = "btn-seta subir";
  subir.innerHTML = "&#9650;";
  subir.setAttribute("aria-label", `Mover para cima: ${dados.texto}`);
  subir.addEventListener("click", () => mover(li, -1));

  const descer = document.createElement("button");
  descer.type = "button";
  descer.className = "btn-seta descer";
  descer.innerHTML = "&#9660;";
  descer.setAttribute("aria-label", `Mover para baixo: ${dados.texto}`);
  descer.addEventListener("click", () => mover(li, 1));

  setas.append(subir, descer);
  li.append(pos, rotulo, setas);

  // arrastar com o mouse (o teclado usa as setas acima)
  li.addEventListener("dragstart", () => {
    arrastado = li;
    li.classList.add("arrastando");
  });
  li.addEventListener("dragend", () => {
    arrastado = null;
    li.classList.remove("arrastando");
    listaOrdenacao
      .querySelectorAll("li")
      .forEach((x) => x.classList.remove("alvo"));
    atualizarSetas();
  });
  li.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (arrastado && arrastado !== li) li.classList.add("alvo");
  });
  li.addEventListener("dragleave", () => li.classList.remove("alvo"));
  li.addEventListener("drop", (e) => {
    e.preventDefault();
    li.classList.remove("alvo");
    if (!arrastado || arrastado === li) return;
    const itens = [...listaOrdenacao.children];
    if (itens.indexOf(arrastado) < itens.indexOf(li)) li.after(arrastado);
    else li.before(arrastado);
    atualizarSetas();
  });

  return li;
}

function mover(li, direcao) {
  const itens = [...listaOrdenacao.children];
  const i = itens.indexOf(li) + direcao;
  if (i < 0 || i >= itens.length) return;
  if (direcao < 0) itens[i].before(li);
  else itens[i].after(li);
  atualizarSetas();
  li.querySelector(direcao < 0 ? ".subir" : ".descer").focus();
}

function atualizarSetas() {
  const itens = [...listaOrdenacao.children];
  itens.forEach((li, i) => {
    li.querySelector(".subir").disabled = i === 0;
    li.querySelector(".descer").disabled = i === itens.length - 1;
  });
}

/** Confere a ordem. Tentativas ilimitadas. */
function verificar() {
  const escolhida = [...listaOrdenacao.children].map((li) =>
    Number(li.dataset.id),
  );
  const certo = escolhida.every((id, i) => id === i + 1);

  if (certo) {
    feedback.innerHTML =
      '<div class="caixa certo">✅ Isso mesmo!' +
      '<span class="ciclo">Dividir → transmitir → organizar → reconstruir</span></div>';
    fechamento.hidden = false;
    secaoAtividade.classList.add("concluida");
  } else {
    feedback.innerHTML =
      '<div class="caixa tente">↻ Quase! Lembre da simulação e tente outra ordem.</div>';
  }
}

/** A atividade OCUPA O LUGAR da simulação (não fica abaixo dela). */
function abrirAtividade() {
  cenaWrap.hidden = true;
  secaoAtividade.hidden = false;
  montarAtividade();
  aplicarEstado("activity");
  btnPrincipal.disabled = true;
  btnPausar.disabled = true;
}

/* =========================================================================
   9. INICIALIZAÇÃO
   ========================================================================= */

/** "Recomeçar" devolve tudo ao início, em qualquer momento. */
function recomecar() {
  limparTimers();
  rodando = false;
  if (raf) cancelAnimationFrame(raf);

  pacotes = [];
  ordemChegada = [];
  relogio = 0;
  ultimoQuadro = null;
  trechosAtivos = "";

  camadaPacotes.textContent = "";
  esconderComparacao();
  ajustarViewBox(false);

  desenharConexoes();
  desenharNos();

  cenaWrap.hidden = false;
  secaoAtividade.hidden = true;
  feedback.textContent = "";
  fechamento.hidden = true;

  btnPrincipal.disabled = false;
  btnPausar.disabled = true;
  btnPausar.textContent = "Pausar";

  aplicarEstado("ready");
}

function iniciar() {
  const selo = $("#seloCabecalho");
  if (selo) selo.textContent = EMOJI_CABECALHO;

  ajustarViewBox(false);
  desenharConexoes();
  desenharNos();
  aplicarEstado("ready");

  btnPrincipal.addEventListener("click", avancar);
  btnPausar.addEventListener("click", alternarPausa);
  btnRecomecar.addEventListener("click", recomecar);
  btnVerificar.addEventListener("click", verificar);
  btnVerNovamente.addEventListener("click", recomecar);

  // barra de espaço avança a etapa (quando o foco não está em um botão)
  document.addEventListener("keydown", (e) => {
    if (
      e.code === "Space" &&
      !/^(BUTTON|INPUT|TEXTAREA)$/.test(document.activeElement.tagName)
    ) {
      e.preventDefault();
      if (!btnPrincipal.disabled) avancar();
    }
  });
}

document.addEventListener("DOMContentLoaded", iniciar);

/* =========================================================================
   TELA INICIAL — porta de entrada
   Bloco acrescentado no fim do arquivo. Não toca em nenhuma função acima:
   apenas esconde a tela inicial e libera a aplicação, que já foi montada
   normalmente por iniciar().
   ========================================================================= */

document.addEventListener("DOMContentLoaded", function () {
  const telaInicial = document.getElementById("telaInicial");
  const botaoComecar = document.getElementById("btnComecarPercurso");
  if (!telaInicial || !botaoComecar) return;

  botaoComecar.addEventListener("click", function () {
    telaInicial.classList.add("saindo"); // fade curto
    window.setTimeout(
      function () {
        document.body.classList.add("app-liberado"); // revela a simulação
        const principal = document.getElementById("btnPrincipal");
        if (principal) principal.focus(); // foco entra na atividade
      },
      menosMovimento ? 0 : 180,
    );
  });
});
