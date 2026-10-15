# Guía de estilo del TFG (UPV/EHU) — transcripción literal

> **Documento NORMATIVO.** Transcripción literal del apartado "7.- GUÍA DE ESTILO DEL TFG" de la guía de TFG de la universidad (`guia-TFG.pdf`), aportada por el autor el 14-07-2026.
> Claude Code debe aplicar esta guía **a rajatabla** en todo lo relativo a la memoria (`docs/thesis/`).
> Alteraciones respecto al original: (1) se han retirado los números de página del PDF que partían frases; el texto no se ha corregido ni parafraseado (se conservan sus erratas). (2) El apartado «a. Extensión» queda **EXCLUIDO** de la norma aplicable a este TFG por decisión del autor (26-07-2026): la memoria no se somete a límite de páginas.
>
> Dónde se operativiza cada bloque: extensión y formato → `docs/thesis/config/style.tex` (aplicado el 16-07-2026; el bloque de extensión queda excluido por decisión del autor); citas APA → `biblatex-apa` en `config/packages.tex` + plantillas en `bibliography/PLANTILLAS.md`; obligación de citar toda fuente externa → CLAUDE.md («Memoria del TFG») y `docs/thesis/README.md`.

## GUÍA DE ESTILO DEL TFG

### a. Extensión

> **Apartado EXCLUIDO por decisión del autor (26-07-2026): este TFG no aplica límite de extensión.** El texto original fijaba 40 páginas, ampliables a un máximo de 60 en casos excepcionales justificados.

### b. Formato

MÁRGENES: Izquierdo: 2,5 cm; Derecho: 2,5 cm; Superior: 2,5 cm; Inferior 2,5 cm

ESPACIOS: Interlineado sencillo; Entre párrafos: 6 puntos

TIPO DE LETRA: Calibri

ILUMINACIÓN TIPOGRÁFICA DE ENCABEZAMIENTOS Y APARTADOS:

- Título del Capítulo: Mayúscula 14 p + Negrita
- Título de los Apartados 1er Nivel: Mayúscula 12 p + Negrita
- Título de los Apartados 2º Nivel: Minúscula 12 p + Negrita
- Título de los Apartados 3er Nivel: Minúscula 12 p + Cursiva

ILUMINACIÓN TIPOGRÁFICA EN EL TEXTO: Cursiva; Numeración de apartados: números dígitos (1., 1.1., 1.1.1.,...)

IMPRESIÓN DEL DOCUMENTO: A doble cara

### c. Cita de fuentes documentales

Las fuentes son todos los documentos que aportan información para el estudio de una materia o de un tema en particular. El autor o autora de un TFG debe siempre expresar, en la memoria escrita, el reconocimiento de todas las fuentes consultadas a través del sistema de citas; ya sean generales (diccionarios y enciclopedias) o más específicas (manuales, monografías, artículos de revistas, conversaciones con especialistas, encuestas, etc.). Citar las fuentes consultadas denota honradez y sensibilidad intelectual, amén de reforzar los argumentos expuestos en el TFG. No hacerlo supone plagiar ideas ajenas, entendiéndose por plagio aquéllas situaciones en las que el autor o autora hace pasar ideas, palabras o información de otra fuente como si fueran propias, omitiendo expresamente la referencia a su verdadera autoría.

**La detección de un plagio supondrá el suspenso directo del alumno/a.**

Los manuales de estilo describen los requerimientos para la preparación y presentación de manuscritos. Dentro de los aspectos relativos al estilo se encuentra el sistema de citas documentales, que se establecen para normalizar el formato de cita de los documentos que dan validez al trabajo intelectual y permiten al lector localizar las fuentes consultadas por el autor o autora.

Cada área de conocimiento tiene normas específicas para identificar las fuentes documentales, de tal manera que los alumnos deben seguir esas convenciones con precisión, toda vez que citan bibliografía en un trabajo sobre un área del conocimiento en particular.

En relación a qué tipo de estilo se emplea, ello va a depender de los estándares de la disciplina en particular. Si bien ello es así, es importante recordar que cuando se elige un formato de cita, debe respetarse el mismo criterio para todo el TFG, concretamente las Normas APA.

