# Un solo Postgres con PostGIS (mapa de cercanía) y pgvector (afinidad
# vectorial), con las MISMAS versiones que la base de producción en Neon
# (04-10-2026): PostgreSQL 16.15, PostGIS 3.3.10 y pgvector 0.8.0.
# Neon solo ofrece esas versiones de las extensiones; si desarrollo y CI
# usaran otras más nuevas, sería fácil construir sobre funciones que en
# producción no existen. Como los repositorios de paquetes de Debian 12 solo
# conservan las versiones recientes, ambas extensiones se compilan desde sus
# fuentes oficiales. El raster de PostGIS (GDAL) no se compila: el producto no
# lo usa y es, con diferencia, la parte más pesada de la compilación.
#
# Historia: hasta el 03-10-2026 la base era postgis/postgis:16-3.4 (Debian 11,
# sin soporte desde agosto de 2026: el PGDG retiró sus paquetes y la CI se
# rompió sin tocar nada); del 03 al 04-10 fue la imagen de pgvector sobre
# Debian 12 con PostGIS por apt (versiones 3.6.4 y 0.8.7, por delante de Neon).
#
# Al cambiar de versión, comprobar la paridad con producción en Neon:
#   SELECT name, version FROM pg_available_extension_versions
#   WHERE name IN ('postgis', 'vector');
FROM postgres:16.15-bookworm

ARG POSTGIS_VERSION=3.3.10
ARG PGVECTOR_VERSION=0.8.0

# Una sola capa: las dependencias de compilación se instalan, se usan y se
# purgan en el mismo RUN, para que no engorden la imagen. No se nombran las
# bibliotecas de ejecución: el repositorio PGDG que trae la imagen base tiene
# sus propias versiones (p. ej., GEOS 3.14 frente a la 3.11 de Debian) y
# pedirlas por nombre provoca conflictos. En su lugar se aplica el patrón de
# las imágenes oficiales de Docker: tras compilar, se marcan como manuales
# solo los paquetes que contienen las bibliotecas que de verdad enlazan los
# .so compilados (detectadas con ldd), y la purga elimina todo lo demás.
# with_llvm=no: no se generan los ficheros de JIT, que obligarían a conservar
# clang y no aportan nada a una base de desarrollo. OPTFLAGS="" en pgvector:
# compilación portable, sin optimizar para la CPU de la máquina que construye.
RUN set -eux; \
  savedAptMark="$(apt-mark showmanual)"; \
  apt-get update; \
  apt-get install -y --no-install-recommends \
    build-essential pkg-config ca-certificates curl \
    postgresql-server-dev-16 \
    libgeos-dev libproj-dev libxml2-dev libjson-c-dev libprotobuf-c-dev protobuf-c-compiler; \
  mkdir -p /tmp/build; \
  cd /tmp/build; \
  curl -fsSL "https://github.com/pgvector/pgvector/archive/refs/tags/v${PGVECTOR_VERSION}.tar.gz" | tar xz; \
  cd "pgvector-${PGVECTOR_VERSION}"; \
  make OPTFLAGS="" with_llvm=no; \
  make install with_llvm=no; \
  cd /tmp/build; \
  curl -fsSL "https://download.osgeo.org/postgis/source/postgis-${POSTGIS_VERSION}.tar.gz" | tar xz; \
  cd "postgis-${POSTGIS_VERSION}"; \
  ./configure --without-raster; \
  make -j"$(nproc)" with_llvm=no; \
  make install with_llvm=no; \
  cd /; \
  rm -rf /tmp/build; \
  apt-mark auto '.*' > /dev/null; \
  [ -z "$savedAptMark" ] || apt-mark manual $savedAptMark > /dev/null; \
  find /usr/lib/postgresql/16/lib -name '*.so' -newer /usr/lib/postgresql/16/bin/postgres -exec ldd '{}' ';' \
    | awk '/=>/ { so = $(NF-1); if (index(so, "/usr/local/") == 1) { next }; gsub("^/(usr/)?", "", so); printf "*%s\n", so }' \
    | sort -u | xargs -r dpkg-query --search | cut -d: -f1 | sort -u | xargs -r apt-mark manual; \
  apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false; \
  rm -rf /var/lib/apt/lists/*
