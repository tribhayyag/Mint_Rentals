"""Comprehensive integration tests: wizard preferences → Python tools.

Runs the wizard mapping in Python (via wizard_sim) and feeds its outputs
through every tool to verify shape compatibility and pipeline behavior.
A separate test (test_real_ts.py) confirms wizard_sim matches the actual
compiled TypeScript.

Run from repo root:
    python3 tools/tests/test_wizard_to_tools.py
"""

import itertools
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS_DIR = os.path.dirname(HERE)
REPO_ROOT = os.path.dirname(TOOLS_DIR)
sys.path.insert(0, TOOLS_DIR)
sys.path.insert(0, HERE)

from runner import test, check, main
from wizard_sim import (
    to_user_preferences,
    make_state,
    INITIAL_WIZARD_STATE,
    SANTA_CRUZ_NEIGHBORHOODS,
    DEFAULT_DESTINATION,
)

from user_preference_parser import _default_preferences
from housing_listing_scraper import (
    get_housing_listings,
    extract_preferences,
    listing_matches_preferences,
    get_placeholder_listings,
)
from google_maps_commute import get_commute_info, _modes_for_preference
from crime_safety_rating import get_safety_rating


# === Section 1: Schema parity =================================================

@test("schema: all parser-required top-level keys present")
def _():
    prefs = to_user_preferences(make_state())
    parser_keys = set(_default_preferences().keys())
    wizard_keys = set(prefs.keys())
    check(
        parser_keys.issubset(wizard_keys),
        f"missing keys: {parser_keys - wizard_keys}",
    )


@test("schema: amenity sub-schema exactly matches parser")
def _():
    prefs = to_user_preferences(make_state())
    parser_amen = set(_default_preferences()["amenities"].keys())
    wizard_amen = set(prefs["amenities"].keys())
    check(
        parser_amen == wizard_amen,
        f"diff: parser-only={parser_amen - wizard_amen}, "
        f"wizard-only={wizard_amen - parser_amen}",
    )


@test("schema: top-level values have expected types")
def _():
    prefs = to_user_preferences(make_state())
    check(isinstance(prefs["max_rent"], int), "max_rent should be int")
    check(isinstance(prefs["min_rent"], int), "min_rent should be int")
    check(isinstance(prefs["general_location"], str), "general_location should be str")
    check(isinstance(prefs["neighborhoods"], list), "neighborhoods should be list")
    check(isinstance(prefs["destination_address"], str), "destination should be str")
    check(isinstance(prefs["transportation_preference"], str), "transport should be str")
    check(isinstance(prefs["max_commute_minutes"], int), "max_commute should be int")
    check(isinstance(prefs["property_type"], str), "property_type should be str")
    check(isinstance(prefs["property_types"], list), "property_types should be list")
    check(isinstance(prefs["roommates"], int), "roommates should be int")
    check(isinstance(prefs["room_type"], str), "room_type should be str")
    check(isinstance(prefs["amenities"], dict), "amenities should be dict")


# === Section 2: JSON round-trip ==============================================

@test("json: survives stringify/parse round-trip")
def _():
    prefs = to_user_preferences(make_state(neighborhoods=["Westside"], petFriendly="yes"))
    revived = json.loads(json.dumps(prefs))
    check(revived == prefs, "json round-trip changed the value")


@test("json: no python-only types leak")
def _():
    prefs = to_user_preferences(make_state())
    serialized = json.dumps(prefs)
    check(isinstance(serialized, str) and len(serialized) > 0, "did not serialize")


# === Section 3: extract_preferences accepts all wrap forms ====================

@test("extract: accepts bare wizard dict (no wrapper)")
def _():
    prefs = to_user_preferences(make_state())
    check(extract_preferences(prefs) == prefs, "bare dict not returned identity")


@test("extract: accepts {preferences: ...} wrap")
def _():
    prefs = to_user_preferences(make_state())
    check(extract_preferences({"preferences": prefs}) == prefs)


@test("extract: accepts {preferences_used: ...} wrap")
def _():
    prefs = to_user_preferences(make_state())
    check(extract_preferences({"preferences_used": prefs}) == prefs)


@test("extract: accepts parser-style {data: {preferences: ...}} wrap")
def _():
    prefs = to_user_preferences(make_state())
    check(extract_preferences({"data": {"preferences": prefs}}) == prefs)