#### c.1. Forma de citar en el texto principal del trabajo

El estilo Harvard-APA presenta las citas dentro del texto del trabajo, utilizando el apellido del autor, la fecha de publicación y la página citada entre paréntesis. Este sistema NO requiere utilizar las citas a pie de página, salvo en los supuestos en los que se desee añadir información que en el texto principal no tenga cabida por considerarse secundario.

El sistema funciona de la siguiente manera:

> Williams (1995, p. 45) sostuvo que "al comprar los desórdenes de la personalidad se debe tener en cuanta la edad del paciente".

O bien:

> Un autor sostuvo que "al comprar los desórdenes de la personalidad se debe tener en cuenta la edad del paciente" (Williams, 1995, p. 45)

Cuando la cita es indirecta (es decir, que se menciona la idea del autor pero no se cita textualmente), no se coloca la página de la referencia. Se hace de la siguiente manera:

> Es oportuno considerar la edad de los pacientes al estudiar los desórdenes de la personalidad (Williams, 1995)

Cuando un autor tienen más de una publicación en el mismo año, se acompaña el año de la publicación con una letra minúscula. Por ejemplo:

> En dos estudios recientes (Harding, 1986a, p. 80; 1986b, p. 138) se sugirió que...

Para citar a varios autores (hasta cinco autores) escriba los apellidos de todos los autores la primera vez que se les cite en el trabajo, en las citas posteriores utilice et al. [y otros]. Por ejemplo, la primera vez sería:

> (Moore, Estrich, McGillis, y Spelman 1984, p. 33)

y las referencias subsecuentes se utiliza et al., como en el ejemplo a continuación:

> (Moore et al., 1984, p. 46)

Cuando necesite hacer referencia a una fuente cuyo autor no ha podido identificar con precisión, cite las primeras dos o tres palabras del título, seguido por el año. Por ejemplo:

> ... en una reciente publicación (Enciclopedia de la Psicología, 1991, p. 62)...
> ... en el siguiente artículo ("Diferencias individuales," 1993, p. 12)...

Siga este ejemplo para las direcciones electrónicas donde no ha podido identificar ningún autor. Sin embargo, si el autor es "anónimo", cite la palabra Anónimo en su texto, por ejemplo:

> (Anónimo, 1993, p. 116)

Si usted necesita citar una investigación que encontró en otro trabajo, puede hacerlo de las siguientes maneras:

> Smith (1970, p. 27) cita a Brown (1967) quien descubrió que...
> Brown (1967), citado por Smith (1970, p. 27), descubrió que...
> Se encontró (Brown, 1967, citado por Smith, 1970, p. 27) que...

#### c.2. Forma de presentar la bibliografía al final del trabajo

El listado de referencias debe ordenarse alfabéticamente por el apellido del autor. El formato APA-Harvard requiere que los títulos de libros, revistas, enciclopedias, diarios, etc. sean destacados utilizando tipografía itálica (conocida también como cursiva).

Las referencias bibliográficas se presentan de la siguiente manera:

> Autor, iniciales (año). _Título del libro_. Lugar de la publicación: Editor.

Ejemplos:

> American Psychological Association. (1994). _Manual de la publicación de la American Psychological Association_ (4to ed.). Washington, C.C.: Autor.
>
> _Enciclopedia de Sicología_. (1976). Londres: Routledge.
>
> Gardner, H. (1973). _Las artes y el desarrollo humano_. Nueva York: Wiley.
>
> Moore, M. H., Estrich, S., McGillis, D., y Spelman, W. (1984). _Delincuentes peligrosos: el blanco escurridizo de la justicia_. Cambridge: Harvard University Press.
>
> Strunk, W., & Blanco, E. B. (1979). _Los elementos del estilo_ (3ra ed.). Nueva York: Macmillan.

Importante: Se pueden citar hasta 6 autores de una misma publicación. Los séptimos y subsecuentes se indicarán con la abreviatura et al.

#### c.3. Formas de citar distintos tipos de fuentes bibliográficas

**(i) Libros cuyo autor es un editor**

