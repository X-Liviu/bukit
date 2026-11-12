// Inventario del dev-journal para /coherencia: por entrada, fecha, cabecera («Día N»),
// día de la semana escrito y calculado, sprint y fase, secciones presentes, horas
// registradas, decisiones y casillas; sumas de horas por sprint y fase; y anomalías
// (día de la semana equivocado, saltos en la numeración, entradas de más de 7 días
// con las horas sin rellenar, entradas que pasan del límite de extensión, sprints
// cerrados sin planificación en ninguna entrada y semanas declaradas a cero cuando
// ya habían empezado).
// Uso: node docs/coherencia/scripts/journal.cjs [--today=YYYY-MM-DD] [docs/dev-journal]
const fs = require("fs");
const path = require("path");
const { info, WORK_BLOCKS_SINCE } = require("./calendar.cjs");

let today = null;
let dir = "docs/dev-journal";
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--today=")) today = a.slice(8);
  else dir = a;
}
if (!today) {
  const d = new Date();
  today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const DAY_MS = 864e5;
// Límite de extensión del README del diario (regla del autor del 11-10-2026):
// 10 minutos de lectura como máximo. Se cuenta como `wc -w` y solo desde esa
// fecha: las entradas anteriores son históricas y no se reescriben.
const MAX_WORDS = 1800;
const MAX_WORDS_SINCE = "2026-10-11";
const daysSince = (f) => Math.round((Date.parse(today) - Date.parse(f)) / DAY_MS);
// Semana a cero (README del diario, regla del autor del 17-10-2026): se declara antes
// de empezar, con una línea «Sx: semana a cero (0 h)» en la entrada anterior. Ese
// sprint no lleva planificación ni retrospectiva propias, así que no se avisa de su
// ausencia; una declaración hecha ya dentro de la semana no vale (es un parón, R10).
const ZERO_WEEK = /\bS(\d{1,2}):\s*semana a cero/gi;

// Desde WORK_BLOCKS_SINCE el sprint es una tanda de trabajo: su número sale de la
// cabecera «Planificación (Sx…)» más reciente del diario, no de la fecha. La primera
// tanda es el S12 (el S10 se declaró a cero y el S11 no tuvo sesiones).
let currentBlock = "S12";
const entries = [];
// Orden cronológico real: el nombre es DD-MM-YYYY, así que ordenar por nombre no sirve.
const sortKey = (n) => n.slice(6, 10) + n.slice(3, 5) + n.slice(0, 2) + n;
const fileNames = fs
  .readdirSync(dir)
  .filter((n) => /^\d{2}-\d{2}-\d{4}(-[a-z])?\.md$/.test(n))
  .sort((p, q) => sortKey(p).localeCompare(sortKey(q)));
for (const fileName of fileNames) {
  const m = /^(\d{2})-(\d{2})-(\d{4})(-[a-z])?\.md$/.exec(fileName);
  if (!m) continue;
  const date = `${m[3]}-${m[2]}-${m[1]}`;
  const text = fs.readFileSync(path.join(dir, fileName), "utf8");
  const lines = text.split("\n");
  const header = lines[0] || "";
  const dayMatch = /Día\s+(\d+)/.exec(header);
  const sessionMatch = /sesión\s+([a-z])/i.exec(header);
  const writtenDay =
    (/-\s*([A-Za-zÁÉÍÓÚáéíóú]+),\s*\d{2}-\d{2}-\d{4}/.exec(header) || [])[1] || null;
  const calc = info(date);
  if (date >= WORK_BLOCKS_SINCE) {
    const block = /^## Planificación[^\n(]*\((S\d+)/m.exec(text);
    if (block) currentBlock = block[1];
    calc.sprint = currentBlock;
  }
  const sections = lines.filter((l) => /^##\s/.test(l)).map((l) => l.replace(/^##\s+/, "").trim());
  const hoursLine = lines.find((l) => /\*\*Horas invertidas:\*\*/.test(l)) || "";
  const value = hoursLine.replace(/\*\*Horas invertidas:\*\*/, "").trim();
  // Solo se interpreta la cifra si va al principio del valor («2,5 h», «1h 30 min»,
  // «45 min», «≈1 h (…)»); «sin cómputo» cuenta 0. Un texto libre («30 min entre ambas
  // sesiones (derivado de…)») o «X h» quedan como null y la lente lee horasTexto.
  const mh = /^[≈~]?\s*(?:(\d+(?:[.,]\d+)?)\s*h(?:oras)?\b)?\s*(?:(\d+)\s*min\b)?/.exec(value);
  const notCounted = /^sin c[óo]mputo/i.test(value);
  const rest = mh ? value.slice(mh[0].length).trim() : value;
  const clean = rest === "" || rest.startsWith("(");
  const hours =
    mh && (mh[1] || mh[2]) && clean
      ? Math.round(
          ((mh[1] ? Number(mh[1].replace(",", ".")) : 0) + (mh[2] ? Number(mh[2]) / 60 : 0)) * 100,
        ) / 100
      : notCounted
        ? 0
        : null;
  entries.push({
    file: `${dir}/${fileName}`,
    date,
    dayNumber: dayMatch ? Number(dayMatch[1]) : null,
    session: sessionMatch ? sessionMatch[1] : null,
    header: header.slice(0, 80),
    writtenWeekday: writtenDay,
    computedWeekday: calc.weekday,
    sprint: calc.sprint,
    phase: calc.phase,
    sections,
    planning: sections.some((s) => /^Planificación/i.test(s)),
    retrospective: sections.some((s) => /^Retrospectiva/i.test(s)),
    monthlyControl: sections.some((s) => /^Control mensual/i.test(s)),
    riskReview: sections.some((s) => /^Revisión de riesgos/i.test(s)),
    zeroWeeksDeclared: [...text.matchAll(ZERO_WEEK)].map((z) => `S${z[1]}`),
    hours,
    hoursText: hoursLine.trim().slice(0, 80),
    decisions: (text.match(/decisi[óo]n(?:es)? del autor/gi) || []).length,
    discardedAlternatives: (text.match(/_Alternativas? descartadas?_/g) || []).length,
    checkboxes: {
      done: (text.match(/- \[x\]/gi) || []).length,
      pending: (text.match(/- \[ \]/g) || []).length,
    },
    hoursLineCount: lines.filter((l) => /\*\*Horas invertidas:\*\*/.test(l)).length,
    words: text.split(/\s+/).filter(Boolean).length,
  });
}

const anomalies = [];
// Solo cuentan las semanas a cero declaradas desde un sprint anterior (o desde una
// pausa); la que se declara desde el propio sprint se avisa y no exime de nada.
const zeroWeeks = new Set();
for (const e of entries) {
  const own = /^S(\d+)$/.exec(e.sprint || "");
  for (const declared of e.zeroWeeksDeclared) {
    if (own && Number(own[1]) >= Number(declared.slice(1)))
      anomalies.push(
        `${e.file}: ${declared} declarada a cero cuando ya había empezado; cuenta como parón (R10), no como semana a cero`,
      );
    else zeroWeeks.add(declared);
  }
}
let previous = null;
for (const e of entries) {
  if (e.writtenWeekday && e.writtenWeekday.toLowerCase() !== e.computedWeekday) {
    anomalies.push(
      `${e.file}: la cabecera dice «${e.writtenWeekday}» y el ${e.date} fue ${e.computedWeekday}`,
    );
  }
  if (e.dayNumber === null) anomalies.push(`${e.file}: la cabecera no tiene «Día N»`);
  else if (previous !== null && !e.session && e.dayNumber !== previous + 1) {
    anomalies.push(
      `${e.file}: «Día ${e.dayNumber}» tras «Día ${previous}» (se esperaba ${previous + 1})`,
    );
  }
  if (!e.session && e.dayNumber !== null) previous = e.dayNumber;
  if (e.hours === null && daysSince(e.date) > 7)
    anomalies.push(`${e.file}: horas sin rellenar (${e.hoursText || "sin línea"})`);
  if (e.hoursLineCount !== 1)
    anomalies.push(`${e.file}: ${e.hoursLineCount} líneas de «Horas invertidas»`);
  if (
    e.computedWeekday === "domingo" &&
    !e.retrospective &&
    e.date >= "2026-10-05" &&
    // Desde el método sin semanas no hay retrospectiva dominical.
    e.date < WORK_BLOCKS_SINCE &&
    !zeroWeeks.has(e.sprint)
  )
    anomalies.push(`${e.file}: entrada de domingo sin «Retrospectiva»`);
  if (e.words > MAX_WORDS && e.date >= MAX_WORDS_SINCE)
    anomalies.push(`${e.file}: ${e.words} palabras, por encima del límite de ${MAX_WORDS}`);
}
// La planificación vale cualquier día de la semana (regla del autor del 15-10-2026):
// solo se avisa cuando un sprint ya cerrado no la tiene en ninguna de sus entradas,
// salvo que se hubiera declarado a cero.
const sprintPlanning = new Map();
for (const e of entries) {
  if (e.date < "2026-10-05" || e.date >= WORK_BLOCKS_SINCE || !/^S[0-9]+$/.test(e.sprint || ""))
    continue;
  const s = sprintPlanning.get(e.sprint) || { planned: false, end: info(e.date).sprintEnd };
  s.planned = s.planned || e.planning || zeroWeeks.has(e.sprint);
  sprintPlanning.set(e.sprint, s);
}
for (const [sprint, s] of sprintPlanning) {
  if (!s.planned && s.end && s.end < today)
    anomalies.push(`${sprint}: sprint cerrado sin «Planificación de la semana» en ninguna entrada`);
}
const sumBy = (sortKey) => {
  const acc = {};
  for (const e of entries)
    if (e.hours !== null)
      acc[e[sortKey]] = Math.round(((acc[e[sortKey]] || 0) + e.hours) * 10) / 10;
  return acc;
};
console.log(
  JSON.stringify(
    {
      today,
      entries,
      hoursBySprint: sumBy("sprint"),
      hoursByPhase: sumBy("phase"),
      zeroWeeks: [...zeroWeeks],
      lastEntry: entries.length ? entries[entries.length - 1].file : null,
      anomalies,
    },
    null,
    1,
  ),
);
