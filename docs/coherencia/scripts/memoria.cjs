// Extracciones de la memoria (docs/thesis) para /coherencia: citas y claves del .bib,
// acrónimos, figuras, saltos de página manuales, \todonote, % TODO, etiquetas y
// referencias, orden de los \input de main.tex, líneas con más de una frase, frases de
// andamiaje temporal y términos en inglés sin \eng{}. Quita antes los comentarios %
// (en config/packages.tex hay citas de ejemplo comentadas que darían falsos positivos).
// Uso: node docs/coherencia/scripts/memoria.cjs [docs/thesis]
const fs = require("fs");
const path = require("path");

const root = process.argv[2] || "docs/thesis";
const TOPE = 60;

function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return e.name === "build" ? [] : walk(path.join(d, e.name));
    return e.name.endsWith(".tex") ? [path.join(d, e.name)] : [];
  });
}
const rel = (f) => path.relative(process.cwd(), f).replace(/\\/g, "/");
const sinComentario = (l) => l.replace(/(^|[^\\])%.*$/, "$1");

const reCita =
  /\\(parencite|textcite|autocite|cite|citeauthor|citeyear|citetitle|fullcite|nocite|Parencite|Textcite)\*?((?:\[[^\]]*\])*)\{([^}]*)\}/g;
const reAc = /\\(ac|acs|acl|acf|acp|acsp|aclp|acfp|Ac|Acp|acused)\{([A-Za-z0-9]+)\}/g;
const reGfx = /\\includegraphics(?:\[[^\]]*\])?\{([^}]*)\}/g;
const reSalto = /\\(newpage|clearpage|pagebreak)\b/g;
const reLabel = /\\label\{([^}]*)\}/g;
const reRef = /\\(?:ref|autoref|pageref|eqref|nameref|cref|Cref)\{([^}]*)\}/g;
const reInput = /\\(?:input|include)\{([^}]*)\}/g;
const reTodo = /\\todonote\{/;
const reDosFrases = /[.!?]\s+[A-ZÁÉÍÓÚÑ¿¡]/;
const ABREV =
  /(?:p|ej|cap|caps|núm|fig|figs|tab|etc|vs|Dr|Sr|Sra|St|apdo|art|pág|págs|op|cit|cf|a\.m|p\.m)\.\s+[A-ZÁÉÍÓÚÑ¿¡]/;
const ANDAMIAJE =
  /\b(pendiente de|se describir[áa]n?|cuando se implemente|actualmente|a día de hoy|por ahora|todavía no|aún no|en el momento de escribir|en este momento|de momento|próximamente|más adelante se|se completará|se añadirá)\b/i;
const INGLES =
  /\b(MoSCoW|stub|stubs|spike|grooming|deploy|pipeline|sprint|sprints|backlog|feature|features|framework|middleware|endpoint|endpoints|token|tokens|frontend|backend|commit|commits|branch|merge|refactor|bug|bugs|log|logs|placeholder|mock|mocks|hook|hooks|runner|build)\b/;

const citadas = new Map();
const acUsados = new Map();
const figuras = [];
const saltos = [];
const labels = new Map();
const refs = new Map();
const todonotes = [];
const todos = [];
const dosFrases = [];
const andamiaje = [];
const ingles = [];
let inputs = [];

for (const f of walk(root)) {
  const r = rel(f);
  const lineas = fs.readFileSync(f, "utf8").split("\n");
  const esMain = /(^|\/)main\.tex$/.test(r);
  const esProsa = /\/(chapters|frontmatter|appendices)\//.test(r);
  lineas.forEach((orig, i) => {
    const n = i + 1;
    if (/^\s*%\s*TODO/.test(orig)) todos.push(`${r}:${n}: ${orig.trim().slice(0, 140)}`);
    const l = sinComentario(orig);
    if (!l.trim()) return;
    let m;
    while ((m = reCita.exec(l))) m[3].split(",").forEach((k) => citadas.set(k.trim(), `${r}:${n}`));
    while ((m = reAc.exec(l))) acUsados.set(m[2], acUsados.get(m[2]) || `${r}:${n}`);
    while ((m = reGfx.exec(l))) figuras.push(`${r}:${n}: ${m[1]}`);
    if (!esMain) while ((m = reSalto.exec(l))) saltos.push(`${r}:${n}: \\${m[1]}`);
    while ((m = reLabel.exec(l))) labels.set(m[1], `${r}:${n}`);
    while ((m = reRef.exec(l))) refs.set(m[1], refs.get(m[1]) || `${r}:${n}`);
    if (esMain) while ((m = reInput.exec(l))) inputs.push(m[1]);
    if (reTodo.test(l)) todonotes.push(`${r}:${n}: ${l.trim().slice(0, 160)}`);
    if (esProsa && !reTodo.test(l) && !/^\s*\\/.test(l)) {
      if (reDosFrases.test(l) && !ABREV.test(l))
        dosFrases.push(`${r}:${n}: ${l.trim().slice(0, 120)}`);
      if (ANDAMIAJE.test(l)) andamiaje.push(`${r}:${n}: ${l.trim().slice(0, 140)}`);
      const sinEng = l
        .replace(/\\eng\{[^}]*\}/g, "")
        .replace(
          /\\(?:ac|acs|acl|acf|acp|texttt|url|href|label|ref|cite|parencite|textcite)\*?\{[^}]*\}/g,
          "",
        );
      const w = INGLES.exec(sinEng);
      if (w) ingles.push(`${r}:${n}: «${w[1]}» — ${l.trim().slice(0, 100)}`);
    }
  });
}