> Maher, B. A. (Ed.). (1964-1972). _Progreso en la investigación experimental de la personalidad_ (6 vols.). Nueva York: Prensa Académica

**(ii) Capítulo de un libro que es el artículo de un autor**

> Vygotsky, S. Del L. (1991). Génesis de las funciones mentales más altas. En P. Light, S. Sheldon, y M. Woodhead (Eds.), _Aprendiendo a pensar_ (pp. 32-41). Londres: Routledge.

**(iii) Enciclopedias**

> Lijphart, A. (1995). Sistemas electorales. En _La Enciclopedia de la Democracia_ (vol. 2, pp. 412-422). Londres: Routledge.

Si la cita no tiene ningún autor específico, comience la referencia con el título de la cita seguida por la fecha de la publicación.

**(iv) Publicaciones oficiales de algún gobierno**

> Gran Bretaña. Ministerio del Interior. (1994). _Política de las prisiones para Inglaterra y el País de Gales_. Londres: HMSO.

**(v) Informes (Reports)**

> Birney, A. J., & Pasillo, M. Del M. (1981). _Identificación temprana de niños con dificultades para escribir una lengua_ (Informe No. 81-502). C.C. De Washington: Asociación Educativa Nacional.

**(vi) Actas de congresos**

> Borgman, C. L., Bower, J., & Krieger, D. (1989). From hands-on science to hands-on information retrieval. En J. Katzer, y G. B. Newby, (Eds.), _Procedimientos de la 52.a reunión anual de ASIS: Vol. 26, información del manejo y tecnología_ (pp. 96-100). Medford, NJ: Información Docta.

**(vii) Artículos de Revistas Científicas (Journals)**

> Noguchi, T., Kitawaki, J., Tamura, T., Kim, T., Kanno, H., Yamamoto, T., Y Okada, H. (1993). La conexión entre la actividad de aromatase y la del portador del esteroide nivelador en tumores ováricos de mujeres post-menopáusicas. _Journal of Steroid Biochemistry and Molecular Biology_, 44(4-6), 657-660.
>
> Popper, E. Del S., Y McCloskey, K. (1993). Diferencias individuales y subgrupos dentro de una población: un acercamiento a la canasta familiar. _Aviation Space and Environmental Medicine_, 64(1), 74-77.

**(viii) Artículo de una publicación semanal**

> Barrett, L. (2001, 23 de agosto). Gestión para la supervivencia de Daewoo en el Reino Unido. En _Marketing Week_, 22-23.

**(ix) Artículos de periódico**

> Conexiones entre la cafeína y las enfermedades mentales. (1991, 13 de julio). _New York Times_, pp. B13, B15.
>
> Young, H. (1996, 25 de julio). La Batalla entre serpientes y escaleras. _The Guardian_, p. 15.

**Dos o más publicaciones del(los) mismo(s) autor(es) con la misma fecha de publicación**

Cuando un autor (o un grupo de autores) tiene(n) más de un trabajo dentro de un mismo año, enumérelos de acuerdo al título e indique la fecha con una letra minúscula a, b, c... Por ejemplo:

> Harding, S. (1986a). La inestabilidad de las categorías analíticas de la teoría feminista. _Signos_, 11(4), 645-664.
>
> Harding, S. (1986b). _La pregunta científica del feminismo_. Ithaca: Cornell University Press.

Cuando se cita otra obra del mismo autor dentro del mismo texto también se utilizan estas letras en la referencia dentro del texto.

**(x) Trabajos anónimos**

Si una investigación es "anónima", su referencia debe comenzar con la palabra Anónimo, seguido por la fecha, etc., tal y como se viene indicando desde un principio. Si no consigue identificar con certeza que el texto es anónimo, ubique el título en el lugar que ubicaría comúnmente el nombre del autor.

**(xi) Entrevistas**

Debido a que el material de una entrevista no se puede reproducir para quien lee un trabajo de investigación no es obligatorio que se cite en la Bibliografía final. Sin embargo, sería muy conveniente hacer una referencia a la entrevista dentro del cuerpo principal de su trabajo, a manera de comunicación personal:

