// Textos de cada página de un .drawio (nombres de clases, atributos, nodos, versiones,
// jobs, paquetes…) para compararlos con el código y los documentos. Las etiquetas van en
// HTML escapado dos veces dentro del XML y, si draw.io guarda la página comprimida,
// en base64 + deflate; aquí se desescapa y se descomprime.
// Uso: node docs/coherencia/scripts/drawio.cjs docs/diagramas/bukit.drawio
const fs = require("fs");
const zlib = require("zlib");

const xml = fs.readFileSync(process.argv[2] || "docs/diagramas/bukit.drawio", "utf8");
const d1 = (s) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
    .replace(/&amp;/g, "&");
const dec = (s) => d1(d1(s));

for (const m of xml.matchAll(/<diagram\b([^>]*)>([\s\S]*?)<\/diagram>/g)) {
  const nombre = (m[1].match(/\bname="([^"]*)"/) || [])[1] || "?";
  let cuerpo = m[2];
  if (!cuerpo.includes("<mxGraphModel")) {
    try {
      cuerpo = decodeURIComponent(
        zlib.inflateRawSync(Buffer.from(cuerpo.trim(), "base64")).toString("utf8"),
      );
    } catch {
      console.log(`## ${dec(nombre)}\n(página comprimida que no se pudo descomprimir)`);
      continue;
    }
  }
  console.log(`## ${dec(nombre)}`);
  for (const v of cuerpo.matchAll(/\bvalue="([^"]*)"/g)) {
    const t = dec(v[1])
      .replace(/<br\s*\/?>/gi, " | ")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (t) console.log(`- ${t}`);
  }
}