@test("extract: accepts scraper-style {data: {preferences_used: ...}} wrap")
def _():
    prefs = to_user_preferences(make_state())
    check(extract_preferences({"data": {"preferences_used": prefs}}) == prefs)


@test("extract: returns {} for non-dict input")
def _():
    check(extract_preferences("not a dict") == {})
    check(extract_preferences(None) == {})
    check(extract_preferences(123) == {})
    check(extract_preferences([]) == {})


# === Section 4: every transportation mode ====================================

@test("transport: all 4 UI modes map to non-empty Google Maps modes")
def _():
    for ui_mode in ["bus", "biking", "walking", "driving"]:
        prefs = to_user_preferences(make_state(transportation=ui_mode))
        modes = _modes_for_preference(prefs["transportation_preference"])
        check(len(modes) >= 1, f"{ui_mode} produced empty mode list")


@test("transport: bus → transit")
def _():
    modes = _modes_for_preference("bus")
    check(modes == ["transit"], f"expected ['transit'], got {modes}")


@test("transport: biking → bicycling")
def _():
    modes = _modes_for_preference("biking")
    check(modes == ["bicycling"], f"expected ['bicycling'], got {modes}")


@test("transport: driving → driving")
def _():
    modes = _modes_for_preference("driving")
    check(modes == ["driving"], f"expected ['driving'], got {modes}")


@test("transport: walking → walking")
def _():
    modes = _modes_for_preference("walking")
    check(modes == ["walking"], f"expected ['walking'], got {modes}")


@test("transport: 'either' falls back to all 4 modes")
def _():
    modes = _modes_for_preference("either")
    check(set(modes) == {"transit", "driving", "walking", "bicycling"})


@test("transport: 'unknown' falls back to all 4 modes")
def _():
    modes = _modes_for_preference("unknown")
    check(set(modes) == {"transit", "driving", "walking", "bicycling"})


# === Section 5: neighborhood mapping =========================================

@test("neighborhoods: empty → general_location='unknown'")
def _():
    prefs = to_user_preferences(make_state())
    check(prefs["general_location"] == "unknown")
    check(prefs["neighborhoods"] == [])


@test("neighborhoods: noPreference=True ignores any set neighborhoods")
def _():
    prefs = to_user_preferences(make_state(
        noNeighborhoodPreference=True,
        neighborhoods=["Westside", "Eastside"],
    ))
    check(prefs["general_location"] == "unknown")
    check(prefs["neighborhoods"] == [])


@test("neighborhoods: each of 8 single-select round-trips")
def _():
    for n in SANTA_CRUZ_NEIGHBORHOODS:
        prefs = to_user_preferences(make_state(neighborhoods=[n]))
        check(prefs["general_location"] == n, f"{n} → got {prefs['general_location']!r}")
        check(prefs["neighborhoods"] == [n])


@test("neighborhoods: multi-select collapses general_location to 'Santa Cruz'")
def _():
    prefs = to_user_preferences(make_state(neighborhoods=["Westside", "Eastside"]))
    check(prefs["general_location"] == "Santa Cruz")
    check(prefs["neighborhoods"] == ["Westside", "Eastside"])


@test("neighborhoods: select-all preserves all 8 in array")
def _():
    prefs = to_user_preferences(make_state(neighborhoods=list(SANTA_CRUZ_NEIGHBORHOODS)))
    check(prefs["general_location"] == "Santa Cruz")
    check(len(prefs["neighborhoods"]) == 8)
    check(set(prefs["neighborhoods"]) == set(SANTA_CRUZ_NEIGHBORHOODS))


# === Section 6: property type mapping ========================================

@test("property: 0 types → property_type='unknown', empty array")
def _():
    prefs = to_user_preferences(make_state(propertyTypes=[]))
    check(prefs["property_type"] == "unknown")
    check(prefs["property_types"] == [])


@test("property: 1 type → property_type=that type, array preserved")
def _():
    for t in ["apartment", "house", "sublease"]:
        prefs = to_user_preferences(make_state(propertyTypes=[t]))
        check(prefs["property_type"] == t, f"got {prefs['property_type']!r} for {t}")
        check(prefs["property_types"] == [t])


