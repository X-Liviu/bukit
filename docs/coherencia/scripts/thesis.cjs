// Extracciones de la memoria (docs/thesis) para /coherencia: citas y claves del .bib,
// acrónimos, figuras, saltos de página manuales, \todonote, % TODO, etiquetas y
// referencias, orden de los \input de main.tex, líneas con más de una frase, frases de
// andamiaje temporal y términos en inglés sin \eng{}. Quita antes los comentarios %
// (en config/packages.tex hay citas de ejemplo comentadas que darían falsos positivos).
// Uso: node docs/coherencia/scripts/thesis.cjs [docs/thesis]
const fs = require("fs");
const path = require("path");

const root = process.argv[2] || "docs/thesis";
const LIMIT = 60;

function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return e.name === "build" ? [] : walk(path.join(d, e.name));
    return e.name.endsWith(".tex") ? [path.join(d, e.name)] : [];
  });
}
const rel = (f) => path.relative(process.cwd(), f).replace(/\\/g, "/");
const stripComment = (l) => l.replace(/(^|[^\\])%.*$/, "$1");

const reCite =
  /\\(parencite|textcite|autocite|cite|citeauthor|citeyear|citetitle|fullcite|nocite|Parencite|Textcite)\*?((?:\[[^\]]*\])*)\{([^}]*)\}/g;
const reAc = /\\(ac|acs|acl|acf|acp|acsp|aclp|acfp|Ac|Acp|acused)\{([A-Za-z0-9]+)\}/g;
const reGfx = /\\includegraphics(?:\[[^\]]*\])?\{([^}]*)\}/g;
const reBreak = /\\(newpage|clearpage|pagebreak)\b/g;
const reLabel = /\\label\{([^}]*)\}/g;
const reRef = /\\(?:ref|autoref|pageref|eqref|nameref|cref|Cref)\{([^}]*)\}/g;
const reInput = /\\(?:input|include)\{([^}]*)\}/g;
const reTodo = /\\todonote\{/;
const reTwoSentences = /[.!?]\s+[A-ZÁÉÍÓÚÑ¿¡]/;
const ABBREVIATIONS =
  /(?:p|ej|cap|caps|núm|fig|figs|tab|etc|vs|Dr|Sr|Sra|St|apdo|art|pág|págs|op|cit|cf|a\.m|p\.m)\.\s+[A-ZÁÉÍÓÚÑ¿¡]/;
const SCAFFOLDING =
  /\b(pendiente de|se describir[áa]n?|cuando se implemente|actualmente|a día de hoy|por ahora|todavía no|aún no|en el momento de escribir|en este momento|de momento|próximamente|más adelante se|se completará|se añadirá)\b/i;
const ENGLISH_TERMS =
  /\b(MoSCoW|stub|stubs|spike|grooming|deploy|pipeline|sprint|sprints|backlog|feature|features|framework|middleware|endpoint|endpoints|token|tokens|frontend|backend|commit|commits|branch|merge|refactor|bug|bugs|log|logs|placeholder|mock|mocks|hook|hooks|runner|build)\b/;

const citedKeys = new Map();
const usedAcronyms = new Map();
const graphics = [];
const pageBreaks = [];
const labels = new Map();
const refs = new Map();
const todonotes = [];
const todoComments = [];
const twoSentences = [];
const scaffolding = [];
const untaggedEnglish = [];
let inputs = [];

for (const f of walk(root)) {
  const r = rel(f);
  const lines = fs.readFileSync(f, "utf8").split("\n");
  const isMain = /(^|\/)main\.tex$/.test(r);
  const isProse = /\/(chapters|frontmatter|appendices)\//.test(r);
  lines.forEach((orig, i) => {
    const n = i + 1;
    if (/^\s*%\s*TODO/.test(orig)) todoComments.push(`${r}:${n}: ${orig.trim().slice(0, 140)}`);
    const l = stripComment(orig);
    if (!l.trim()) return;
    let m;
    while ((m = reCite.exec(l)))
      m[3].split(",").forEach((k) => citedKeys.set(k.trim(), `${r}:${n}`));
    while ((m = reAc.exec(l))) usedAcronyms.set(m[2], usedAcronyms.get(m[2]) || `${r}:${n}`);
    while ((m = reGfx.exec(l))) graphics.push(`${r}:${n}: ${m[1]}`);
    if (!isMain) while ((m = reBreak.exec(l))) pageBreaks.push(`${r}:${n}: \\${m[1]}`);
    while ((m = reLabel.exec(l))) labels.set(m[1], `${r}:${n}`);
    while ((m = reRef.exec(l))) refs.set(m[1], refs.get(m[1]) || `${r}:${n}`);
    if (isMain) while ((m = reInput.exec(l))) inputs.push(m[1]);
    if (reTodo.test(l)) todonotes.push(`${r}:${n}: ${l.trim().slice(0, 160)}`);
    if (isProse && !reTodo.test(l) && !/^\s*\\/.test(l)) {
      if (reTwoSentences.test(l) && !ABBREVIATIONS.test(l))
        twoSentences.push(`${r}:${n}: ${l.trim().slice(0, 120)}`);
      if (SCAFFOLDING.test(l)) scaffolding.push(`${r}:${n}: ${l.trim().slice(0, 140)}`);
      const withoutEng = l
        .replace(/\\eng\{[^}]*\}/g, "")
        .replace(
          /\\(?:ac|acs|acl|acf|acp|texttt|url|href|label|ref|cite|parencite|textcite)\*?\{[^}]*\}/g,
          "",
        );
      const w = ENGLISH_TERMS.exec(withoutEng);
      if (w) untaggedEnglish.push(`${r}:${n}: «${w[1]}» — ${l.trim().slice(0, 100)}`);
    }
  });
}

