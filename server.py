"""Servidor de desarrollo para Senda de Héroes.

A diferencia de `python3 -m http.server`, envía cabeceras no-cache para que el
navegador siempre revalide los módulos ES y nunca quedes con código viejo en
blanco tras actualizar el juego.

Uso: python3 server.py [puerto]   (8090 por defecto)
"""
import http.server
import socketserver
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def main():
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