@test("property: multi-select → property_type='unknown', array preserved")
def _():
    prefs = to_user_preferences(make_state(propertyTypes=["apartment", "house"]))
    check(prefs["property_type"] == "unknown")
    check(prefs["property_types"] == ["apartment", "house"])


# === Section 7: amenity tri-state filter behavior ============================

def _base_listing():
    return {
        "listing_id": "t1",
        "price": 1200,
        "address": "100 X St, Santa Cruz",
        "general_location": "Santa Cruz",
        "property_type": "apartment",
        "room_type": "single",
        "amenities": {
            "pet_friendly": "unknown",
            "parking": "unknown",
            "accessible": "unknown",
            "furnished": "unknown",
            "laundry": "unknown",
        },
    }


def _permissive_prefs(**overrides):
    p = to_user_preferences(make_state(
        maxRent=2500,
        neighborhoods=[],
        roomType="unknown",
        furnished="either",
        laundry="either",
    ))
    for k, v in overrides.items():
        if k == "amenities":
            p["amenities"] = {**p["amenities"], **v}
        else:
            p[k] = v
    return p


@test("amenity: pref=yes, listing=yes → match (each of pet/parking/accessible)")
def _():
    for key in ["pet_friendly", "parking", "accessible"]:
        l = _base_listing()
        l["amenities"][key] = "yes"
        p = _permissive_prefs(amenities={key: "yes"})
        check(listing_matches_preferences(l, p), f"{key} yes=yes failed")


@test("amenity: pref=yes, listing=no → reject (pet/parking/accessible)")
def _():
    for key in ["pet_friendly", "parking", "accessible"]:
        l = _base_listing()
        l["amenities"][key] = "no"
        p = _permissive_prefs(amenities={key: "yes"})
        check(not listing_matches_preferences(l, p), f"{key} yes vs no not rejected")


@test("amenity: pref=yes, listing=unknown → match (unknowns pass)")
def _():
    for key in ["pet_friendly", "parking", "accessible"]:
        l = _base_listing()
        p = _permissive_prefs(amenities={key: "yes"})
        check(listing_matches_preferences(l, p), f"{key} yes vs unknown filtered out")


@test("amenity: pref=unknown → never filters")
def _():
    for key in ["pet_friendly", "parking", "accessible", "furnished", "laundry"]:
        l = _base_listing()
        l["amenities"][key] = "no" if key != "laundry" else "shared"
        p = _permissive_prefs()  # all amenities at defaults; pet/parking/accessible=unknown
        # furnished default is "either" which also passes
        if key == "laundry":
            check(listing_matches_preferences(l, p), "laundry either-pref filtered listing")
        else:
            check(listing_matches_preferences(l, p), f"{key} unknown-pref filtered listing")


@test("amenity: furnished pref=either always passes regardless of listing")
def _():
    for listing_value in ["yes", "no", "unknown"]:
        l = _base_listing()
        l["amenities"]["furnished"] = listing_value
        p = _permissive_prefs(amenities={"furnished": "either"})
        check(listing_matches_preferences(l, p), f"furnished either vs {listing_value} filtered")


@test("amenity: laundry pref=either always passes regardless of listing")
def _():
    for listing_value in ["in-unit", "shared", "either", "unknown"]:
        l = _base_listing()
        l["amenities"]["laundry"] = listing_value
        p = _permissive_prefs(amenities={"laundry": "either"})
        check(listing_matches_preferences(l, p), f"laundry either vs {listing_value} filtered")


@test("amenity: furnished pref=yes filters listing furnished=no")
def _():
    l = _base_listing()
    l["amenities"]["furnished"] = "no"
    p = _permissive_prefs(amenities={"furnished": "yes"})
    check(not listing_matches_preferences(l, p), "furnished yes vs no not rejected")


@test("amenity: laundry pref=in-unit filters listing laundry=shared")
def _():
    l = _base_listing()
    l["amenities"]["laundry"] = "shared"
    p = _permissive_prefs(amenities={"laundry": "in-unit"})
    check(not listing_matches_preferences(l, p), "laundry in-unit vs shared not rejected")


# === Section 8: room/property/price filters ==================================

@test("room_type: single=single matches, single vs shared rejects")
def _():
    l = _base_listing()
    l["room_type"] = "single"
    p = _permissive_prefs(room_type="single")
    check(listing_matches_preferences(l, p), "single=single failed")
    l["room_type"] = "shared"
    check(not listing_matches_preferences(l, p), "single vs shared not rejected")


