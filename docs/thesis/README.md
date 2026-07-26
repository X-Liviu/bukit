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

- **Guía de estilo de la universidad = norma**: transcripción literal en [../referencias/guia-estilo-TFG.md](../referencias/guia-estilo-TFG.md); ante cualquier duda de estilo (formato, citas, tablas/figuras), ese documento manda; su apartado de extensión (40/60 pp.) está excluido por decisión del autor (26-07-2026).
- **Citas en APA** (exigido por la guía): `\parencite{clave}` → "(Williams, 1995)"; `\textcite{clave}` → "Williams (1995)". Las referencias van en [bibliography/references.bib](bibliography/references.bib).
- **Toda información de fuente externa se referencia siempre** (datos, afirmaciones, marcos teóricos, definiciones ajenas). La guía lo exige y advierte de que la detección de plagio supone el suspenso directo: ninguna afirmación no original sin su cita.
- **Acrónimos**: definirlos en [frontmatter/acronyms.tex](frontmatter/acronyms.tex) y usarlos con `\ac{TFG}` (la primera vez imprime la forma completa).
- **Una frase por línea** en los `.tex`: los diffs de git quedan limpios.
- **Paginación dinámica (regla estricta del autor, 26-07-2026)**: prohibidos los saltos de página manuales (`\newpage`, `\clearpage`, `\pagebreak`) para empujar apartados, párrafos o puntos de listas; solo `\chapter` abre página nueva obligatoria. Los encabezados huérfanos ya los evita [config/style.tex](config/style.tex) automáticamente (`needspace` antes de cada nivel de apartado + penalizaciones máximas de viudas/huérfanas): el motor TeX decide el salto solo, y así el flujo no se rompe al editar texto anterior.
- **Labels con prefijo**: `ch:` capítulos, `sec:` secciones, `fig:` figuras, `tab:` tablas, `ap:` anexos.
- **Imágenes**: a `figures/`, en minúsculas con guiones. Doble numeración (Figura 3.2 = capítulo 3, figura 2): automática con `\begin{figure}` + `\caption`.
- **Datos globales**: nunca escribir título/autor/curso a mano; usar `\thesisTitle`, `\thesisAuthorFormal`... (en `config/metadata.tex`, con los `TODO` pendientes marcados).
- **Pendientes**: marcar con `\todonote{...}` (rojo en el PDF); antes de entregar, buscar "todonote" y eliminar todos.

## Formato de la guía de estilo (aplicado el 16-07-2026)

Implementado en [config/style.tex](config/style.tex): Carlito con `[sfdefault]` (clon métrico libre de Calibri; alternativa XeLaTeX/LuaLaTeX descartada por romper la cadena pdflatex+biber verificada), márgenes 2,5 cm (`geometry`), interlineado sencillo + 6 pt entre párrafos sin sangría (`parskip`), títulos según la guía con `titlesec` (capítulo MAYÚSCULA 14 pt negrita; 1er nivel MAYÚSCULA 12 pt negrita; 2º minúscula 12 pt negrita; 3º minúscula 12 pt cursiva; numeración con punto: 1., 1.1., 1.1.1.), doble cara (`twoside` en `main.tex`, cuerpo a 11 pt).
Detalles no obvios: Carlito no tiene versalitas (se sustituyen por redonda vía `.fd` + `\DeclareFontShape`; por eso `\bukit` pasó de versalitas a mayúsculas), y los títulos largos van en `\raggedright` para no desbordar línea.
Pendiente para la fase de diseño: solo los logos de identidad visual UPV/EHU en la portada.
La fuente literal de estos requisitos es [../referencias/guia-estilo-TFG.md](../referencias/guia-estilo-TFG.md) (apartados a y b).
