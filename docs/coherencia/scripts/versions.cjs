// Versiones reales del repositorio y de la máquina, para la lente «versiones» de /coherencia:
// dependencias de cada package.json, dependencias compartidas con versiones distintas,
// specifiers del lockfile frente a los package.json, versiones de Node fijadas en cada sitio,
// acciones de la CI, imagen de Postgres y etiquetas, y las herramientas instaladas en el
// equipo (lo que falle o no esté se marca como «no disponible», no es un error).
// Uso: node docs/coherencia/scripts/versions.cjs   (desde la raíz del repositorio)
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const readText = (p) => (fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null);
const readJson = (p) => {
  const t = readText(p);
  return t ? JSON.parse(t) : null;
};

// 1. package.json de cada paquete del workspace.
const packageFiles = [
  "package.json",
  "apps/api/package.json",
  "packages/core/package.json",
  "packages/api-client/package.json",
  "packages/ui-core/package.json",
  "e2e/package.json",
];
const byPackage = {};
for (const p of packageFiles) {
  const j = readJson(p);
  if (!j) continue;
  byPackage[p] = {
    name: j.name,
    packageManager: j.packageManager,
    engines: j.engines,
    volta: j.volta,
    dependencies: j.dependencies || {},
    devDependencies: j.devDependencies || {},
  };
}
const byDependency = {};
for (const [p, j] of Object.entries(byPackage)) {
  for (const [d, v] of Object.entries({ ...j.dependencies, ...j.devDependencies })) {
    (byDependency[d] = byDependency[d] || {})[p] = v;
  }
}
const sharedWithDifferentVersions = Object.entries(byDependency)
  .filter(
    ([, m]) =>
      Object.keys(m).length > 1 &&
      new Set(Object.values(m).filter((v) => !v.startsWith("workspace:"))).size > 1,
  )
  .map(([d, m]) => ({ dependency: d, versions: m }));

// 2. Specifiers de la sección importers del lockfile (sin librería YAML: indentación fija de pnpm).
const lock = readText("pnpm-lock.yaml") || "";
const importers = {};
{
  let inImporters = false;
  let importer = null;
  let dep = null;
  for (const l of lock.split("\n")) {
    if (/^importers:/.test(l)) {
      inImporters = true;
      continue;
    }
    if (inImporters && /^[^\s]/.test(l)) inImporters = false;
    if (!inImporters) continue;
    let m;
    if ((m = /^ {2}([^\s].*):$/.exec(l))) importer = m[1].replace(/^'|'$/g, "");
    else if ((m = /^ {6}([^\s].*):$/.exec(l))) dep = m[1].replace(/^'|'$/g, "");
    else if ((m = /^ {8}specifier: (.*)$/.exec(l)) && importer && dep) {
      (importers[importer] = importers[importer] || {})[dep] = m[1].trim();
    }
  }
}
const importerPath = (p) => (p === "package.json" ? "." : path.dirname(p));
const lockOutOfSync = [];
for (const [p, j] of Object.entries(byPackage)) {
  const expected = { ...j.dependencies, ...j.devDependencies };
  const inLock = importers[importerPath(p)] || {};
  for (const [d, v] of Object.entries(expected)) {
    if (inLock[d] !== v)
      lockOutOfSync.push({
        pkg: p,
        dependency: d,
        packageJson: v,
        lockfile: inLock[d] || "ausente",
      });
  }
  for (const d of Object.keys(inLock))
    if (!(d in expected))
      lockOutOfSync.push({
        pkg: p,
        dependency: d,
        packageJson: "ausente",
        lockfile: inLock[d],
      });
}

// 3. Node fijado en cada sitio y acciones de la CI.
const findAll = (p, re) => {
  const t = readText(p);
  return t ? [...t.matchAll(re)].map((m) => m[1]) : [];
};
const node = {
  "package.json (volta)":
    byPackage["package.json"] && byPackage["package.json"].volta
      ? byPackage["package.json"].volta.node
      : null,
  "package.json (engines)":
    byPackage["package.json"] && byPackage["package.json"].engines
      ? byPackage["package.json"].engines.node
      : null,
  ".nvmrc": (readText(".nvmrc") || "").trim() || null,
  ".github/actions/setup/action.yml": findAll(
    ".github/actions/setup/action.yml",
    /node-version:\s*"?([^"\n]+)"?/g,
  ),
  "apps/api/Dockerfile (FROM)": findAll("apps/api/Dockerfile", /^FROM\s+node:([^\s]+)/gm),
};
const actions = {
  ".github/workflows/ci.yml": findAll(".github/workflows/ci.yml", /uses:\s*([^\s]+@[^\s]+)/g),
  ".github/actions/setup/action.yml": findAll(
    ".github/actions/setup/action.yml",
    /uses:\s*([^\s]+@[^\s]+)/g,
  ),
};
const postgres = {
  "docker/postgres/Dockerfile (FROM)": findAll("docker/postgres/Dockerfile", /^FROM\s+([^\s]+)/gm),
  "docker/postgres/Dockerfile (ARG)": findAll("docker/postgres/Dockerfile", /^ARG\s+([^\s]+)/gm),
  "docker-compose.yml (image)": findAll("docker-compose.yml", /^\s*image:\s*([^\s]+)/gm),
  "ci.yml (tags)": findAll(".github/workflows/ci.yml", /^\s*tags:\s*([^\s]+)/gm),
};

// 4. Herramientas de la máquina (primera línea de salida; errores → «no disponible»).
const commands = {
  node: "node --version",
  "node (path)": process.platform === "win32" ? "where node" : "which -a node",
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
const machine = {};
for (const [k, cmd] of Object.entries(commands)) {
  try {
    machine[k] = execSync(cmd, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 20000,
    })
      .split(/\r?\n/)[0]
      .trim();
  } catch {
    machine[k] = "no disponible";
  }
}
const hookPostCommit = readText(".git/hooks/post-commit");
machine["git post-commit hook with graphify"] = hookPostCommit
  ? /graphify/.test(hookPostCommit)
  : false;
machine["~/.local/bin/graphify.cmd"] = fs.existsSync(
  path.join(os.homedir(), ".local", "bin", "graphify.cmd"),
);

console.log(
  JSON.stringify(
    {
      byPackage,
      sharedWithDifferentVersions,
      lockOutOfSync,
      node,
      actions,
      postgres,
      machine,
    },
    null,
    1,
  ),
);
