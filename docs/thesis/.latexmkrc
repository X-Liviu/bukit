# =========================================================================
# Configuración de latexmk para la memoria.
# Basta con ejecutar `latexmk` en esta carpeta: compila main.tex con
# pdflatex (y biber si hay citas) tantas veces como haga falta, y deja
# TODOS los artefactos en build/ (que está gitignorado).
#
#   latexmk        -> compila (build/main.pdf)
#   latexmk -pvc   -> recompila automáticamente al guardar
#   latexmk -C     -> limpia todos los artefactos
# =========================================================================

$pdf_mode = 1;                                 # 1 = pdflatex
@default_files = ('main.tex');
$out_dir = 'build';
$pdflatex = 'pdflatex -interaction=nonstopmode -file-line-error -synctex=1 %O %S';
