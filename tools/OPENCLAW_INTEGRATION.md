OpenClaw Integration
====================

This document explains how the frontend, save server, and OpenClaw agent share user preferences.

Canonical configuration
- The canonical preferences path and server info live in `/.claude/settings.local.json` under `openclaw`:

  {
    "openclaw": {
      "preferences_path": "tools/last_preferences.json",
      "save_endpoint": "/save_preferences",
      "port": 8000
    }
  }

How data flows
- Frontend `Preferences` component POSTs the `UserPreferences` JSON to the save endpoint (`VITE_SAVE_PREFS_URL` or `http://localhost:8000/save_preferences`).
- `tools/save_preferences_server.py` accepts POSTs and atomically writes JSON to the `preferences_path`.
- OpenClaw can read the preferences by either:
  - Reading the file at `preferences_path` (recommended for simplicity and reliability), or
  - Using the `tools/openclaw_fetch_prefs.py` helper which loads `preferences_path` from `/.claude/settings.local.json` and prints the JSON to stdout.

Commands
- Start the save server (dev):
```bash
python3 tools/save_preferences_server.py
```
- Fetch the latest preferences (OpenClaw or script):
```bash
python3 tools/openclaw_fetch_prefs.py
# or
cat tools/last_preferences.json
```

Notes and recommendations
- The server does not require dependencies and performs atomic writes; OpenClaw should read the file after the frontend writes it.
- Ensure `.claude/settings.local.json` includes a `Read` permission for the chosen `preferences_path` (this repo already grants `Read(tools/**)`).
- If you prefer real-time notifications, extend the save server to emit a webhook or add a `GET /preferences` endpoint; otherwise periodic polling or reading the file is fine.

Security
- Only run the save server in environments you trust. The server writes whatever JSON it receives to the configured path.
- Consider adding authentication to the save endpoint if exposed beyond localhost.
