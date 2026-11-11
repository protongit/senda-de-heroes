"""Servidor de desarrollo para Senda de Héroes.

A diferencia de `python3 -m http.server`, envía cabeceras no-cache para que el
navegador siempre revalide los módulos ES y nunca quedes con código viejo en
blanco tras actualizar el juego. Además monta la API de estadísticas (`api.py`)
bajo `/api/*`, de modo que con un solo proceso tienes el juego y sus
estadísticas.

Uso: python3 server.py [puerto]   (8090 por defecto)
"""
import http.server
import json
import socketserver
import sys
from urllib.parse import parse_qs, urlparse

import api


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def _api(self, method):
        parsed = urlparse(self.path)
        body = b""
        if method in ("POST", "PUT"):
            try:
                length = int(self.headers.get("Content-Length") or 0)
                body = self.rfile.read(length)
            except Exception:
                body = b""
        status, obj = api.dispatch(method, parsed.path, parse_qs(parsed.query), body)
        payload = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        if self.path.startswith("/api/"):
            return self._api("GET")
        return super().do_GET()

    def do_POST(self):
        if self.path.startswith("/api/"):
            return self._api("POST")
        return super().do_POST()

    def do_DELETE(self):
        if self.path.startswith("/api/"):
            return self._api("DELETE")
        return super().do_DELETE()


def main():
    api.init_db()
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8090
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("", port), NoCacheHandler) as httpd:
        print(f"Senda de Héroes sirviendo en http://localhost:{port}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
