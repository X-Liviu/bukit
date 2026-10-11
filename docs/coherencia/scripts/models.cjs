// Comprueba qué modelos respondieron de verdad en una ejecución de /coherencia
// (decisión del autor del 11-10-2026). El modelo de cada lente lo fija la
// configuración (perfil y .claude/agents/), y este script lo demuestra con los
// registros de la sesión que Claude Code guarda en ~/.claude/projects/. Solo
// lee el nombre del modelo y el tipo de agente de cada respuesta, nunca su
// contenido.
//
// Lo ejecuta el autor en una sesión normal, no el propio comando: el perfil
// .claude/coherencia.settings.json deniega leer ~/.claude a propósito.
//
// Uso: node docs/coherencia/scripts/models.cjs [--session=<id>] [--allow=claude-haiku-5-5,claude-sonnet-5-5]
// Sin --session toma la sesión más reciente en la que el autor escribió
// /coherencia. Sale con código 1 si alguna respuesta vino de un modelo que no
// está en --allow, y con código 2 si no encuentra la sesión.

const fs = require("fs");
const os = require("os");
const path = require("path");

const NEWLINE = String.fromCharCode(10);
const COMMAND_MARKER = "<command-name>/coherencia</command-name>";

// Un fallo de uso (sesión inexistente, carpeta sin registros) se explica en una
// línea, sin la traza de Node.
function fail(message) {
  console.error(message);
  process.exit(2);
}

function option(name, fallback) {
  const prefix = `--${name}=`;
  const arg = process.argv.slice(2).find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

// Claude Code nombra la carpeta de cada proyecto con su ruta, cambiando todo lo
// que no es letra o cifra por un guion. En Windows la letra de unidad llega en
// mayúscula o en minúscula según desde dónde se abrió la sesión, así que se
// compara sin distinguirlas.
function projectDir() {
  const repoRoot = path.resolve(__dirname, "..", "..", "..");
  const wanted = repoRoot.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  const root = path.join(os.homedir(), ".claude", "projects");
  const match = fs.readdirSync(root).find((d) => d.toLowerCase() === wanted);
  if (!match) fail(`No hay registros de Claude Code para ${repoRoot}.`);
  return path.join(root, match);
}

function readEntries(file) {
  return fs
    .readFileSync(file, "utf8")
    .split(NEWLINE)
    .filter((line) => line.trim())
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        // Línea a medio escribir: la sesión puede seguir abierta.
        return [];
      }
    });
}

// Solo cuenta lo que escribió la persona (texto de un mensaje de usuario), no
// los resultados de herramientas: una sesión que haya leído este mismo script
// también contiene la marca del comando.
function invokedCommand(entry) {
  if (entry.type !== "user" || !entry.message) return false;
  const { content } = entry.message;
  if (typeof content === "string") return content.includes(COMMAND_MARKER);
  return (
    Array.isArray(content) &&
    content.some((block) => block.type === "text" && String(block.text).includes(COMMAND_MARKER))
  );
}

function findSession(dir) {
  const requested = option("session", null);
  if (requested) return requested;
  const sessions = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".jsonl"))
    .map((f) => ({ id: f.slice(0, -6), mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  const hit = sessions.find((s) =>
    readEntries(path.join(dir, `${s.id}.jsonl`)).some(invokedCommand),
  );
  if (!hit) fail("Ninguna sesión de este proyecto invocó /coherencia; usa --session=<id>.");
  return hit.id;
}

// Respuestas distintas por modelo: una misma respuesta ocupa varias líneas (una
// por bloque de contenido) con el mismo id. «<synthetic>» son mensajes que
// genera el propio Claude Code (errores, interrupciones), no un modelo.
function countModels(entries) {
  const byMessage = new Map();
  for (const entry of entries) {
    const message = entry.type === "assistant" ? entry.message : null;
    if (!message || !message.model || message.model === "<synthetic>") continue;
    byMessage.set(message.id || entry.uuid, message.model);
  }
  const counts = {};
  for (const model of byMessage.values()) counts[model] = (counts[model] || 0) + 1;
  return counts;
}

const dir = projectDir();
const sessionId = findSession(dir);
const sessionFile = path.join(dir, `${sessionId}.jsonl`);
if (!fs.existsSync(sessionFile)) fail(`No existe la sesión ${sessionId}.`);
const allowed = option("allow", "claude-haiku-5-5,claude-sonnet-5-5")
  .split(",")
  .map((a) => a.trim())
  .filter(Boolean);

const rows = [{ who: "coordinador", models: countModels(readEntries(sessionFile)) }];
const subagentDir = path.join(dir, sessionId, "subagents");
if (fs.existsSync(subagentDir)) {
  for (const file of fs
    .readdirSync(subagentDir)
    .filter((f) => f.endsWith(".jsonl"))
    .sort()) {
    const id = file.slice(0, -6);
    const metaFile = path.join(subagentDir, `${id}.meta.json`);
    const type = fs.existsSync(metaFile)
      ? JSON.parse(fs.readFileSync(metaFile, "utf8")).agentType
      : "¿tipo?";
    rows.push({
      who: `${type} (${id})`,
      models: countModels(readEntries(path.join(subagentDir, file))),
    });
  }
}

const modified = new Date(fs.statSync(sessionFile).mtimeMs)
  .toISOString()
  .slice(0, 16)
  .replace("T", " ");
console.log(
  `Sesión ${sessionId} (último cambio ${modified} UTC); permitidos: ${allowed.join(", ")}`,
);
const offenders = [];
for (const row of rows) {
  const summary = Object.entries(row.models)
    .map(([model, n]) => `${model} ×${n}`)
    .join(", ");
  console.log(`- ${row.who}: ${summary || "sin respuestas"}`);
  for (const model of Object.keys(row.models)) {
    if (!allowed.some((id) => model === id || model.startsWith(`${id}-`)))
      offenders.push(`${row.who}: ${model}`);
  }
}
if (offenders.length) {
  console.log(
    `ALERTA: ${offenders.length} fuera de lo permitido:${NEWLINE}  ${offenders.join(`${NEWLINE}  `)}`,
  );
  process.exitCode = 1;
} else {
  console.log(`OK: coordinador y ${rows.length - 1} agentes, todos con modelos permitidos.`);
}