// Bibliografía: clave, tipo y campos de cada entrada.
const bibPath = path.join(root, "bibliography/references.bib");
const bib = fs.existsSync(bibPath) ? fs.readFileSync(bibPath, "utf8") : "";
const bibEntries = [];
for (const m of bib.matchAll(/^@(\w+)\{([^,\s]+),([\s\S]*?)(?=^@|\s*$(?![\s\S]))/gm)) {
  const body = m[3];
  bibEntries.push({
    key: m[2],
    type: m[1].toLowerCase(),
    urldate: /\burldate\s*=/.test(body),
    url: /\burl\s*=/.test(body),
    corporateAuthorWithoutDoubleBraces:
      /\bauthor\s*=\s*\{[^{}]*\b(Inc|S\.A\.|Ltd|Foundation|Organization|Organisation|Team|Project|Corporation|Company|Association|Institute|Universidad|University|Commission|Comisión)\b[^{}]*\}/.test(
        body,
      ),
  });
}
const definedKeys = new Set(bibEntries.map((e) => e.key));
const definedAcronyms = new Set();
const acronymsPath = path.join(root, "frontmatter/acronyms.tex");
if (fs.existsSync(acronymsPath))
  for (const m of fs.readFileSync(acronymsPath, "utf8").matchAll(/\\acro\{([A-Za-z0-9]+)\}/g))
    definedAcronyms.add(m[1]);

const cap = (a) =>
  a.length > LIMIT ? a.slice(0, LIMIT).concat([`… y ${a.length - LIMIT} más`]) : a;
const output = {
  summary: {
    texFiles: walk(root).length,
    distinctCitations: citedKeys.size,
    bibEntryCount: bibEntries.length,
    acronymsUsed: usedAcronyms.size,
    acronymsDefined: definedAcronyms.size,
    todonotes: todonotes.length,
    todoCommentLines: todoComments.length,
    labels: labels.size,
    refs: refs.size,
  },
  citedUndefined: [...citedKeys]
    .filter(([k]) => !definedKeys.has(k))
    .map(([k, d]) => `${k} (${d})`),
  definedUncited: [...definedKeys].filter((k) => !citedKeys.has(k)),
  onlineWithoutUrldate: bibEntries
    .filter((e) => e.type === "online" && !e.urldate)
    .map((e) => e.key),
  urlWithoutUrldate: bibEntries
    .filter((e) => e.url && !e.urldate)
    .map((e) => `${e.key} (@${e.type})`),
  corporateAuthorWithoutDoubleBraces: bibEntries
    .filter((e) => e.corporateAuthorWithoutDoubleBraces)
    .map((e) => e.key),
  bibTypes: [...new Set(bibEntries.map((e) => e.type))],
  usedUndefinedAcronyms: [...usedAcronyms]
    .filter(([k]) => !definedAcronyms.has(k))
    .map(([k, d]) => `${k} (${d})`),
  definedUnusedAcronyms: [...definedAcronyms].filter((k) => !usedAcronyms.has(k)),
  refsWithoutLabel: [...refs].filter(([k]) => !labels.has(k)).map(([k, d]) => `${k} (${d})`),
  unreferencedLabels: [...labels].filter(([k]) => !refs.has(k)).map(([k, d]) => `${k} (${d})`),
  graphics,
  manualBreaksOutsideMain: pageBreaks,
  mainInputs: inputs,
  todonotes,
  todoCommentLines: todoComments,
  linesWithTwoSentences: cap(twoSentences),
  temporalScaffolding: cap(scaffolding),
  englishWithoutEng: cap(untaggedEnglish),
};
console.log(JSON.stringify(output, null, 1));
