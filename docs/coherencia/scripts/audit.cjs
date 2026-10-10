// Resume la salida JSON de `pnpm audit --json` (por la entrada estándar): recuento por
// severidad y lista de paquetes afectados con sus versiones vulnerables y parcheadas.
// Uso: pnpm audit --prod --json | node docs/coherencia/scripts/audit.cjs
//   Ojo: `pnpm audit` sale con código 1 cuando hay vulnerabilidades; no es un fallo.
let s = "";
process.stdin.on("data", (d) => (s += d));
process.stdin.on("end", () => {
  let j;
  try {
    j = JSON.parse(s);
  } catch {
    console.log(
      JSON.stringify({ error: "la entrada no es JSON de pnpm audit", head: s.slice(0, 200) }),
    );
    return;
  }
  const advisoryList = Object.values(j.advisories || {}).map((v) => ({
    pkg: v.module_name,
    level: v.severity,
    vulnerable: v.vulnerable_versions,
    patched: v.patched_versions,
    summary: v.title,
    dependencyPaths: (v.findings || []).flatMap((f) => f.paths || []).slice(0, 3),
  }));
  console.log(
    JSON.stringify(
      { bySeverity: j.metadata ? j.metadata.vulnerabilities : null, advisoryList },
      null,
      1,
    ),
  );
});
