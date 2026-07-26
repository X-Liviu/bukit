# Plan de riesgos — versión 1 (26-07-2026)

> **NOTA de cambios respecto a la v0 (cap. 7 de la memoria, 17-07-2026):**
>
> 1. **R4 (incumplimiento de la normativa de la memoria)**: se eliminan de la mitigación la cláusula «el número de páginas se observa en cada compilación» y de la contingencia la cláusula «condensación del texto hasta volver al límite de extensión antes del depósito». Motivo: el autor excluyó el 26-07-2026 el apartado de extensión (40/60 pp.) de la guía de estilo aplicable a este TFG; el riesgo queda centrado en la citación (plagio) y el resto de la normativa. P, I y severidad no cambian.
> 2. **R10 (indisponibilidad prolongada del autor)**: se materializó en S1 (≈9 días sin actividad, 18-07 → 25-07, por agotamiento laboral y asuntos personales) y queda **Resuelto** tras aplicar la contingencia en su versión mínima (pausa de facto + re-encaje dentro del propio S1; la historia del sprint se completó el 26-07). La evaluación (P1×I3, significativo) se confirma y no cambia.
> 3. El resto de riesgos: sin cambios (revisión de S1 en [`../seguimiento-riesgos/2026-07-26-S1.md`](../seguimiento-riesgos/2026-07-26-S1.md)).
>
> Emitida en la primera retrospectiva del proyecto (cierre de S1). Registrada en la tabla de seguimiento del cap. 7 y en el dev-journal del 26-07-2026.

## Registro de riesgos

Escalas: P e I de 1 a 3; exposición = P × I; severidad: crítico (6–9), significativo (3–4), moderado (1–2).

| Id | Riesgo | P | I | Exp. | Sev. | Indicador clave | Indicador de resolución | Estado |
|----|--------|---|---|------|------|-----------------|-------------------------|--------|
| R1 | Crecimiento descontrolado del alcance | 3 | 3 | 9 | Crítico | El sprint activo gana >2 SP tras la planificación del lunes sin retirar volumen equivalente, o se implementa una función ausente del cap. 3 sin pasar por el backlog | — | Identificado |
| R2 | Error sistemático de estimación del esfuerzo | 3 | 2 | 6 | Crítico | La velocidad real de los 3 primeros sprints se desvía >25 % de la hipótesis inicial | — | Identificado |
| R3 | Memoria relegada frente al desarrollo | 2 | 3 | 6 | Crítico | Un capítulo afectado por trabajo cerrado acumula 2 sprints sin actualizarse, o el diario se redacta >48 h después de la sesión | — | Identificado |
| R4 | Incumplimiento de la normativa de la memoria | 2 | 3 | 6 | Crítico | Una revisión de capítulo encuentra una afirmación no original sin su cita | La revisión final previa al depósito concluye con cero afirmaciones sin cita, con auditoría manual junto con ayuda de IA | Identificado |
| R5 | Dependencia acrítica de la IA generativa | 2 | 3 | 6 | Crítico | Una decisión o bloque integrados no pueden explicarse sin recurrir de nuevo a la herramienta, o una revisión encuentra código integrado sin revisar ni probar | — | Identificado |
| R6 | Curva de aprendizaje de la pila tecnológica | 3 | 2 | 6 | Crítico | Una historia o investigación previa consume el doble de su tiempo previsto sin resolución a la vista | Investigaciones previas de las tecnologías señaladas cerradas, con decisión integrada o alternativa documentada | Identificado |
| R7 | Incumplimiento del RGPD en el diseño | 2 | 3 | 6 | Crítico | Una entidad del modelo incorpora un dato personal sin finalidad declarada, o un requisito exige almacenar la imagen del documento | El modelo de datos completo pasa la revisión de minimización | Identificado |
| R8 | Capacidad real inferior a la declarada | 2 | 2 | 4 | Significativo | Horas reales <70 % de las declaradas durante 2 semanas consecutivas sin causa puntual identificada | — | Identificado |
| R9 | Dependencia de servicios externos | 2 | 2 | 4 | Significativo | Cambio de precios/límites, agotamiento de capa gratuita o indisponibilidad >24 h | El núcleo funciona de punta a punta con versiones simuladas al finalizar la implementación | Identificado |
| R10 | Indisponibilidad prolongada del autor | 1 | 3 | 3 | Significativo | >3 días consecutivos sin poder trabajar por causa sobrevenida en periodo de dedicación plena | — | **Resuelto** (materializado en S1, superado el 26-07-2026) |
| R11 | Pérdida de trabajo o del entorno local | 1 | 3 | 3 | Significativo | Anomalías del equipo, o >2 sesiones consecutivas sin subir al remoto | — | Identificado |
| R12 | Ciclos de revisión con el tutor | 1 | 2 | 2 | Moderado | Consulta o capítulo >2 semanas sin respuesta, o revisión con cambios estructurales sobre capítulo cerrado | El borrador completo pasa una revisión del tutor sin cambios estructurales | Identificado |
| R13 | Fricción imprevista de la cadena de herramientas | 2 | 1 | 2 | Moderado | >1 h de una misma sesión perdida en un problema de entorno sin receta previa | 4 sprints consecutivos sin fricción nueva >1 h | Identificado |

