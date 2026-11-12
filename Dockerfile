FROM python:3.12-alpine

# Sirve el juego (estáticos) y la API de estadísticas en un único contenedor,
# necesario para plataformas de un solo contenedor (Knative/nan.builders).
# Compatible con UID aleatorio no-root: el directorio de datos es escribible.
WORKDIR /app

COPY server.py api.py /app/
COPY index.html styles.css /app/
COPY js /app/js
COPY assets /app/assets

RUN mkdir -p /app/data \
 && chmod -R a+rwX /app/data \
 && addgroup -S app && adduser -S app -G app
USER app

ENV PORT=8080
ENV STATS_DB=/app/data/stats.db
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD python -c "import urllib.request as u;u.urlopen('http://localhost:8080/api/health')" || exit 1
CMD ["python", "server.py"]
