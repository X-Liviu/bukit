# Memoria del TFG (LaTeX)

Estructura **modular** según la **guía definitiva de la Escuela de Ingeniería de Bilbao** (índice oficial de 15 capítulos; documento aportado por el autor — si se quiere versionar, guardarlo en `docs/referencias/`).
`main.tex` solo _ensambla_ el documento; el contenido vive en módulos.
Regla de oro: **un capítulo = un archivo**, y los datos globales (título, autor...) se cambian en un único sitio ([config/metadata.tex](config/metadata.tex)).

```
thesis/
├── main.tex              ← documento raíz: SOLO \input de módulos (no contenido)
├── .latexmkrc            ← config de compilación (artefactos → build/)
├── config/
│   ├── metadata.tex      ← VARIABLES GLOBALES: título, autor, director, curso...
│   ├── packages.tex      ← paquetes (babel trilingüe, biblatex-APA, acronym...)
│   ├── macros.tex        ← comandos propios (\bukit, \eng{}, \todonote{})
│   └── style.tex         ← formato/diseño (pendiente; requisitos anotados dentro)
├── frontmatter/          ← preliminares, en el orden de la guía:
│   ├── titlepage.tex     ← portada según plantilla del centro (logos TODO)
│   ├── abstract.tex      ← resumen trilingüe (ES/EU/EN) + palabras clave
│   ├── acronyms.tex      ← listado de acrónimos (usar \ac{TFG} en el texto)
│   ├── empleo-ia.tex     ← declaración de empleo de IA (apdo. V de la guía)
│   └── acknowledgements.tex
├── chapters/             ← un archivo por capítulo (índice oficial EIB, 1-15):
│   ├── 01-introduccion.tex            09-diseno.tex
│   ├── 02-contexto.tex                10-planificacion_temporal-estimacion_esfuerzo.tex
│   ├── 03-objetivos-alcance.tex       11-calculos-algoritmos.tex
│   ├── 04-beneficios-ods.tex          12-analisis-resultados.tex
│   ├── 05-estado-del-arte.tex         13-gantt-tfg.tex
│   ├── 06-analisis-alternativas.tex   14-presupuesto.tex
│   ├── 07-analisis-riesgos.tex        15-conclusiones.tex
│   └── 08-solucion-propuesta.tex
├── appendices/           ← numerados en romanos al compilar (Anexo I, II, III)
│   ├── a-pliego-condiciones.tex  ← Anexo I: normativa, plan de pruebas
│   ├── b-diseno-detalle.tex      ← Anexo II: esquemas, modelo de datos, código
│   └── c-manuales.tex            ← Anexo III: manuales de usuario/administrador
├── figures/              ← imágenes (graphicspath apunta aquí); logos/ para la portada
├── bibliography/
│   └── references.bib    ← bibliografía BibLaTeX en normas APA
└── build/                ← artefactos de compilación (gitignorado, se regenera)
```

## Compilar

- **VSCode (LaTeX Workshop):** guardar `main.tex` (o `Ctrl+Alt+B`). El PDF queda en `build/main.pdf` (`Ctrl+Alt+V` para verlo). La receta por defecto no necesita Perl.
- **Terminal:** `latexmk` en esta carpeta (o `pnpm docs:pdf` desde la raíz) — requiere Perl instalado.
- Cada capítulo empieza con un comentario que resume **qué exige la guía/plantilla** en ese apartado.

## Convenciones

- **Citas en APA** (exigido por la guía): `\parencite{clave}` → "(Williams, 1995)"; `\textcite{clave}` → "Williams (1995)". Las referencias van en [bibliography/references.bib](bibliography/references.bib).
- **Acrónimos**: definirlos en [frontmatter/acronyms.tex](frontmatter/acronyms.tex) y usarlos con `\ac{TFG}` (la primera vez imprime la forma completa).
- **Una frase por línea** en los `.tex`: los diffs de git quedan limpios.
- **Labels con prefijo**: `ch:` capítulos, `sec:` secciones, `fig:` figuras, `tab:` tablas, `ap:` anexos.
- **Imágenes**: a `figures/`, en minúsculas con guiones. Doble numeración (Figura 3.2 = capítulo 3, figura 2): automática con `\begin{figure}` + `\caption`.
- **Datos globales**: nunca escribir título/autor/curso a mano; usar `\thesisTitle`, `\thesisAuthorFormal`... (en `config/metadata.tex`, con los `TODO` pendientes marcados).
- **Pendientes**: marcar con `\todonote{...}` (rojo en el PDF); antes de entregar, buscar "todonote" y eliminar todos.

## Requisitos de formato aún no aplicados

Anotados en [config/style.tex](config/style.tex) para la fase de diseño: Calibri (via `carlito` o XeLaTeX), márgenes 2,5 cm, interlineado sencillo + 6 pt entre párrafos, formato de títulos, doble cara, ~40 páginas, logos de identidad visual UPV/EHU en la portada.
