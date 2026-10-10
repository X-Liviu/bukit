// Inventario del dev-journal para /coherencia: por entrada, fecha, cabecera («Día N»),
// día de la semana escrito y calculado, sprint y fase, secciones presentes, horas
// registradas, decisiones y casillas; sumas de horas por sprint y fase; y anomalías
// (día de la semana equivocado, saltos en la numeración, entradas de más de 7 días
// con las horas sin rellenar).
// Uso: node docs/coherencia/scripts/journal.cjs [--today=YYYY-MM-DD] [docs/dev-journal]
const fs = require("fs");
const path = require("path");
const { info } = require("./calendar.cjs");

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
const daysSince = (f) => Math.round((Date.parse(today) - Date.parse(f)) / DAY_MS);

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
    planning: sections.some((s) => /^Planificación de la semana/i.test(s)),
    retrospective: sections.some((s) => /^Retrospectiva/i.test(s)),
    riskReview: sections.some((s) => /^Revisión de riesgos/i.test(s)),
    hours,
    hoursText: hoursLine.trim().slice(0, 80),
    decisions: (text.match(/decisi[óo]n(?:es)? del autor/gi) || []).length,
    discardedAlternatives: (text.match(/_Alternativas? descartadas?_/g) || []).length,
    checkboxes: {
      done: (text.match(/- \[x\]/gi) || []).length,
      pending: (text.match(/- \[ \]/g) || []).length,
    },
    hoursLineCount: lines.filter((l) => /\*\*Horas invertidas:\*\*/.test(l)).length,
  });
}

const anomalies = [];
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
  if (e.computedWeekday === "lunes" && !e.planning && e.date >= "2026-10-05")
    anomalies.push(`${e.file}: entrada de lunes sin «Planificación de la semana»`);
  if (e.computedWeekday === "domingo" && !e.retrospective && e.date >= "2026-10-05")
    anomalies.push(`${e.file}: entrada de domingo sin «Retrospectiva»`);
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
      lastEntry: entries.length ? entries[entries.length - 1].file : null,
      anomalies,
    },
    null,
    1,
  ),
);
