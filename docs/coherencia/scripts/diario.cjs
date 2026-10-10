// Inventario del dev-journal para /coherencia: por entrada, fecha, cabecera («Día N»),
// día de la semana escrito y calculado, sprint y fase, secciones presentes, horas
// registradas, decisiones y casillas; sumas de horas por sprint y fase; y anomalías
// (día de la semana equivocado, saltos en la numeración, entradas de más de 7 días
// con las horas sin rellenar).
// Uso: node docs/coherencia/scripts/diario.cjs [--hoy=YYYY-MM-DD] [docs/dev-journal]
const fs = require("fs");
const path = require("path");
const { info } = require("./fecha.cjs");

let hoy = null;
let dir = "docs/dev-journal";
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--hoy=")) hoy = a.slice(6);
  else dir = a;
}
if (!hoy) {
  const d = new Date();
  hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const DIA_MS = 864e5;
const diasDesde = (f) => Math.round((Date.parse(hoy) - Date.parse(f)) / DIA_MS);

const entradas = [];
// Orden cronológico real: el nombre es DD-MM-YYYY, así que ordenar por nombre no sirve.
const clave = (n) => n.slice(6, 10) + n.slice(3, 5) + n.slice(0, 2) + n;
const nombres = fs
  .readdirSync(dir)
  .filter((n) => /^\d{2}-\d{2}-\d{4}(-[a-z])?\.md$/.test(n))
  .sort((p, q) => clave(p).localeCompare(clave(q)));
for (const nombre of nombres) {
  const m = /^(\d{2})-(\d{2})-(\d{4})(-[a-z])?\.md$/.exec(nombre);
  if (!m) continue;
  const fecha = `${m[3]}-${m[2]}-${m[1]}`;
  const texto = fs.readFileSync(path.join(dir, nombre), "utf8");
  const lineas = texto.split("\n");
  const cabecera = lineas[0] || "";
  const dia = /Día\s+(\d+)/.exec(cabecera);
  const sesionB = /sesión\s+([a-z])/i.exec(cabecera);
  const diaEscrito =
    (/-\s*([A-Za-zÁÉÍÓÚáéíóú]+),\s*\d{2}-\d{2}-\d{4}/.exec(cabecera) || [])[1] || null;
  const calc = info(fecha);
  const secciones = lineas
    .filter((l) => /^##\s/.test(l))
    .map((l) => l.replace(/^##\s+/, "").trim());
  const horasLinea = lineas.find((l) => /\*\*Horas invertidas:\*\*/.test(l)) || "";
  const valor = horasLinea.replace(/\*\*Horas invertidas:\*\*/, "").trim();
  // Solo se interpreta la cifra si va al principio del valor («2,5 h», «1h 30 min»,
  // «45 min», «≈1 h (…)»); «sin cómputo» cuenta 0. Un texto libre («30 min entre ambas
  // sesiones (derivado de…)») o «X h» quedan como null y la lente lee horasTexto.
  const mh = /^[≈~]?\s*(?:(\d+(?:[.,]\d+)?)\s*h(?:oras)?\b)?\s*(?:(\d+)\s*min\b)?/.exec(valor);
  const sinComputo = /^sin c[óo]mputo/i.test(valor);
  const resto = mh ? valor.slice(mh[0].length).trim() : valor;
  const limpio = resto === "" || resto.startsWith("(");
  const horas =
    mh && (mh[1] || mh[2]) && limpio
      ? Math.round(
          ((mh[1] ? Number(mh[1].replace(",", ".")) : 0) + (mh[2] ? Number(mh[2]) / 60 : 0)) * 100,
        ) / 100
      : sinComputo
        ? 0
        : null;
  entradas.push({
    archivo: `${dir}/${nombre}`,
    fecha,
    diaN: dia ? Number(dia[1]) : null,
    sesion: sesionB ? sesionB[1] : null,
    cabecera: cabecera.slice(0, 80),
    diaSemanaEscrito: diaEscrito,
    diaSemanaCalculado: calc.diaSemana,
    sprint: calc.sprint,
    fase: calc.fase,
    secciones,
    planificacion: secciones.some((s) => /^Planificación de la semana/i.test(s)),
    retrospectiva: secciones.some((s) => /^Retrospectiva/i.test(s)),
    revisionRiesgos: secciones.some((s) => /^Revisión de riesgos/i.test(s)),
    horas,
    horasTexto: horasLinea.trim().slice(0, 80),
    decisiones: (texto.match(/decisi[óo]n(?:es)? del autor/gi) || []).length,
    alternativasDescartadas: (texto.match(/_Alternativas? descartadas?_/g) || []).length,
    casillas: {
      hechas: (texto.match(/- \[x\]/gi) || []).length,
      pendientes: (texto.match(/- \[ \]/g) || []).length,
    },
    lineasHorasInvertidas: lineas.filter((l) => /\*\*Horas invertidas:\*\*/.test(l)).length,
  });
}

const anomalias = [];
let anterior = null;
for (const e of entradas) {
  if (e.diaSemanaEscrito && e.diaSemanaEscrito.toLowerCase() !== e.diaSemanaCalculado) {
    anomalias.push(
      `${e.archivo}: la cabecera dice «${e.diaSemanaEscrito}» y el ${e.fecha} fue ${e.diaSemanaCalculado}`,
    );
  }
  if (e.diaN === null) anomalias.push(`${e.archivo}: la cabecera no tiene «Día N»`);
  else if (anterior !== null && !e.sesion && e.diaN !== anterior + 1) {
    anomalias.push(
      `${e.archivo}: «Día ${e.diaN}» tras «Día ${anterior}» (se esperaba ${anterior + 1})`,
    );
  }
  if (!e.sesion && e.diaN !== null) anterior = e.diaN;
  if (e.horas === null && diasDesde(e.fecha) > 7)
    anomalias.push(`${e.archivo}: horas sin rellenar (${e.horasTexto || "sin línea"})`);
  if (e.lineasHorasInvertidas !== 1)
    anomalias.push(`${e.archivo}: ${e.lineasHorasInvertidas} líneas de «Horas invertidas»`);
  if (e.diaSemanaCalculado === "lunes" && !e.planificacion && e.fecha >= "2026-10-05")
    anomalias.push(`${e.archivo}: entrada de lunes sin «Planificación de la semana»`);
  if (e.diaSemanaCalculado === "domingo" && !e.retrospectiva && e.fecha >= "2026-10-05")
    anomalias.push(`${e.archivo}: entrada de domingo sin «Retrospectiva»`);
}
const suma = (clave) => {
  const acc = {};
  for (const e of entradas)
    if (e.horas !== null) acc[e[clave]] = Math.round(((acc[e[clave]] || 0) + e.horas) * 10) / 10;
  return acc;
};
console.log(
  JSON.stringify(
    {
      hoy,
      entradas,
      horasPorSprint: suma("sprint"),
      horasPorFase: suma("fase"),
      ultimaEntrada: entradas.length ? entradas[entradas.length - 1].archivo : null,
      anomalias,
    },
    null,
    1,
  ),
);
