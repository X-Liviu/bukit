// Día de la semana, sprint y fase de una o varias fechas (YYYY-MM-DD o DD-MM-YYYY;
// sin argumentos, hoy). Lo usa /coherencia para calcular fechas en vez de copiarlas.
// Calendario del cap. 10: S0 = 14 a 19-07-2026; S1 empieza el 20-07-2026; sin sprints
// en las pausas 31-08 → 04-10-2026 y 25-01 → 31-01-2027; S7 empieza el 05-10-2026;
// S23 el 01-02-2027; S31 el 29-03-2027; S37 termina el 16-05-2027. Las fechas
// anteriores al 14-07-2026 (el «Día 0» del diario) cuentan como «pre-S0», fase F0.
// Todo se calcula en UTC para que el resultado no dependa de la zona horaria del equipo.
const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const SEGMENTS = [
  ["2026-07-20", 1, 6, "F1"],
  ["2026-10-05", 7, 22, "F2"],
  ["2027-02-01", 23, 30, "F3"],
  ["2027-03-29", 31, 37, "F4"],
];
const DAY_MS = 864e5;

function normalize(s) {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
}
function utc(s) {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}
function iso(t) {
  return new Date(t).toISOString().slice(0, 10);
}

function info(input) {
  const date = normalize(input);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { date: input, error: "formato no reconocido" };
  const t = utc(date);
  // Date.UTC «desborda» las fechas imposibles (31-02 → 03-03): se rechazan explícitamente.
  if (Number.isNaN(t) || iso(t) !== date) return { date: input, error: "fecha imposible" };
  const weekday = WEEKDAYS[new Date(t).getUTCDay()];
  if (t < utc("2026-07-14")) return { date, weekday, sprint: "pre-S0", phase: "F0" };
  if (t <= utc("2026-07-19")) {
    return {
      date,
      weekday,
      sprint: "S0",
      phase: "F0",
      sprintStart: "2026-07-14",
      sprintEnd: "2026-07-19",
    };
  }
  for (const [ini, a, b, phase] of SEGMENTS) {
    const n = Math.floor((t - utc(ini)) / DAY_MS / 7);
    if (n >= 0 && a + n <= b) {
      const start = utc(ini) + n * 7 * DAY_MS;
      return {
        date,
        weekday,
        sprint: `S${a + n}`,
        phase,
        sprintStart: iso(start),
        sprintEnd: iso(start + 6 * DAY_MS),
      };
    }
  }
  return { date, weekday, sprint: "pausa", phase: "pausa" };
}

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const res = (args.length ? args : [localToday()]).map(info);
  console.log(JSON.stringify(res.length === 1 ? res[0] : res, null, 1));
}
module.exports = { info, normalize, localToday };
