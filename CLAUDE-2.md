# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 0. Qué es este repositorio (resumen)

Este repositorio trata del Trabajo Fín de Grado (TFG) de un alumno del Grado de Ingeniería Informática de Gestión y Sistemas de Información de la UPV/EHU.

## 1. Idea: BUKIT

BUKIT es una red social cuyo propósito es ayudar a las personas a cumplir sus objetivos vitales — sus “bucket lists” — y, sobre todo, a no perseguirlos en solitario. Su elemento diferencial es que permite conocer a otras personas con metas iguales o parecidas para acompañarse, ayudarse mutuamente y compartir los logros conseguidos.
A diferencia de las redes sociales tradicionales, centradas en el consumo de contenido por entretenimiento, BUKIT orienta toda la experiencia hacia la acción y la consecución de metas: organizar tus objetivos en listas con plazos, recibir motivación de la comunidad y, opcionalmente, encontrar compañeros con quienes completarlos.

### 1.1 Motivación y nacimiento del concepto

Muchas personas tienen metas claras — viajar a un lugar concreto, aprender una habilidad, mejorar físicamente, emprender un proyecto — pero las abandonan por falta de constancia, de plazos definidos o de apoyo. Las redes sociales actuales agravan a menudo el problema: fomentan la comparación pasiva y el consumo infinito de contenido, no la acción.
BUKIT plantea una alternativa con tres ideas centrales:
• Estructura: convertir las metas en listas con plazos y recordatorios, de modo que dejen de ser deseos vagos y pasen a ser compromisos medibles.
• Comunidad: rodear al usuario de personas con objetivos afines que le inspiran, motivan y, llegado el caso, le acompañan físicamente a cumplirlos.
• Recompensa al avance: dar visibilidad y reconocimiento a quien progresa y aporta valor a la comunidad, frente a la mera popularidad.

### 1.2 Descripción de Concepto

(resumir esta parte): La aplicación se organiza en torno a una barra de navegación inferior con cuatro secciones, al estilo de Instagram. Antes de describirlas, conviene distinguir los dos tipos de usuario, ya que condicionan el comportamiento del feed.
3.1. Tipos de usuario
Tipo Quién es Qué puede hacer
Usuario normal Cualquier persona registrada (y, para ciertas funciones, verificada). Crear listas y publicar contenido ligado a ellas, además de los posts e historias de su perfil. Sus publicaciones tienen menor probabilidad de aparecer en el feed de otras personas.
Usuario TOP Creador/influencer admitido mediante un formulario externo a la app, en el que debe demostrar que ejerce una influencia positiva y coherente con los valores de BUKIT. Subir vídeos de forma ilimitada (vlogs, contenido motivacional, guías de ayuda). Sus publicaciones tienen una probabilidad alta de aparecer en el feed, a modo de recompensa por su aportación.

Nota de diseño: los vídeos de motivación del feed son exclusivos de los usuarios TOP. Este sistema de ponderación cumple tres funciones a la vez: filtra la calidad del contenido, incentiva la creación de valor y sienta las bases del modelo de negocio (creadores, contenido patrocinado y publicidad).
3.2. Opción 1 — Inicio (FYP)
Tras iniciar sesión, el usuario aterriza en su feed personalizado (“For You Page”), con una disposición tipo Pinterest — contenido en mosaico, no vídeo a vídeo. El feed combina:
• Ideas de metas y bucket lists de otras personas.
• Metas completadas y publicaciones de gente en pleno proceso.
• Casos de personas que no lograron su meta (aprendizaje y honestidad).
• Vídeos de motivación (exclusivos de usuarios TOP).
• Anuncios (ads).
En la esquina superior derecha hay un icono de búsqueda que, al pulsarlo, abre un buscador a pantalla completa (estilo TikTok) con las búsquedas recientes y resultados clasificados en perfiles, posts y bucket lists.
Deslizando hacia la derecha se accede a un segundo feed, esta vez solo con contenido de las personas a las que sigues (más íntimo, estilo Instagram). Si estás al día y no hay novedades, se muestra un mensaje del tipo “Estás al día… pero quizás te pueda gustar” acompañado de sugerencias de perfiles y publicaciones afines a tus intereses.
3.3. Opción 2 — Listas
Es el centro de control de los objetivos del usuario. Su icono es una lista. Desde aquí se pueden crear, ver, editar y eliminar listas.
¿Qué es una lista? Un conjunto de objetivos asociados a un plazo de tiempo. La aplicación envía recordatorios para favorecer su cumplimiento. El plan gratuito permite hasta 3 listas; el resto de planes se definirán más adelante.
Dentro de cada lista hay un icono para crear una publicación basada en ella, ya sea para mostrar cómo va el progreso o para anunciar que la meta se ha completado. Una regla clave del producto: solo se pueden crear publicaciones de este tipo a partir de listas propias.
Ideas asociadas a esta sección, aún por desarrollar:
• Una penalización social y de puntos cuando una meta no se completa dentro del plazo (a definir con cuidado para que motive y no frustre).
• Asistencia de IA que analice la lista y proponga (o asigne) un plazo realista a cada meta.
3.4. Opción 3 — Mensajes, mapa y notificaciones
Sección de mensajería similar a la de Instagram, con dos diferencias: se eliminan las “notas” y se añade en la parte superior un mini-mapa. La parte inferior es un chat convencional.
Al pulsar el mini-mapa, se abre a tamaño completo y ofrece dos vistas:

