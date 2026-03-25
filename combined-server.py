#!/usr/bin/env python3
"""
Combined ProtoBoard server: serves static frontend + proxies /api to backend.
"""
import os
import http.server
import socketserver
import urllib.request
import urllib.error

PORT = 8012
BACKEND = "http://127.0.0.1:8013"
DIST = "/root/proto-board/frontend/dist"

CORS_ORIGINS = ["https://proto.revinoba.cc", "http://localhost:5173"]


class ProxyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST, **kwargs)

    def do_OPTIONS(self):
        origin = self.headers.get("Origin", "")
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.send_header("Access-Control-Max-Age", "3600")
        self.end_headers()

    def _read_body(self):
        """Read request body once, cache it."""
        if not hasattr(self, '_body_cache'):
            length = self.headers.get("Content-Length")
            self._body_cache = self.rfile.read(int(length)) if length else b''
        return self._body_cache

    def do_GET(self):
        if self.path.startswith("/api"):
            self.proxy(self.path)
        else:
            super().do_GET()

    def do_POST(self):
        if self.path.startswith("/api") or self.path.startswith("/auth"):
            self._read_body()
            self.proxy(self.path)
        else:
            self.send_error(404)

    def do_PUT(self):
        if self.path.startswith("/api"):
            self._read_body()
            self.proxy(self.path)
        else:
            self.send_error(404)

    def do_DELETE(self):
        if self.path.startswith("/api"):
            self.proxy(self.path)
        else:
            self.send_error(404)

    def proxy(self, path):
        try:
            origin = self.headers.get("Origin", "")
            body = getattr(self, '_body_cache', None)
            headers = {
                k: v for k, v in self.headers.items()
                if k.lower() not in ("host", "connection", "transfer-encoding", "origin", "content-length")
            }
            req = urllib.request.Request(
                BACKEND + path,
                data=body if body else None,
                method=self.command,
                headers=headers,
            )
            if body:
                req.add_header("Content-Length", str(len(body)))

            with urllib.request.urlopen(req, timeout=15) as resp:
                self.send_response(resp.status)
                for k, v in resp.headers.items():
                    if k.lower() not in ("transfer-encoding", "connection", "keep-alive"):
                        self.send_header(k, v)
                if origin:
                    self.send_header("Access-Control-Allow-Origin", origin)
                    self.send_header("Access-Control-Allow-Credentials", "true")
                self.end_headers()
                self.wfile.write(resp.read())
        except urllib.error.HTTPError as e:
            self.send_error(e.code)
        except Exception as e:
            self.send_error(500, str(e))

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == "__main__":
    os.chdir(DIST)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), ProxyHTTPRequestHandler) as httpd:
        print(f"Serving on http://127.0.0.1:{PORT}")
        httpd.serve_forever()
