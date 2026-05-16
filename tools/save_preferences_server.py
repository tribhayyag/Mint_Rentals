#!/usr/bin/env python3
"""
Simple no-deps HTTP server to accept preferences JSON and write it
to a file that OpenClaw/OpenClaw-like tools can read.

Usage:
  python3 tools/save_preferences_server.py

Environment variables:
  SAVE_PREFS_PATH - path to write the JSON file (default: tools/last_preferences.json)
  PORT - port to listen on (default: 8000)

This server is intentionally dependency-free (uses stdlib only).
"""
import http.server
import json
import os
import socketserver
import tempfile
from urllib.parse import urlparse
import json as _json


DEFAULT_PREF_PATH = os.path.join("tools", "last_preferences.json")
PREFERENCES_PATH = os.environ.get("SAVE_PREFS_PATH", None)
PORT = int(os.environ.get("PORT", "8000"))

# Attempt to read canonical path from .claude/settings.local.json if present
try:
    repo_root = os.path.dirname(os.path.dirname(__file__))
    settings_path = os.path.join(repo_root, ".claude", "settings.local.json")
    if os.path.exists(settings_path):
        with open(settings_path, "r", encoding="utf-8") as f:
            cfg = _json.load(f)
            oc = cfg.get("openclaw", {})
            if not PREFERENCES_PATH:
                PREFERENCES_PATH = oc.get("preferences_path")
            if oc.get("port"):
                try:
                    PORT = int(oc.get("port"))
                except Exception:
                    pass
except Exception:
    PREFERENCES_PATH = PREFERENCES_PATH or DEFAULT_PREF_PATH

PREFERENCES_PATH = PREFERENCES_PATH or DEFAULT_PREF_PATH


class Handler(http.server.BaseHTTPRequestHandler):
    def _set_headers(self, code=200, content_type="application/json"):
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        # CORS - allow all origins for dev convenience (adjust for production)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self):
        # Respond to preflight CORS requests
        self._set_headers(204)
        return

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/save_preferences":
            self._set_headers(404)
            self.wfile.write(b"{\"error\": \"not found\"}")
            return

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length > 0 else b""
        try:
            data = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            self._set_headers(400)
            self.wfile.write(b"{\"error\": \"invalid json\"}")
            return

        # Ensure target directory exists
        # Minimal validation: must be a non-empty dict
        if not isinstance(data, dict) or len(data) == 0:
            self._set_headers(400)
            self.wfile.write(b"{\"error\": \"empty or invalid payload\"}")
            return

        # Atomic write: write to temp file then replace
        try:
            os.makedirs(os.path.dirname(PREFERENCES_PATH), exist_ok=True)
            dir_name = os.path.dirname(PREFERENCES_PATH) or "."
            fd, tmp_path = tempfile.mkstemp(dir=dir_name)
            with os.fdopen(fd, "w", encoding="utf-8") as tmpf:
                json.dump(data, tmpf, indent=2, ensure_ascii=False)
            os.replace(tmp_path, PREFERENCES_PATH)
            # write companion meta file with timestamp
            try:
                meta = {"timestamp": __import__("datetime").datetime.utcnow().isoformat() + "Z", "source": "frontend"}
                meta_path = PREFERENCES_PATH + ".meta.json"
                with open(meta_path, "w", encoding="utf-8") as mf:
                    json.dump(meta, mf, indent=2, ensure_ascii=False)
            except Exception:
                pass
        except Exception:
            self._set_headers(500)
            self.wfile.write(b"{\"error\": \"write failed\"}")
            return

        self._set_headers(200)
        self.wfile.write(b"{\"status\": \"ok\"}")


def run():
    print(f"Saving preferences to: {PREFERENCES_PATH}")
    print(f"Listening on http://localhost:{PORT}/save_preferences")
    # Bind to localhost only for safety
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("Shutting down")
            httpd.server_close()


if __name__ == "__main__":
    run()
