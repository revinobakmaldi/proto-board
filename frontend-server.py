#!/usr/bin/env python3
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

PORT = 8012
DIRECTORY = "/root/proto-board/frontend/dist"

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

HTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
