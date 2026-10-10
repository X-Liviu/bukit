# Plantillas de entradas BibLaTeX

Copiar la que toque a `references.bib` y rellenar. La "clave" (primer campo) es el identificador para citar con `\parencite{clave}` / `\textcite{clave}`.

**Recurso web / documentación:**

```bibtex
@online{clave-web,
  author  = {{Nombre de la organización}},
  title   = {Título de la página},
  year    = {2026},
  url     = {https://example.com},
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

**Informe / norma / texto legal (tipo usado por iso-31000, rd-1125-2003, rgpd-2016-679, onu-agenda2030, rfc-9700):**

```bibtex
@report{clave-informe,
  author      = {{Nombre del organismo}},
  title       = {Título del informe o de la norma},
  type        = {Norma},
  number      = {ISO 31000:2018},
  institution = {Organismo que lo publica},
  year        = {2003},
  url         = {https://www.boe.es/...},
}
```

`type` y `number` son opcionales: los llevan las normas y los documentos numerados (`type = {Norma}` + `number = {ISO 31000:2018}`; `type = {RFC}` + `number = {9700}`), y biblatex-apa los imprime entre paréntesis tras el título.

**Capítulo de libro editado (tipo usado por brickman-campbell):**

```bibtex
@incollection{clave-capitulo,
  author    = {Apellido, Nombre},
  title     = {Título del capítulo},
  editor    = {Apellido, Nombre},
  booktitle = {Título del libro},
  publisher = {Editorial},
  year      = {1971},
  pages     = {287--302},
}
```

Notas APA:

- Autores corporativos entre dobles llaves: `{{Prisma Data, Inc.}}` (evita que se interprete como "Nombre Apellido").
- `urldate` es la fecha de consulta — obligatoria en recursos web según APA. Excepción: la legislación y las normas con `url` estable de fuente oficial (BOE, EUR-Lex, ONU) no la llevan — APA solo pide fecha de consulta para contenido que puede cambiar.
- Hasta 20 autores se listan todos (`and` entre cada uno); biblatex-apa aplica las reglas de "et al." automáticamente al citar.
