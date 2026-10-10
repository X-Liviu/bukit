// Versiones reales del repositorio y de la máquina, para la lente «versiones» de /coherencia:
// dependencias de cada package.json, dependencias compartidas con versiones distintas,
// specifiers del lockfile frente a los package.json, versiones de Node fijadas en cada sitio,
// acciones de la CI, imagen de Postgres y etiquetas, y las herramientas instaladas en el
// equipo (lo que falle o no esté se marca como «no disponible», no es un error).
// Uso: node docs/coherencia/scripts/versiones.cjs   (desde la raíz del repositorio)
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const leer = (p) => (fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null);
const leerJson = (p) => {
  const t = leer(p);
  return t ? JSON.parse(t) : null;
};

// 1. package.json de cada paquete del workspace.
const paquetes = [
  "package.json",
  "apps/api/package.json",
  "packages/core/package.json",
  "packages/api-client/package.json",
  "packages/ui-core/package.json",
  "e2e/package.json",
];
const porPaquete = {};
for (const p of paquetes) {
  const j = leerJson(p);
  if (!j) continue;
  porPaquete[p] = {
    name: j.name,
    packageManager: j.packageManager,
    engines: j.engines,
    volta: j.volta,
    dependencies: j.dependencies || {},
    devDependencies: j.devDependencies || {},
  };
}
const porDependencia = {};
for (const [p, j] of Object.entries(porPaquete)) {
  for (const [d, v] of Object.entries({ ...j.dependencies, ...j.devDependencies })) {
    (porDependencia[d] = porDependencia[d] || {})[p] = v;
  }
}
const compartidasConVersionesDistintas = Object.entries(porDependencia)
  .filter(
    ([, m]) =>
      Object.keys(m).length > 1 &&
      new Set(Object.values(m).filter((v) => !v.startsWith("workspace:"))).size > 1,
  )
  .map(([d, m]) => ({ dependencia: d, versiones: m }));

// 2. Specifiers de la sección importers del lockfile (sin librería YAML: indentación fija de pnpm).
const lock = leer("pnpm-lock.yaml") || "";
const importers = {};
{
  let enImporters = false;
  let importer = null;
  let dep = null;
  for (const l of lock.split("\n")) {
    if (/^importers:/.test(l)) {
      enImporters = true;
      continue;
    }
    if (enImporters && /^[^\s]/.test(l)) enImporters = false;
    if (!enImporters) continue;
    let m;
    if ((m = /^ {2}([^\s].*):$/.exec(l))) importer = m[1].replace(/^'|'$/g, "");
    else if ((m = /^ {6}([^\s].*):$/.exec(l))) dep = m[1].replace(/^'|'$/g, "");
    else if ((m = /^ {8}specifier: (.*)$/.exec(l)) && importer && dep) {
      (importers[importer] = importers[importer] || {})[dep] = m[1].trim();
    }
  }
}
const rutaImporter = (p) => (p === "package.json" ? "." : path.dirname(p));
const lockDesincronizado = [];
for (const [p, j] of Object.entries(porPaquete)) {
  const esperado = { ...j.dependencies, ...j.devDependencies };
  const enLock = importers[rutaImporter(p)] || {};
  for (const [d, v] of Object.entries(esperado)) {
    if (enLock[d] !== v)
      lockDesincronizado.push({
        paquete: p,
        dependencia: d,
        packageJson: v,
        lockfile: enLock[d] || "ausente",
      });
  }
  for (const d of Object.keys(enLock))
    if (!(d in esperado))
      lockDesincronizado.push({
        paquete: p,
        dependencia: d,
        packageJson: "ausente",
        lockfile: enLock[d],
      });
}

// 3. Node fijado en cada sitio y acciones de la CI.
const buscar = (p, re) => {
  const t = leer(p);
  return t ? [...t.matchAll(re)].map((m) => m[1]) : [];
};
const node = {
  "package.json (volta)":
    porPaquete["package.json"] && porPaquete["package.json"].volta
      ? porPaquete["package.json"].volta.node
      : null,
  "package.json (engines)":
    porPaquete["package.json"] && porPaquete["package.json"].engines
      ? porPaquete["package.json"].engines.node
      : null,
  ".nvmrc": (leer(".nvmrc") || "").trim() || null,
  ".github/actions/setup/action.yml": buscar(
    ".github/actions/setup/action.yml",
    /node-version:\s*"?([^"\n]+)"?/g,
  ),
  "apps/api/Dockerfile (FROM)": buscar("apps/api/Dockerfile", /^FROM\s+node:([^\s]+)/gm),
};
const acciones = {
  ".github/workflows/ci.yml": buscar(".github/workflows/ci.yml", /uses:\s*([^\s]+@[^\s]+)/g),
  ".github/actions/setup/action.yml": buscar(
    ".github/actions/setup/action.yml",
    /uses:\s*([^\s]+@[^\s]+)/g,
  ),
};
const postgres = {
  "docker/postgres/Dockerfile (FROM)": buscar("docker/postgres/Dockerfile", /^FROM\s+([^\s]+)/gm),
  "docker/postgres/Dockerfile (ARG)": buscar("docker/postgres/Dockerfile", /^ARG\s+([^\s]+)/gm),
  "docker-compose.yml (image)": buscar("docker-compose.yml", /^\s*image:\s*([^\s]+)/gm),
  "ci.yml (tags)": buscar(".github/workflows/ci.yml", /^\s*tags:\s*([^\s]+)/gm),
};

// 4. Herramientas de la máquina (primera línea de salida; errores → «no disponible»).
const ordenes = {
  node: "node --version",
  "node (ruta)": process.platform === "win32" ? "where node" : "which -a node",
  volta: "volta --version",
  pnpm: "pnpm --version",
  git: "git --version",
  gh: "gh --version",
  docker: "docker --version",
  "docker compose": "docker compose version",
  pdflatex: "pdflatex --version",
  biber: "biber --version",
  graphify: "graphify --version",
};
const maquina = {};
for (const [k, cmd] of Object.entries(ordenes)) {
  try {
    maquina[k] = execSync(cmd, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 20000,
    })
      .split(/\r?\n/)[0]
      .trim();
  } catch {
    maquina[k] = "no disponible";
  }
}
const hookPostCommit = leer(".git/hooks/post-commit");
maquina["git hook post-commit con graphify"] = hookPostCommit
  ? /graphify/.test(hookPostCommit)
  : false;
maquina["~/.local/bin/graphify.cmd"] = fs.existsSync(
  path.join(os.homedir(), ".local", "bin", "graphify.cmd"),
);

console.log(
  JSON.stringify(
    {
      porPaquete,
      compartidasConVersionesDistintas,
      lockDesincronizado,
      node,
      acciones,
      postgres,
      maquina,
    },
    null,
    1,
  ),
);
