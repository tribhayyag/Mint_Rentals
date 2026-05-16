"""Compare real compiled-TS wizard output to the Python sim, and re-run the
shape/pipeline checks against the real output.

Usage:
    python3 tools/tests/test_real_ts.py <wizard_outputs.json>

Or, more typically, run the full pipeline via the wrapper:
    bash tools/tests/test_real_ts.sh
"""

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS_DIR = os.path.dirname(HERE)
sys.path.insert(0, TOOLS_DIR)
sys.path.insert(0, HERE)

from runner import test, check, main
from wizard_sim import to_user_preferences

from user_preference_parser import _default_preferences
from housing_listing_scraper import get_housing_listings, extract_preferences
from google_maps_commute import get_commute_info, _modes_for_preference
from crime_safety_rating import get_safety_rating


def _load(path: str) -> dict:
    with open(path) as f:
        data = json.load(f)
    if not isinstance(data, dict) or not data:
        raise RuntimeError(f"unexpected payload from wizard driver: {data!r}")
    return data


_PAYLOAD_PATH = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "_compiled", "wizard_outputs.json")
_PAYLOAD = _load(_PAYLOAD_PATH)


# === Section 1: TS output matches Python sim for every case ==================

@test("drift: every case from real TS matches Python sim byte-for-byte")
def _():
    mismatches = []
    for name, entry in _PAYLOAD.items():
        ts_prefs = entry["prefs"]
        py_prefs = to_user_preferences(entry["state"])
        if ts_prefs != py_prefs:
            mismatches.append((name, ts_prefs, py_prefs))
    check(
        not mismatches,
        f"{len(mismatches)} cases drift. First: {mismatches[0] if mismatches else None!r}",
    )


# === Section 2: TS output is valid JSON & schema-correct =====================

@test("ts: all real-output values are JSON-clean")
def _():
    for name, entry in _PAYLOAD.items():
        revived = json.loads(json.dumps(entry["prefs"]))
        check(revived == entry["prefs"], f"{name} fails JSON round-trip")


@test("ts: every case has all parser-required keys")
def _():
    parser_keys = set(_default_preferences().keys())
    for name, entry in _PAYLOAD.items():
        wizard_keys = set(entry["prefs"].keys())
        check(
            parser_keys.issubset(wizard_keys),
            f"{name} missing {parser_keys - wizard_keys}",
        )


@test("ts: every case has matching amenity sub-schema")
def _():
    parser_amen = set(_default_preferences()["amenities"].keys())
    for name, entry in _PAYLOAD.items():
        wizard_amen = set(entry["prefs"]["amenities"].keys())
        check(parser_amen == wizard_amen, f"{name}: amenity keys diverge")


# === Section 3: TS output flows through every tool ==========================

@test("ts: scraper accepts every case (status=success)")
def _():
    for name, entry in _PAYLOAD.items():
        r = get_housing_listings(entry["prefs"])
        check(r["status"] == "success", f"{name}: scraper returned {r['status']}")


@test("ts: extract_preferences round-trips every case")
def _():
    for name, entry in _PAYLOAD.items():
        check(extract_preferences(entry["prefs"]) == entry["prefs"], f"{name}: extract diverged")


@test("ts: commute envelope valid for first placeholder of every case")
def _():
    for name, entry in _PAYLOAD.items():
        r = get_housing_listings(entry["prefs"])
        if not r["data"]["listings"]:
            # Strict filter → no listings; not a tool bug, just a tight query
            continue
        c = get_commute_info(r["data"]["listings"][0], entry["prefs"])
        check(
            isinstance(c, dict) and {"status", "data", "error"} <= set(c.keys()),
            f"{name}: bad commute envelope",
        )
        check(
            c["data"]["transportation_preference"] == entry["prefs"]["transportation_preference"],
            f"{name}: commute transport mismatch",
        )


@test("ts: safety envelope valid for first placeholder of every case")
def _():
    for name, entry in _PAYLOAD.items():
        r = get_housing_listings(entry["prefs"])
        if not r["data"]["listings"]:
            continue
        s = get_safety_rating(r["data"]["listings"][0])
        check(
            isinstance(s, dict) and {"status", "data", "error"} <= set(s.keys()),
            f"{name}: bad safety envelope",
        )
        check("rating_scale" in s["data"], f"{name}: missing rating_scale")


# === Section 4: transport mapping coverage from real TS ======================

@test("ts: transport mapping verified for every observed transport")
def _():
    seen = {entry["prefs"]["transportation_preference"] for entry in _PAYLOAD.values()}
    for t in seen:
        modes = _modes_for_preference(t)
        check(len(modes) >= 1, f"transport {t!r} produced empty mode list")


# === Section 5: known-value spot checks ======================================

@test("ts: 'default' case has expected snapshot values")
def _():
    d = _PAYLOAD["default"]["prefs"]
    check(d["max_rent"] == 2000)
    check(d["min_rent"] == 500)
    check(d["general_location"] == "unknown")
    check(d["neighborhoods"] == [])
    check(d["destination_address"] == "UC Santa Cruz, Santa Cruz, CA")
    check(d["transportation_preference"] == "bus")
    check(d["max_commute_minutes"] == 30)
    check(d["property_type"] == "unknown")
    check(d["property_types"] == [])
    check(d["roommates"] == 1)
    check(d["room_type"] == "single")
    check(d["amenities"]["furnished"] == "either")
    check(d["amenities"]["laundry"] == "either")


@test("ts: 'multi_neighborhood_3' collapses to Santa Cruz with array preserved")
def _():
    d = _PAYLOAD["multi_neighborhood_3"]["prefs"]
    check(d["general_location"] == "Santa Cruz")
    check(d["neighborhoods"] == ["Westside", "Eastside", "Downtown"])


@test("ts: 'no_preference' wins over set neighborhoods")
def _():
    d = _PAYLOAD["no_preference"]["prefs"]
    check(d["general_location"] == "unknown")
    check(d["neighborhoods"] == [])


@test("ts: 'zero_roommates_furnished_no' carries the literal 0 and 'no'")
def _():
    d = _PAYLOAD["zero_roommates_furnished_no"]["prefs"]
    check(d["roommates"] == 0)
    check(d["amenities"]["furnished"] == "no")
    check(d["amenities"]["laundry"] == "in-unit")


@test("ts: 'budget_edge_equal' min==max preserved")
def _():
    d = _PAYLOAD["budget_edge_equal"]["prefs"]
    check(d["min_rent"] == 1500)
    check(d["max_rent"] == 1500)


if __name__ == "__main__":
    sys.exit(main(f"real-TS drift test ({len(_PAYLOAD)} cases)"))
