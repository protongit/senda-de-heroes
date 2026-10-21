FROM nginx:1.27-alpine

# Compatible con plataformas que ejecutan con UID aleatorio no-root (OpenShift/Knative):
# pid y cachés en rutas escribibles, sin privilegios.
RUN sed -i 's|/var/run/nginx.pid|/tmp/nginx.pid|' /etc/nginx/nginx.conf \
 && mkdir -p /var/cache/nginx /var/run \
 && chmod -R a+rwX /var/cache/nginx /var/run /var/log/nginx /tmp /etc/nginx

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html styles.css /usr/share/nginx/html/
COPY js /usr/share/nginx/html/js
COPY data /usr/share/nginx/html/data
COPY assets /usr/share/nginx/html/assets

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:8080/ >/dev/null || exit 1
CMD ["nginx", "-g", "daemon off;"]