1. Mapa de seguidos: muestra a las personas con seguimiento mutuo — su ubicación o los lugares donde han completado sus objetivos.
2. Mapa de descubrimiento: se activa con un botón de cambio de mapa e incorpora un buscador para encontrar, por país, por un radio cercano o a nivel mundial, a personas con metas y gustos afines.
   Verificación previa obligatoria. Para acceder al mapa de descubrimiento, el usuario debe haberse verificado previamente con su DNI, número de teléfono y fotografías apropiadas y validadas. El motivo es la seguridad: esta función implica conocer a gente nueva, y se busca proteger a ambas partes. Desde el mapa se envía una solicitud del tipo “esta persona quiere conocerte / tenéis un objetivo en común”.
   Esta sección alberga también las notificaciones, accesibles mediante un botón al estilo del de Instagram.
   3.5. Opción 4 — Perfil
   El perfil sirve para mostrar quién eres. Es similar al de la mayoría de las redes sociales: desde él se gestionan los ajustes y se publica contenido no ligado a las listas.
   • Hasta 5 publicaciones libres, pensadas para que quien visite tu perfil entienda de qué vas y quién eres.
   • Historias al estilo Instagram, ilimitadas, creadas desde un botón “+” situado sobre la foto de perfil.
   • Todo el contenido del perfil se borra automáticamente a los 60 días, para forzar una actualización periódica (que puede ser un simple botón de mantener el contenido ya subido).
   • Las opciones de publicación solo se desbloquean si el perfil está verificado, ya que el perfil existe precisamente para demostrar de forma fiable cómo eres.

### 1.3 Stack Tecnológico

(leer todos los package.json del repositorio, explicando qué tecnologías se usan al final)

### 1.4 Arquitectura

monorepo pnpm donde convive con el backend, frontend web y móvil, y testing e2e. (desarrollar)

#### 1.4.1 Backend (API + BD)

- BD: PostgreSQL + PostGIS + pgvector + Prisma ORM (para migraciones, tipado automático y mantenimiento sencillo). BD en local con imagen de Docker para desarrollo. Uso de Neon para despliegue a producción.

- API Backend: Node +

#### 1.5.1 Frontend (Web + Móvil)

#### 1.6.1 Testing

#### 1.7.1 CI/CD

### 1.8 Líneas Futuras

### 1.9 Diseño

- Colores (Regla 60/30/10):
  -- Primarios:
  -- Secundarios:
  -- Terciarios:

## 2. Reglas y Procedimientos

### 2.1 Comandos Personalizados

- "/memoria": revisar la memoria y tener que actualizarla si se hicieran cambios.

- "/journal": crear nuevo resumen de lo que se ha hecho en el día.

### 2.2 Procedimientos per sé

- Cada vez que se realice un cambio, explicar la decisión tomada, justificándola.

### 2.3 Reglas de Código

- Instalación fija de versiones de dependencias en cualquier lugar del repositorio.

### 2.4 Reglas de Formato de Memoria (LaTeX)