## Plan de respuesta

| Id | Mitigación (prevención) | Contingencia |
|----|-------------------------|--------------|
| R1 | Alcance delimitado por contrato (cap. 3); historias priorizadas (imprescindible/deseable/opcional); toda idea nueva entra por el backlog | Descartar opcionales, renegociar deseables, mover lo recortado a líneas futuras |
| R2 | Medir velocidad real desde el primer sprint; recalibrar horas/punto en cada cierre; trocear historias grandes | Recortar lo opcional para proteger lo imprescindible y ampliar la horquilla de cierre, documentando la desviación (cap. 13) |
| R3 | Hueco reservado para redacción en todos los sprints; ninguna historia cerrada sin documentar su decisión; diario al cierre de cada sesión | Sprints exclusivos de memoria antes del cierre |
| R4 | Toda afirmación externa se cita al escribirla, nunca en pasada posterior; entradas de bibliografía según plantillas; pendientes marcados con nota visible y purgados antes del depósito | Auditoría completa de citas, capítulo a capítulo contra sus fuentes, antes del depósito |
| R5 | Cada decisión explicada en el diario con su alternativa; todo código generado se revisa antes de integrarse; nada cerrado sin comprobaciones automáticas y pruebas | Congelar el módulo afectado, estudiarlo y reescribirlo hasta poder explicarlo sin asistencia; registrar el episodio |
| R6 | Investigación previa con límite de tiempo antes de comprometer historias con tecnología desconocida; preferir servicios gestionados | Adoptar la alternativa documentada o recortar la función a su versión mínima |
| R7 | Minimización desde el diseño: verificación delegada (solo estado + clave), ubicación difuminada y consentida, datos en región europea | Recortar o desactivar la función afectada hasta rediseñarla conforme al reglamento |
| R8 | Horas reales por sesión en el diario; cada retrospectiva las compara con las declaradas; calendario con holgura hasta la defensa (septiembre como reserva) | Rebajar la capacidad declarada de los sprints restantes al nivel observado; recortar primero lo opcional |
| R9 | Integraciones externas como objetivos secundarios o contra versiones simuladas; proveedores con capa gratuita suficiente | Sustituir por versión simulada o alternativa gratuita equivalente; documentar la integración real como línea futura |
| R10 | Margen deliberado entre cierre objetivo y defensa; documentación continua que permite retomar sin pérdida | Pausa formal, re-planificación del calendario y, en el extremo, cambio de convocatoria |
| R11 | Todo el proyecto en git con remoto en GitHub y subidas frecuentes | Restaurar desde el remoto; pérdida máxima acotada a la sesión en curso |
| R12 | Capítulos a revisión conforme se cierran; plazo orientativo acordado en cada envío | Continuar con trabajo independiente de la revisión pendiente; re-planificar el capítulo al llegar la respuesta |
| R13 | Cada solución documentada como receta reproducible al resolverla | Aplicar la alternativa documentada o trasladar el paso conflictivo a la CI (Linux) |
