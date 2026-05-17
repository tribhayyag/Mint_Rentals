import json
import re

try:
    import requests
except ImportError:
    requests = None

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None


USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
)
REQUEST_TIMEOUT = 15


def _empty_listing():
    return {
        "listing_id": "unknown",
        "source": "unknown",
        "title": "unknown",
        "price": None,
        "address": "unknown",
        "neighborhood": "unknown",
        "general_location": "unknown",
        "lat": None,
        "lng": None,
        "property_type": "unknown",
        "room_type": "unknown",
        "roommates": None,
        "amenities": {
            "pet_friendly": "unknown",
            "parking": "unknown",
            "accessible": "unknown",
            "furnished": "unknown",
            "laundry": "unknown",
        },
        "listing_contact": {
            "contact_type": "unknown",
            "name": "not_publicly_visible",
            "phone": "not_publicly_visible",
            "email": "not_publicly_visible",
            "contact_url": "unknown",
            "notes": "Only publicly visible contact information included.",
        },
        "url": "unknown",
        "description": "unknown",
        "posting_date": "unknown",
        "match_notes": [],
        "data_source": "unknown",
        "used_fallback_data": False,
    }


def extract_preferences(preference_json):
    if not isinstance(preference_json, dict):
        return {}
    if "data" in preference_json and isinstance(preference_json["data"], dict):
        data = preference_json["data"]
        prefs = data.get("preferences") or data.get("preferences_used") or {}
    elif "preferences" in preference_json:
        prefs = preference_json["preferences"]
    elif "preferences_used" in preference_json:
        prefs = preference_json["preferences_used"]
    else:
        prefs = preference_json
    return prefs if isinstance(prefs, dict) else {}


def _extract_price(text):
    if not text:
        return None
    m = re.search(r"\$\s*(\d{3,5})", text)
    return int(m.group(1)) if m else None


def normalize_listing(raw_listing, source):
    listing = _empty_listing()
    listing["source"] = source
    listing["data_source"] = source

    if not isinstance(raw_listing, dict):
        return listing

    for key in (
        "listing_id",
        "title",
        "address",
        "neighborhood",
        "general_location",
        "property_type",
        "room_type",
        "url",
        "description",
        "posting_date",
    ):
        v = raw_listing.get(key)
        if v not in (None, ""):
            listing[key] = v

    price = raw_listing.get("price")
    if isinstance(price, (int, float)):
        listing["price"] = int(price)
    elif isinstance(price, str):
        listing["price"] = _extract_price(price)

    roommates = raw_listing.get("roommates")
    if isinstance(roommates, int):
        listing["roommates"] = roommates

    lat = raw_listing.get("lat")
    if isinstance(lat, (int, float)):
        listing["lat"] = float(lat)
    lng = raw_listing.get("lng")
    if isinstance(lng, (int, float)):
        listing["lng"] = float(lng)

    amenities = raw_listing.get("amenities")
    if isinstance(amenities, dict):
        for k in listing["amenities"]:
            if k in amenities and amenities[k]:
                listing["amenities"][k] = amenities[k]

    contact = raw_listing.get("listing_contact")
    if isinstance(contact, dict):
        for k in listing["listing_contact"]:
            if k in contact and contact[k]:
                listing["listing_contact"][k] = contact[k]

    return listing


def listing_matches_preferences(listing, preferences):
    if not isinstance(listing, dict) or not isinstance(preferences, dict):
        return False

    max_rent = preferences.get("max_rent")
    price = listing.get("price")
    if isinstance(max_rent, (int, float)) and isinstance(price, (int, float)):
        if price > max_rent:
            return False

    gen_loc = preferences.get("general_location")
    if isinstance(gen_loc, str) and gen_loc not in ("", "unknown"):
        listing_loc = (listing.get("general_location") or "").lower()
        listing_addr = (listing.get("address") or "").lower()
        if gen_loc.lower() not in listing_loc and gen_loc.lower() not in listing_addr:
            return False

    pt = preferences.get("property_type")
    if pt not in (None, "unknown", "either"):
        if listing.get("property_type") not in (pt, "unknown"):
            return False

    rt = preferences.get("room_type")
    if rt not in (None, "unknown", "either"):
        if listing.get("room_type") not in (rt, "unknown"):
            return False

    amenities_pref = preferences.get("amenities", {}) or {}
    listing_amenities = listing.get("amenities", {}) or {}
    for k, want in amenities_pref.items():
        if want in (None, "unknown", "either"):
            continue
        have = listing_amenities.get(k, "unknown")
        if have == "unknown":
            continue
        if want != have:
            return False

    return True