@test("room_type: unknown pref doesn't filter on room_type")
def _():
    l = _base_listing()
    l["room_type"] = "shared"
    p = _permissive_prefs(room_type="unknown")
    check(listing_matches_preferences(l, p), "unknown pref filtered on room_type")


@test("property_type: unknown pref allows any property type (multi-select case)")
def _():
    for pt in ["apartment", "house", "sublease", "room", "unknown"]:
        l = _base_listing()
        l["property_type"] = pt
        p = _permissive_prefs(property_type="unknown")
        check(listing_matches_preferences(l, p), f"property_type unknown filtered {pt}")


@test("price: max_rent filters listings strictly above max")
def _():
    l = _base_listing()
    l["price"] = 1500
    p = _permissive_prefs(max_rent=1400)
    check(not listing_matches_preferences(l, p), "price above max_rent not rejected")
    p = _permissive_prefs(max_rent=1500)
    check(listing_matches_preferences(l, p), "price == max_rent rejected")
    p = _permissive_prefs(max_rent=1600)
    check(listing_matches_preferences(l, p), "price below max_rent rejected")


# === Section 9: edge values ==================================================

@test("edge: zero roommates is preserved as int 0")
def _():
    prefs = to_user_preferences(make_state(roommates=0))
    check(prefs["roommates"] == 0)
    check(isinstance(prefs["roommates"], int))


@test("edge: high roommate counts pass through")
def _():
    prefs = to_user_preferences(make_state(roommates=8))
    check(prefs["roommates"] == 8)


@test("edge: min_rent==max_rent valid")
def _():
    prefs = to_user_preferences(make_state(minRent=1200, maxRent=1200))
    check(prefs["min_rent"] == 1200 and prefs["max_rent"] == 1200)


@test("edge: max_commute_minutes=5 (lowest slider value)")
def _():
    prefs = to_user_preferences(make_state(maxCommuteMinutes=5))
    check(prefs["max_commute_minutes"] == 5)


@test("edge: max_commute_minutes=90 (highest slider value)")
def _():
    prefs = to_user_preferences(make_state(maxCommuteMinutes=90))
    check(prefs["max_commute_minutes"] == 90)


@test("edge: destination_address is always UCSC default")
def _():
    prefs = to_user_preferences(make_state())
    check(prefs["destination_address"] == DEFAULT_DESTINATION)
    check(prefs["destination_address"] == "UC Santa Cruz, Santa Cruz, CA")


# === Section 10: full pipeline behaviors =====================================

@test("pipeline: scraper returns {status, data, error} envelope")
def _():
    prefs = to_user_preferences(make_state())
    r = get_housing_listings(prefs)
    check(isinstance(r, dict))
    check({"status", "data", "error"} <= set(r.keys()))


@test("pipeline: scraper returns >=1 listing for permissive query")
def _():
    prefs = to_user_preferences(make_state(maxRent=1600, roomType="unknown"))
    r = get_housing_listings(prefs)
    check(r["status"] == "success")
    check(r["data"]["results_count"] >= 1, f"got {r['data']['results_count']} listings")


@test("pipeline: each returned listing has required keys")
def _():
    prefs = to_user_preferences(make_state(maxRent=1600, roomType="unknown"))
    r = get_housing_listings(prefs)
    required = {"listing_id", "price", "address", "neighborhood", "general_location",
                "property_type", "room_type", "amenities", "lat", "lng"}
    for l in r["data"]["listings"]:
        check(required <= set(l.keys()), f"missing: {required - set(l.keys())}")


@test("pipeline: commute envelope and field shape correct")
def _():
    prefs = to_user_preferences(make_state(maxRent=1600, roomType="unknown"))
    listings = get_housing_listings(prefs)["data"]["listings"]
    check(len(listings) > 0)
    c = get_commute_info(listings[0], prefs)
    check({"status", "data", "error"} <= set(c.keys()))
    check({"listing_id", "origin_address", "origin_lat", "origin_lng",
           "destination_address", "transportation_preference",
           "commute_options", "best_option", "used_fallback_data",
           "data_source"} <= set(c["data"].keys()))


