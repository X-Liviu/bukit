# Seguimiento de riesgos — documentos por fecha

Registros de cada revisión de riesgos como **documentos independientes de la memoria**, con la misma dinámica que [`../plan-riesgos/`](../plan-riesgos/).

## Convención

- **Un documento por seguimiento**: `YYYY-MM-DD-SN.tex` (fecha + sprint, como `2026-07-26-S1.tex`), copiado de [TEMPLATE.tex](TEMPLATE.tex).
- **Formato LaTeX desde el 28-07-2026** (antes Markdown): documentos independientes de la memoria, con el diseño de la plantilla de seguimiento de Gestión de Proyectos del autor adaptado a la configuración global mediante el preámbulo compartido [`../config/riesgos-preamble.tex`](../config/riesgos-preamble.tex). Motivo del cambio: el seguimiento es un entregable en PDF, no un cuaderno de trabajo (petición del autor, dev-journal del 27-07-2026).
- **Compilar** (desde esta carpeta; MiKTeX sin Perl, `latexmk` no funciona): `pdflatex --enable-installer -interaction=nonstopmode -file-line-error -output-directory=build <archivo>.tex`, 2 pases y sin biber. El PDF queda en `build/` (gitignorado). También compila al **guardar en VS Code**: la receta de LaTeX Workshop omite biber cuando el documento no genera `.bcf` (estos documentos no tienen bibliografía).
- **Cuándo**: en la retrospectiva de cierre de sprint (domingo), revisando solo los riesgos que tocan por cadencia (críticos cada sprint; significativos cada 2; moderados cada 4), o de inmediato si se observa un indicador clave.
- Las revisiones **"sin novedad" también se registran**: demostrar que el seguimiento ocurrió es evidencia.
- Si se rellena un apartado marcado con **⟳** → emitir **nueva versión completa del plan** en `../plan-riesgos/`, añadir fila en la tabla de seguimiento del cap. 7 y anotar en el dev-journal.
- La entrada del dev-journal de ese día **enlaza** el documento de seguimiento en su sección "Revisión de riesgos".
- **La memoria no incluye la plantilla** (vacía no aporta información): el cap. 7 describe el mecanismo y remite a esta carpeta.