def _add_match_notes(listing, preferences):
    notes = []
    max_rent = preferences.get("max_rent")
    price = listing.get("price")
    if isinstance(max_rent, (int, float)) and isinstance(price, (int, float)):
        if price <= max_rent:
            notes.append("Under max rent")

    pt = preferences.get("property_type")
    if pt not in (None, "unknown", "either") and listing.get("property_type") == pt:
        notes.append("Matches requested property type")

    amenities_pref = preferences.get("amenities", {}) or {}
    listing_amenities = listing.get("amenities", {}) or {}
    for k, want in amenities_pref.items():
        have = listing_amenities.get(k, "unknown")
        if want == "yes" and have == "yes":
            notes.append("Mentions " + k.replace("_", " "))
        elif have == "unknown" and want not in (None, "unknown", "either"):
            notes.append("Amenity " + k + " unknown, not filtered out")

    listing["match_notes"] = notes
    return listing


def get_placeholder_listings(preferences):
    base_loc = preferences.get("general_location") if isinstance(preferences, dict) else None
    if base_loc in (None, "", "unknown"):
        base_loc = "Santa Cruz"

    raw_list = [
        {
            "listing_id": "fallback_1",
            "title": "Single room near downtown (placeholder fallback)",
            "price": 1300,
            "address": "120 Walnut Ave, Santa Cruz, CA 95060",
            "neighborhood": "Downtown",
            "general_location": base_loc,
            "property_type": "room",
            "room_type": "single",
            "amenities": {
                "pet_friendly": "no",
                "parking": "yes",
                "accessible": "unknown",
                "furnished": "yes",
                "laundry": "shared",
            },
            "description": "Placeholder fallback listing. Not a real listing; address is illustrative only.",
            "url": "unknown",
            "posting_date": "unknown",
        },
        {
            "listing_id": "fallback_2",
            "title": "Shared apartment with parking (placeholder fallback)",
            "price": 1100,
            "address": "415 Western Dr, Santa Cruz, CA 95060",
            "neighborhood": "Westside",
            "general_location": base_loc,
            "property_type": "apartment",
            "room_type": "shared",
            "amenities": {
                "pet_friendly": "unknown",
                "parking": "yes",
                "accessible": "unknown",
                "furnished": "no",
                "laundry": "in-unit",
            },
            "description": "Placeholder fallback listing. Not a real listing; address is illustrative only.",
            "url": "unknown",
            "posting_date": "unknown",
        },
        {
            "listing_id": "fallback_3",
            "title": "Single room in shared house near campus (placeholder fallback)",
            "price": 1450,
            "address": "300 Western Dr, Santa Cruz, CA 95060",
            "neighborhood": "Westside",
            "general_location": base_loc,
            "property_type": "room",
            "room_type": "single",
            "amenities": {
                "pet_friendly": "unknown",
                "parking": "yes",
                "accessible": "unknown",
                "furnished": "yes",
                "laundry": "shared",
            },
            "description": "Placeholder fallback listing. Not a real listing; address is illustrative only.",
            "url": "unknown",
            "posting_date": "unknown",
        },
    ]

    listings = []
    for raw in raw_list:
        listing = normalize_listing(raw, "placeholder_fallback")
        listing["used_fallback_data"] = True
        listing["data_source"] = "placeholder_fallback"
        listing["source"] = "placeholder_fallback"
        listings.append(listing)
    return listings


def scrape_craigslist_listings(preferences, search_url=None, max_results=10):
    out = {"listings": [], "errors": []}
    if not search_url:
        out["errors"].append("No Craigslist URL provided")
        return out
    if requests is None:
        out["errors"].append("requests library not installed")
        return out
    if BeautifulSoup is None:
        out["errors"].append("BeautifulSoup not installed")
        return out

    try:
        resp = requests.get(
            search_url, headers={"User-Agent": USER_AGENT}, timeout=REQUEST_TIMEOUT
        )
    except Exception as e:
        out["errors"].append("Craigslist request failed: " + str(e))
        return out

    if resp.status_code != 200:
        out["errors"].append("Craigslist returned HTTP " + str(resp.status_code))
        return out

    try:
        soup = BeautifulSoup(resp.text, "html.parser")
        nodes = soup.select("li.cl-static-search-result")[:max_results]
        if not nodes:
            out["errors"].append("Craigslist: no listing nodes parsed from HTML")
            return out
        for idx, node in enumerate(nodes):
            title_node = node.select_one(".title")
            price_node = node.select_one(".price")
            hood_node = node.select_one(".location")

            raw = {
                "listing_id": "craigslist_" + str(idx),
                "title": title_node.get_text(strip=True) if title_node else "unknown",
                "price": _extract_price(price_node.get_text(strip=True)) if price_node else None,
                "neighborhood": hood_node.get_text(strip=True).strip("()") if hood_node else "unknown",
                "url": node.select_one("a")["href"] if node.select_one("a") and node.select_one("a").has_attr("href") else "unknown",
                "address": "unknown",
                "general_location": preferences.get("general_location", "unknown"),
                "property_type": "unknown",
                "room_type": "unknown",
                "description": "unknown",
                "posting_date": "unknown",
            }
            out["listings"].append(normalize_listing(raw, "craigslist"))
    except Exception as e:
        out["errors"].append("Craigslist parse failed: " + str(e))

    return out


