"""Local server for the GTM Leadership Dashboard — a live, READ-ONLY HubSpot pull behind /api/metrics.

Run:  python3 serve.py            (Python 3.11+, standard library only — no pip install)
Then open http://localhost:8792

Endpoints:
  GET /              -> index.html (the dashboard UI)
  GET /api/metrics   -> live read-only pull from HubSpot, aggregated JSON (?from=YYYY-MM-DD&to=YYYY-MM-DD)

The HubSpot Private App token is read from HUBSPOT_TOKEN (env or a local .env, gitignored).
Nothing is written to HubSpot — the ingestion only reads and /search.
"""

from __future__ import annotations

import json
import os
import re
import traceback
import urllib.parse
from datetime import date
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import metrics

HERE = Path(__file__).resolve().parent
PORT = 8792
_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _load_env() -> None:
    """Best-effort load of a local .env so HUBSPOT_TOKEN is available (never committed)."""
    envfile = HERE / ".env"
    if not envfile.exists():
        return
    for line in envfile.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())


def _clean(v: str | None) -> str | None:
    v = (v or "").strip()
    return v if _DATE_RE.match(v) else None


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args) -> None:  # keep the console quiet
        pass

    def _send(self, code: int, body: bytes, ctype: str) -> None:
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _json(self, code: int, obj) -> None:
        self._send(code, json.dumps(obj).encode("utf-8"), "application/json")

    def do_GET(self) -> None:
        path = self.path.split("?", 1)[0]
        qs = self.path.split("?", 1)[1] if "?" in self.path else ""
        params = urllib.parse.parse_qs(qs)

        if path == "/api/metrics":
            try:
                df = _clean(params.get("from", [""])[0])
                dt = _clean(params.get("to", [""])[0])
                print(f"Pulling metrics from HubSpot (from={df} to={dt}) ...")
                self._json(200, metrics.collect(df, dt))
            except Exception as e:
                traceback.print_exc()
                self._json(500, {"error": str(e)})
            return

        rel = "index.html" if path in ("/", "") else path.lstrip("/")
        f = (HERE / rel).resolve()
        if (HERE not in f.parents and f != HERE / rel) or not f.is_file():
            self._send(404, b"not found", "text/plain")
            return
        ctype = {".html": "text/html", ".js": "application/javascript",
                 ".css": "text/css", ".json": "application/json"}.get(f.suffix, "application/octet-stream")
        self._send(200, f.read_bytes(), ctype + "; charset=utf-8")


def main() -> None:
    _load_env()
    host = os.environ.get("HOST", "127.0.0.1")
    srv = ThreadingHTTPServer((host, PORT), Handler)
    where = "http://localhost" if host == "127.0.0.1" else "http://<this-PC-LAN-IP>"
    print(f"GTM Leadership Dashboard: {where}:{PORT}  (bind {host}, Ctrl+C to stop)")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nbye")


if __name__ == "__main__":
    main()
