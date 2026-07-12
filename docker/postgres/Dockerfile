# PostGIS ya viene en esta imagen; le añadimos pgvector para tener ambas
# extensiones en un solo Postgres (mapa de cercanía + afinidad vectorial).
FROM postgis/postgis:16-3.4

RUN apt-get update \
  && apt-get install -y --no-install-recommends postgresql-16-pgvector \
  && rm -rf /var/lib/apt/lists/*