// Bibliografía: clave, tipo y campos de cada entrada.
const bibPath = path.join(root, "bibliography/references.bib");
const bib = fs.existsSync(bibPath) ? fs.readFileSync(bibPath, "utf8") : "";
const entradas = [];
for (const m of bib.matchAll(/^@(\w+)\{([^,\s]+),([\s\S]*?)(?=^@|\s*$(?![\s\S]))/gm)) {
  const cuerpo = m[3];
  entradas.push({
    clave: m[2],
    tipo: m[1].toLowerCase(),
    urldate: /\burldate\s*=/.test(cuerpo),
    url: /\burl\s*=/.test(cuerpo),
    autorCorporativoSinDoblesLlaves:
      /\bauthor\s*=\s*\{[^{}]*\b(Inc|S\.A\.|Ltd|Foundation|Organization|Organisation|Team|Project|Corporation|Company|Association|Institute|Universidad|University|Commission|Comisión)\b[^{}]*\}/.test(
        cuerpo,
      ),
  });
}
const definidas = new Set(entradas.map((e) => e.clave));
const acDefinidos = new Set();
const acPath = path.join(root, "frontmatter/acronyms.tex");
if (fs.existsSync(acPath))
  for (const m of fs.readFileSync(acPath, "utf8").matchAll(/\\acro\{([A-Za-z0-9]+)\}/g))
    acDefinidos.add(m[1]);

const lim = (a) => (a.length > TOPE ? a.slice(0, TOPE).concat([`… y ${a.length - TOPE} más`]) : a);
const salida = {
  resumen: {
    archivosTex: walk(root).length,
    citasDistintas: citadas.size,
    entradasBib: entradas.length,
    acronimosUsados: acUsados.size,
    acronimosDefinidos: acDefinidos.size,
    todonotes: todonotes.length,
    todosComentario: todos.length,
    labels: labels.size,
    refs: refs.size,
  },
  citadasSinDefinir: [...citadas].filter(([k]) => !definidas.has(k)).map(([k, d]) => `${k} (${d})`),
  definidasSinCitar: [...definidas].filter((k) => !citadas.has(k)),
  onlineSinUrldate: entradas.filter((e) => e.tipo === "online" && !e.urldate).map((e) => e.clave),
  conUrlSinUrldate: entradas
    .filter((e) => e.url && !e.urldate)
    .map((e) => `${e.clave} (@${e.tipo})`),
  autorCorporativoSinDoblesLlaves: entradas
    .filter((e) => e.autorCorporativoSinDoblesLlaves)
    .map((e) => e.clave),
  tiposBib: [...new Set(entradas.map((e) => e.tipo))],
  acUsadosSinDefinir: [...acUsados]
    .filter(([k]) => !acDefinidos.has(k))
    .map(([k, d]) => `${k} (${d})`),
  acDefinidosSinUsar: [...acDefinidos].filter((k) => !acUsados.has(k)),
  refsSinLabel: [...refs].filter(([k]) => !labels.has(k)).map(([k, d]) => `${k} (${d})`),
  labelsSinRef: [...labels].filter(([k]) => !refs.has(k)).map(([k, d]) => `${k} (${d})`),
  figuras,
  saltosManualesFueraDeMain: saltos,
  inputsDeMain: inputs,
  todonotes,
  todosComentario: todos,
  lineasConDosFrases: lim(dosFrases),
  andamiajeTemporal: lim(andamiaje),
  inglesSinEng: lim(ingles),
};
console.log(JSON.stringify(salida, null, 1));
