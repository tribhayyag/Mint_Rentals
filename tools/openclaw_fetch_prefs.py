#!/usr/bin/env python3
"""
CLI helper for OpenClaw: prints the latest preferences JSON to stdout.

Usage:
  python3 tools/openclaw_fetch_prefs.py

It reads the canonical `preferences_path` from `/.claude/settings.local.json` if present,
otherwise falls back to `tools/last_preferences.json`.
"""
import json
import os
import sys


def get_settings_path():
    repo_root = os.path.dirname(os.path.dirname(__file__))
    return os.path.join(repo_root, ".claude", "settings.local.json")


def load_preferences_path():
    default = os.path.join("tools", "last_preferences.json")
    try:
        with open(get_settings_path(), "r", encoding="utf-8") as f:
            cfg = json.load(f)
            oc = cfg.get("openclaw", {})
            return oc.get("preferences_path") or default
    except Exception:
        return default


def main():
    prefs_path = load_preferences_path()
    if not os.path.exists(prefs_path):
        print("{}".format("{}"), end="")
        sys.exit(1)
    try:
        with open(prefs_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        json.dump(data, sys.stdout, indent=2, ensure_ascii=False)
        print()
        sys.exit(0)
    except Exception as e:
        print(f"Error reading preferences: {e}", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
