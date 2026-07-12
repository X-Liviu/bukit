# Plantillas de entradas BibLaTeX

Copiar la que toque a `references.bib` y rellenar. La "clave" (primer campo) es el identificador para citar con `\parencite{clave}` / `\textcite{clave}`.

**Recurso web / documentación:**

```bibtex
@online{clave-web,
  author  = {{Nombre de la organización}},
  title   = {Título de la página},
  year    = {2026},
  url     = {https://ejemplo.com},
  urldate = {2026-07-12},
}
```

**Libro:**

```bibtex
@book{clave-libro,
  author    = {Apellido, Nombre},
  title     = {Título del libro},
  publisher = {Editorial},
  year      = {2020},
  edition   = {2},
}
```

**Artículo de revista/journal:**

```bibtex
@article{clave-articulo,
  author  = {Apellido, Nombre and Apellido2, Nombre2},
  title   = {Título del artículo},
  journal = {Nombre de la revista},
  year    = {2021},
  volume  = {12},
  number  = {3},
  pages   = {45--67},
}
```

**Ponencia / actas de congreso:**

```bibtex
@inproceedings{clave-congreso,
  author    = {Apellido, Nombre},
  title     = {Título de la ponencia},
  booktitle = {Actas del congreso X},
  year      = {2022},
  pages     = {1--10},
}
```

Notas APA:

- Autores corporativos entre dobles llaves: `{{Prisma Data, Inc.}}` (evita que se interprete como "Nombre Apellido").
- `urldate` es la fecha de consulta — obligatoria en recursos web según APA.
- Hasta 20 autores se listan todos (`and` entre cada uno); biblatex-apa aplica las reglas de "et al." automáticamente al citar.