@test("pipeline: commute echoes prefs.transportation_preference")
def _():
    for t in ["bus", "biking", "walking", "driving"]:
        prefs = to_user_preferences(make_state(maxRent=1600, roomType="unknown", transportation=t))
        listings = get_housing_listings(prefs)["data"]["listings"]
        check(len(listings) > 0)
        c = get_commute_info(listings[0], prefs)
        check(c["data"]["transportation_preference"] == t,
              f"{t}: commute returned {c['data']['transportation_preference']!r}")


@test("pipeline: commute falls back cleanly without GOOGLE_MAPS_API_KEY")
def _():
    # We don't set the env var in tests, so this should always fall back.
    prefs = to_user_preferences(make_state(maxRent=1600, roomType="unknown"))
    listings = get_housing_listings(prefs)["data"]["listings"]
    c = get_commute_info(listings[0], prefs)
    check(c["data"]["used_fallback_data"] is True or os.environ.get("GOOGLE_MAPS_API_KEY"))


@test("pipeline: safety envelope and field shape correct")
def _():
    prefs = to_user_preferences(make_state(maxRent=1600, roomType="unknown"))
    listings = get_housing_listings(prefs)["data"]["listings"]
    s = get_safety_rating(listings[0])
    check({"status", "data", "error"} <= set(s.keys()))
    check({"listing_id", "address", "neighborhood", "general_location",
           "safety_rating", "rating_scale", "risk_level", "summary",
           "data_source", "limitations", "used_fallback_data"} <= set(s["data"].keys()))


@test("pipeline: safety status=success even without FBI_API_KEY")
def _():
    prefs = to_user_preferences(make_state(maxRent=1600, roomType="unknown"))
    listings = get_housing_listings(prefs)["data"]["listings"]
    s = get_safety_rating(listings[0])
    if not os.environ.get("FBI_API_KEY"):
        check(s["status"] == "success", "no API key should still succeed via fallback")
        check(s["data"]["used_fallback_data"] is True)


# === Section 11: fuzz — no exceptions across many combos =====================

@test("fuzz: all transport × room × pet × prop_types combos run without crashing")
def _():
    transports = ["bus", "biking", "walking", "driving"]
    rooms = ["single", "shared", "unknown"]
    pets = ["yes", "unknown"]
    prop_combos = [[], ["apartment"], ["house"], ["sublease"],
                   ["apartment", "house"], ["apartment", "house", "sublease"]]
    total = 0
    crashes = 0
    for t, r, p, pt in itertools.product(transports, rooms, pets, prop_combos):
        total += 1
        try:
            prefs = to_user_preferences(make_state(
                transportation=t, roomType=r, petFriendly=p,
                propertyTypes=pt, maxRent=2500,
            ))
            res = get_housing_listings(prefs)
            assert res["status"] in ("success", "error")
        except Exception as e:
            crashes += 1
            print(f"      crash on t={t} r={r} p={p} pt={pt}: {e}")
    check(crashes == 0, f"{crashes}/{total} combos crashed")


@test("fuzz: every neighborhood passed singly survives the pipeline")
def _():
    for n in SANTA_CRUZ_NEIGHBORHOODS:
        prefs = to_user_preferences(make_state(neighborhoods=[n], maxRent=2500, roomType="unknown"))
        r = get_housing_listings(prefs)
        check(r["status"] == "success", f"{n}: status was {r['status']}")


# === Section 12: placeholder listing inherits prefs ==========================

@test("placeholder: general_location threads through to listings")
def _():
    prefs = to_user_preferences(make_state(neighborhoods=["Westside"]))
    listings = get_placeholder_listings(prefs)
    for l in listings:
        check(l["general_location"] == "Westside",
              f"got {l['general_location']!r}")


@test("placeholder: multi-neighborhood threads 'Santa Cruz' through")
def _():
    prefs = to_user_preferences(make_state(neighborhoods=["Westside", "Eastside"]))
    listings = get_placeholder_listings(prefs)
    for l in listings:
        check(l["general_location"] == "Santa Cruz")


@test("placeholder: noPreference threads 'Santa Cruz' default through")
def _():
    prefs = to_user_preferences(make_state(noNeighborhoodPreference=True))
    listings = get_placeholder_listings(prefs)
    # general_location="unknown" → placeholder defaults to "Santa Cruz"
    for l in listings:
        check(l["general_location"] == "Santa Cruz")


if __name__ == "__main__":
    sys.exit(main("wizard → tools integration"))
