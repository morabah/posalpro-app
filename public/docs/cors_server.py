#!/usr/bin/env python3
"""
Simple HTTP server with CORS support for PDF testing
"""

import http.server
import socketserver
import os
from urllib.parse import unquote

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def log_message(self, format, *args):
        # Only log important messages
        if "GET" in format and (".pdf" in args[0] or "200" in str(args[1:])):
            super().log_message(format, *args)

if __name__ == '__main__':
    import sys

    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    else:
        port = 8080

    # Change to the directory containing this script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    with socketserver.TCPServer(("", port), CORSHTTPRequestHandler) as httpd:
        print(f"Serving with CORS on port {port}")
        print(f"Files available at: http://localhost:{port}/")
        print("Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped")
            httpd.shutdown()
