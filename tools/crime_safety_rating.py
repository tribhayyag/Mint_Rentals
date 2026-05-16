import json
import os

try:
    import requests
except ImportError:
    requests = None


RATING_SCALE = "1 = highest concern, 10 = lowest concern"
DEFAULT_LIMITATIONS = [
    "Safety data is area-level (police agency), not exact-address.",
    "This score should be used as one factor, not a guarantee.",
]

# Best-guess FBI Crime Data Explorer (CDE) endpoint. Auth: api.data.gov key as
# `API_KEY` query param. The CDE host has shifted over the years; if a request
# returns 404 or an unexpected shape, the tool falls back cleanly.
FBI_CDE_BASE = "https://api.usa.gov/crime/fbi/cde"
REQUEST_TIMEOUT = 15

# Minimal ORI lookup. Add more entries as needed; if no entry matches, the tool
# falls back. ORIs are FBI Originating Agency Identifiers.
ORI_LOOKUP = {
    "santa cruz": "CA0440100",  # Santa Cruz Police Department (best-guess)
}

# Rough resident populations used to normalize counts to per-1000-resident rates.
POPULATION_LOOKUP = {
    "CA0440100": 62000,
}

# National baseline used purely to bucket the per-1000 rate. Calibration is
# coarse — hackathon-grade, not statistically rigorous.
LOW_RATE_PER_1000 = 25
HIGH_RATE_PER_1000 = 60


def _empty_response(listing_id, address, neighborhood, general_location):
    return {
        "listing_id": listing_id,
        "address": address,
        "neighborhood": neighborhood,
        "general_location": general_location,
        "safety_rating": None,
        "rating_scale": RATING_SCALE,
        "risk_level": "unknown",
        "summary": "unknown",
        "data_source": "placeholder_fallback",
        "limitations": list(DEFAULT_LIMITATIONS),
        "used_fallback_data": True,
    }


def _lookup_ori(neighborhood, general_location, address):
    haystack = " ".join(str(x or "") for x in (neighborhood, general_location, address)).lower()
    for key, ori in ORI_LOOKUP.items():
        if key in haystack:
            return ori
    return None


def _extract_total_offenses(payload):
    """Defensive extractor — the CDE response shape has shifted across versions.

    Returns the most plausible total offense count or None if nothing matches.
    """
    if not isinstance(payload, dict):
        return None

    # Common shapes seen in CDE responses: top-level "results" list of yearly
    # offense rows, or a "data" dict keyed by offense type with counts.
    results = payload.get("results")
    if isinstance(results, list) and results:
        total = 0
        found_any = False
        for row in results:
            if not isinstance(row, dict):
                continue
            for field in ("actual", "count", "value", "offense_count"):
                v = row.get(field)
                if isinstance(v, (int, float)):
                    total += int(v)
                    found_any = True
                    break
        if found_any:
            return total

    data = payload.get("data")
    if isinstance(data, dict):
        total = 0
        found_any = False
        for v in data.values():
            if isinstance(v, (int, float)):
                total += int(v)
                found_any = True
            elif isinstance(v, dict):
                for inner in v.values():
                    if isinstance(inner, (int, float)):
                        total += int(inner)
                        found_any = True
        if found_any:
            return total

    return None


def _score_from_rate(rate_per_1000):
    """Map per-1000 crime rate to a 1-10 score and risk level."""
    if rate_per_1000 is None:
        return None, "unknown"
    if rate_per_1000 <= LOW_RATE_PER_1000:
        rating = 9
        risk = "low"
    elif rate_per_1000 >= HIGH_RATE_PER_1000:
        rating = 3
        risk = "high"
    else:
        span = HIGH_RATE_PER_1000 - LOW_RATE_PER_1000
        position = (rate_per_1000 - LOW_RATE_PER_1000) / span
        rating = round(9 - position * 6)
        risk = "medium"
    return rating, risk


def _call_fbi_cde(ori, api_key, year):
    if requests is None:
        return None, "requests library not installed"
    url = f"{FBI_CDE_BASE}/summarized/agency/{ori}/offenses"
    params = {"from": str(year), "to": str(year), "API_KEY": api_key}
    try:
        resp = requests.get(url, params=params, timeout=REQUEST_TIMEOUT)
    except Exception as e:
        return None, f"Request failed: {e}"

    if resp.status_code != 200:
        return None, f"HTTP {resp.status_code}"

    try:
        payload = resp.json()
    except Exception as e:
        return None, f"JSON parse failed: {e}"

    total = _extract_total_offenses(payload)
    if total is None:
        return None, "Unexpected response shape; no offense counts found"

    return total, None


def get_safety_rating(listing):
    if not isinstance(listing, dict):
        data = _empty_response("unknown", "unknown", "unknown", "unknown")
        data["summary"] = "Invalid listing input."
        return {
            "status": "error",
            "data": data,
            "error": "listing must be a dict",
        }

    listing_id = listing.get("listing_id", "unknown")
    address = listing.get("address", "unknown")
    neighborhood = listing.get("neighborhood", "unknown")
    general_location = listing.get("general_location", "unknown")
    fallback = _empty_response(listing_id, address, neighborhood, general_location)

    api_key = os.environ.get("FBI_API_KEY")
    if not api_key:
        fallback["summary"] = "FBI_API_KEY not set; returning placeholder safety data."
        return {"status": "success", "data": fallback, "error": None}

    ori = _lookup_ori(neighborhood, general_location, address)
    if not ori:
        fallback["summary"] = (
            "No agency ORI mapped for this location; safety data unavailable."
        )
        fallback["limitations"].append(
            "Agency-level lookup requires an ORI mapping for the listing's city."
        )
        return {"status": "success", "data": fallback, "error": None}

    total, err = _call_fbi_cde(ori, api_key, year=2022)
    if err is not None:
        fallback["summary"] = "FBI Crime Data Explorer call did not return usable data."
        fallback["limitations"].append(f"FBI CDE error: {err}")
        return {"status": "error", "data": fallback, "error": err}

    population = POPULATION_LOOKUP.get(ori)
    if not population or population <= 0:
        fallback["summary"] = (
            f"FBI returned {total} offenses for ORI {ori}, but no population baseline "
            "is configured to normalize; cannot compute a per-capita score."
        )
        return {"status": "success", "data": fallback, "error": None}

    rate_per_1000 = (total / population) * 1000
    rating, risk = _score_from_rate(rate_per_1000)

    return {
        "status": "success",
        "data": {
            "listing_id": listing_id,
            "address": address,
            "neighborhood": neighborhood,
            "general_location": general_location,
            "safety_rating": rating,
            "rating_scale": RATING_SCALE,
            "risk_level": risk,
            "summary": (
                f"Agency {ori} reported {total} offenses in 2022 "
                f"(~{rate_per_1000:.1f} per 1,000 residents). "
                "Coarse hackathon-grade scoring; use as one factor only."
            ),
            "data_source": "fbi_crime_data_api",
            "limitations": [
                "Safety data is area-level (police agency), not exact-address.",
                "This score should be used as one factor, not a guarantee.",
                "Per-capita normalization uses a hardcoded population estimate.",
                "Scoring thresholds are coarse and not statistically calibrated.",
            ],
            "used_fallback_data": False,
        },
        "error": None,
    }


if __name__ == "__main__":
    fake_listing = {
        "listing_id": "fallback_1",
        "address": "100 High St, Santa Cruz, CA 95064",
        "neighborhood": "Westside",
        "general_location": "Santa Cruz",
    }
    result = get_safety_rating(fake_listing)
    print(json.dumps(result, indent=2))