> ... y este punto fue concedido (J. Bloggs, entrevista personal, 22 de agosto de 2001).

**(xii) Fuentes electrónicas**

El patrón básico para una referencia electrónica es:

> Autor, inicial(es) de su nombre (año). Título. Mes, día, año, dirección en Internet.
>
> Bancos, I. (n.d.). Los NHS marcan la pauta del cuidado de la salud. Obtenida el 29 de agosto de 2001, de http://www.healthcareguide.nhsdirect.nhs.uk/

- Si no se consigue identificar la fecha en que el documento fue publicado, utilizar la abreviatura n.d. (no date [sin fecha]).
- Si no consigue identificar al autor, empezar su referencia con el título del documento.
- Si el documento se ubica dentro de una página institucional, como la de alguna universidad o departamento gubernamental, primero citar el nombre de la organización o del departamento en cuestión, antes de dar la dirección electrónica:

> Alexander, J., & Tate, M. A. (2001). Evaluando las Fuentes Electrónicas. Consultado el 21 de agosto de 2001, Widener University, página web conmemorativa de la biblioteca Wolfgram: http://www2.widener.edu/Wolfgram-Memorial Library/webevaluation/webeval.htm
>
> Decidiendo su futuro. (2000). Consultado el 5 de septiembre de 2001, Portsmouth University, página web de Servicios Profesionales: http://www.port.ac.uk/departments/careers/plancareer/deciding-your-future.htm

**(xiii) Artículos electrónicos de revistas científicas que a su vez son reproducción de la versión impresa**

Emplear el mismo formato de referencia que utiliza para un artículo de revista científica impresa y agregue "versión electrónica" entre corchetes, después del título del artículo:

> Lussier, R. N., y Pfeifer, S. (2001). Un modelo transnacional para predecir el éxito en los negocios [versión electrónica]. _Journal of Common Market Studies_, 39(3), pp. 228-239.

Si tiene que citar un artículo electrónico cuya versión se diferencia de la versión impresa, o incluye datos o comentarios adicionales, agregar la fecha en que usted consultó el documento en la web y su respectiva dirección (URL).

**(xiv) Artículos de revistas científicas que sólo se publican en la web**

> Korda, L. (2001, Julio). La fabricación de un traductor. _Translation Journal_, 5(3). Consultada el 21 de agosto de 2001, http://accurapid.com/journal/17prof.htm

- Utilizar la fecha completa de publicación que figura en el artículo.
- Cerciorarse de que no tenga paginación.
- Siempre que sea posible, procurar que la dirección electrónica que cite (URL) remita directamente al artículo.
- Evitar citar una dirección electrónica en dos líneas y cuide que el enlace (URL) no se corte después de un guión o antes de un punto. No inserte guiones en el enlace cuando esto ocurra.

**(xv) Artículos obtenidos de una base de datos**

Utilice el formato apropiado al tipo de trabajo obtenido y agregue la fecha de recuperación del material más el nombre de la base de datos:

> McVeigh, T. (2000, Julio 9). Cómo contribuyen los gestos a la expresión. _The Observer_, p.7. consultado el 10 de septiembre de 2001, en The Guardian y The Observer, en su…

### d. Tablas, cuadros, figuras y gráficos

Las tablas, cuadros, figuras y gráficos de las memorias se numerarán de acuerdo con el sistema de doble numeración (primer número para el capítulo y segundo para el número de orden dentro del capítulo).

> Tabla 3.5: Distribución en función del sexo de los participantes (corresponde a la quinta tabla del capítulo tercero).
>
> Figura 3.2: Modelo de evaluación utilizado (corresponde a la segunda figura del capítulo tercero).

Todas las tablas, cuadros, figuras y gráficos se incluirán al final de la memoria en un índice de ilustraciones y se señalarán las páginas correspondientes.

- Las tablas se utilizarán para presentar datos numéricos.
- En los cuadros se presentarán los datos o informaciones textuales.
- Con las figuras se representarán las ideas que requieran algún tipo de diseño gráfico (flechas, figuras geométricas, etc.)
- A través de los gráficos se representarán los datos cuantitativos (histogramas, diagramas, pictogramas, etc.)
