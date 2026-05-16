# Tools

Python tool scripts the nemoclaw orchestrator calls during a user's housing search.

## Files

- `user_preference_parser.py` — converts raw user text into structured preferences (no LLM, no API).
- `housing_listing_scraper.py` — scrapes Craigslist and Redfin (when URLs are provided); falls back to clearly labeled placeholders otherwise.
- `google_maps_commute.py` — Google Maps Directions API for commute time + origin lat/lng.
- `crime_safety_rating.py` — FBI Crime Data Explorer API for agency-level safety scoring.

Each tool exposes one main function and returns `{"status", "data", "error"}`. Each file is independently runnable — `python3 <file>.py` runs its own test block.

## External data sources

| Tool | Source | Notes |
|------|--------|-------|
| commute | Google Maps Directions API | Server-side. Same Google Cloud project as your frontend Maps JS key. |
| safety | FBI Crime Data Explorer | Agency-level (police department), not address-level. Best-guess endpoint — verify against your key. |
| listings | Craigslist scrape | Pass `craigslist_url` to the tool. Falls back if request/parse fails. |
| listings | Redfin scrape | Redfin is JS-rendered, so static-HTML scraping rarely yields listings. Tool reports this in `source_errors` and falls back. |

## Setup: API keys

Two keys are read from environment variables: `GOOGLE_MAPS_API_KEY` and `FBI_API_KEY`. Both are server-side — the frontend never sees them.

**Never commit keys.** The repo root `.gitignore` keeps `.env` out of git.

### Google Maps Platform key

In Google Cloud Console, on the same project as your frontend Maps JS key:
1. Enable **Maps JavaScript API** (frontend map widget).
2. Enable **Directions API** (commute tool — server-side).
3. Enable **Geocoding API** (origin lat/lng — already returned by Directions, but keep enabled for future use).
4. Restrict the key by HTTP referrer for the frontend, and ideally use a separate IP-restricted key for server-side calls. For a hackathon, one unrestricted key works but is risky if leaked.

### FBI Crime Data API key

Sign up at https://api.data.gov/signup/ — the same key works across api.data.gov-hosted APIs including the FBI Crime Data Explorer.

The crime tool calls `https://api.usa.gov/crime/fbi/cde/summarized/agency/{ori}/offenses` with `API_KEY` as a query param. This endpoint pattern is a best guess; if your key returns an unexpected shape, the tool falls back cleanly and logs the error. Verify against the current CDE docs once you have the key.

### One-time setup

From the repo root:

```bash
cp .env.example .env
```

Open `.env` and replace the placeholder values with real keys.

### Loading the keys before running

The tools read keys from environment variables, so `.env` needs to be loaded into your shell. From the repo root:

```bash
source .env
```

This exports both keys into your current shell. Do this once per terminal. Then run any tool:

```bash
python3 tools/google_maps_commute.py
python3 tools/crime_safety_rating.py
```

Verify keys are loaded:

```bash
echo $GOOGLE_MAPS_API_KEY
echo $FBI_API_KEY
```

## Note for the nemoclaw orchestrator prompt

The commute tool now returns `origin_lat` and `origin_lng` at the top level of `data` (extracted from the Directions response — no extra API call). The frontend needs these to render map markers.

In the orchestrator prompt's **Field Normalization** section, the current commute mapping is:

```
best_option.duration_minutes → commute_minutes
best_option.mode → commute_mode
best_option.route_summary → commute_summary
best_option.distance_miles → commute_distance_miles
```

Add two more rules so the compact card gets coordinates:

```
origin_lat → lat
origin_lng → lng
```

With this, nemoclaw's **MAP rule** (`ui.show_map = true` only if at least one listing has real lat/lng) will fire correctly whenever Directions returns a successful route.

## Security notes

- API keys live only on the machine running the tools. Architecture: browser → backend → tools → Google/FBI.
- Restrict keys in their respective consoles (Google Cloud Console for Maps; api.data.gov has no per-key restrictions, so rotate if leaked).
- If a key is ever pushed to GitHub, **rotate it immediately**. Removing from git history alone is insufficient.