def scrape_redfin_listings(preferences, search_url=None, max_results=10):
    out = {"listings": [], "errors": []}
    if not search_url:
        out["errors"].append("No Redfin URL provided")
        return out
    if requests is None:
        out["errors"].append("requests library not installed")
        return out
    if BeautifulSoup is None:
        out["errors"].append("BeautifulSoup not installed")
        return out

    try:
        resp = requests.get(
            search_url, headers={"User-Agent": USER_AGENT}, timeout=REQUEST_TIMEOUT
        )
    except Exception as e:
        out["errors"].append("Redfin request failed: " + str(e))
        return out

    if resp.status_code != 200:
        out["errors"].append("Redfin returned HTTP " + str(resp.status_code))
        return out

    out["errors"].append(
        "Redfin: static HTML does not include listing data (JavaScript-rendered); no listings extracted"
    )
    return out


def get_housing_listings(
    preference_json,
    craigslist_url=None,
    redfin_url=None,
    max_results_per_source=10,
):
    preferences = extract_preferences(preference_json)
    if not preferences:
        return {
            "status": "error",
            "data": {
                "preferences_used": {},
                "results_count": 0,
                "listings": [],
                "source_errors": ["Invalid or missing preference_json"],
                "used_fallback_data": True,
                "data_source": "placeholder_fallback",
            },
            "error": "preference_json must be a dict containing 'preferences' or parser output",
        }

    listings = []
    errors = []

    if not craigslist_url and not redfin_url:
        errors.append("No live source URLs provided; using placeholder fallback")

    if craigslist_url:
        cl = scrape_craigslist_listings(preferences, craigslist_url, max_results_per_source)
        listings.extend(cl["listings"])
        errors.extend(cl["errors"])

    if redfin_url:
        rf = scrape_redfin_listings(preferences, redfin_url, max_results_per_source)
        listings.extend(rf["listings"])
        errors.extend(rf["errors"])

    used_fallback = False
    if not listings:
        listings = get_placeholder_listings(preferences)
        used_fallback = True

    filtered = []
    for listing in listings:
        if listing_matches_preferences(listing, preferences):
            filtered.append(_add_match_notes(listing, preferences))

    sources_seen = {l.get("source") for l in filtered}
    if used_fallback or sources_seen == {"placeholder_fallback"}:
        data_source = "placeholder_fallback"
    elif len(sources_seen - {None, "unknown"}) > 1:
        data_source = "mixed"
    elif "craigslist" in sources_seen:
        data_source = "craigslist"
    elif "redfin" in sources_seen:
        data_source = "redfin"
    else:
        data_source = "placeholder_fallback"

    return {
        "status": "success",
        "data": {
            "preferences_used": preferences,
            "results_count": len(filtered),
            "listings": filtered,
            "source_errors": errors,
            "used_fallback_data": used_fallback,
            "data_source": data_source,
        },
        "error": None,
    }


if __name__ == "__main__":
    fake_pref = {
        "status": "success",
        "data": {
            "user_query": "test",
            "preferences": {
                "max_rent": 1500,
                "general_location": "Santa Cruz",
                "destination_address": "UC Santa Cruz, Santa Cruz, CA",
                "transportation_preference": "bus",
                "max_commute_minutes": 30,
                "property_type": "room",
                "roommates": None,
                "room_type": "single",
                "amenities": {
                    "pet_friendly": "either",
                    "parking": "yes",
                    "accessible": "either",
                    "furnished": "yes",
                    "laundry": "shared",
                },
            },
            "missing_fields": [],
            "assumptions": [],
            "raw_constraints_notes": [],
        },
        "error": None,
    }
    result = get_housing_listings(fake_pref)
    print(json.dumps(result, indent=2))