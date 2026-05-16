import json
import os

try:
    import requests
except ImportError:
    requests = None


DIRECTIONS_API_URL = "https://maps.googleapis.com/maps/api/directions/json"
REQUEST_TIMEOUT = 15
DEFAULT_DESTINATION = "UC Santa Cruz, Santa Cruz, CA"


def _modes_for_preference(pref):
    mapping = {
        "bus": ["transit"],
        "transit": ["transit"],
        "driving": ["driving"],
        "walking": ["walking"],
        "biking": ["bicycling"],
    }
    if pref in mapping:
        return mapping[pref]
    return ["transit", "driving", "walking", "bicycling"]


def _empty_option(mode):
    return {
        "mode": mode,
        "duration_minutes": None,
        "distance_miles": None,
        "route_summary": "unknown",
        "bus_routes": [],
        "within_max_commute": False,
        "data_source": "placeholder_fallback",
    }


def _extract_preferences(preferences):
    if not isinstance(preferences, dict):
        return {}
    if "data" in preferences and isinstance(preferences["data"], dict):
        data = preferences["data"]
        return data.get("preferences") or data.get("preferences_used") or {}
    if "preferences" in preferences:
        return preferences["preferences"] or {}
    if "preferences_used" in preferences:
        return preferences["preferences_used"] or {}
    return preferences


def _fallback(listing_id, origin, destination, transport, modes, error_msg):
    return {
        "status": "error",
        "data": {
            "listing_id": listing_id,
            "origin_address": origin,
            "origin_lat": None,
            "origin_lng": None,
            "destination_address": destination,
            "transportation_preference": transport,
            "commute_options": [_empty_option(m) for m in modes],
            "best_option": None,
            "used_fallback_data": True,
            "data_source": "placeholder_fallback",
        },
        "error": error_msg,
    }


def _call_directions_api(origin, destination, mode, api_key):
    if requests is None:
        return None, "requests library not installed"
    params = {
        "origin": origin,
        "destination": destination,
        "mode": mode,
        "key": api_key,
    }
    try:
        resp = requests.get(DIRECTIONS_API_URL, params=params, timeout=REQUEST_TIMEOUT)
    except Exception as e:
        return None, "Request failed: " + str(e)

    if resp.status_code != 200:
        return None, "HTTP " + str(resp.status_code)

    try:
        data = resp.json()
    except Exception as e:
        return None, "JSON parse failed: " + str(e)

    if data.get("status") != "OK":
        return None, "API status: " + str(data.get("status"))

    routes = data.get("routes") or []
    if not routes:
        return None, "No routes returned"

    legs = routes[0].get("legs") or []
    if not legs:
        return None, "No legs returned"

    leg = legs[0]
    duration_seconds = leg.get("duration", {}).get("value")
    distance_meters = leg.get("distance", {}).get("value")

    bus_routes = []
    for step in leg.get("steps", []) or []:
        td = step.get("transit_details")
        if td:
            line = td.get("line", {})
            name = line.get("short_name") or line.get("name")
            if name:
                bus_routes.append(name)

    start_loc = leg.get("start_location") or {}
    origin_lat = start_loc.get("lat") if isinstance(start_loc.get("lat"), (int, float)) else None
    origin_lng = start_loc.get("lng") if isinstance(start_loc.get("lng"), (int, float)) else None

    return {
        "duration_minutes": round(duration_seconds / 60) if duration_seconds else None,
        "distance_miles": round(distance_meters / 1609.344, 2) if distance_meters else None,
        "route_summary": routes[0].get("summary") or "unknown",
        "bus_routes": bus_routes,
        "origin_lat": origin_lat,
        "origin_lng": origin_lng,
    }, None


def get_commute_info(listing, preferences):
    if not isinstance(listing, dict):
        return {
            "status": "error",
            "data": {
                "listing_id": "unknown",
                "origin_address": "unknown",
                "origin_lat": None,
                "origin_lng": None,
                "destination_address": DEFAULT_DESTINATION,
                "transportation_preference": "unknown",
                "commute_options": [],
                "best_option": None,
                "used_fallback_data": True,
                "data_source": "placeholder_fallback",
            },
            "error": "listing must be a dict",
        }

    listing_id = listing.get("listing_id", "unknown")
    origin = listing.get("address", "unknown")

    prefs = _extract_preferences(preferences)
    destination = prefs.get("destination_address") or DEFAULT_DESTINATION
    transport = prefs.get("transportation_preference", "unknown")
    max_commute = prefs.get("max_commute_minutes")

    modes = _modes_for_preference(transport)

    if origin in (None, "", "unknown", "placeholder_fallback"):
        return _fallback(
            listing_id,
            origin or "unknown",
            destination,
            transport,
            modes,
            "Listing address is unknown or missing",
        )

    api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
    if not api_key:
        return _fallback(
            listing_id,
            origin,
            destination,
            transport,
            modes,
            "GOOGLE_MAPS_API_KEY environment variable not set",
        )

    options = []
    errors = []
    origin_lat = None
    origin_lng = None
    for mode in modes:
        info, err = _call_directions_api(origin, destination, mode, api_key)
        if err:
            errors.append(mode + ": " + err)
            options.append(_empty_option(mode))
            continue
        if origin_lat is None and info.get("origin_lat") is not None:
            origin_lat = info["origin_lat"]
            origin_lng = info["origin_lng"]
        within = False
        if isinstance(max_commute, (int, float)) and isinstance(
            info["duration_minutes"], (int, float)
        ):
            within = info["duration_minutes"] <= max_commute
        options.append(
            {
                "mode": mode,
                "duration_minutes": info["duration_minutes"],
                "distance_miles": info["distance_miles"],
                "route_summary": info["route_summary"],
                "bus_routes": info["bus_routes"],
                "within_max_commute": within,
                "data_source": "google_maps_api",
            }
        )

    real_options = [o for o in options if o["duration_minutes"] is not None]
    if not real_options:
        return {
            "status": "error",
            "data": {
                "listing_id": listing_id,
                "origin_address": origin,
                "origin_lat": origin_lat,
                "origin_lng": origin_lng,
                "destination_address": destination,
                "transportation_preference": transport,
                "commute_options": options,
                "best_option": None,
                "used_fallback_data": True,
                "data_source": "placeholder_fallback",
            },
            "error": "; ".join(errors) if errors else "No commute data returned",
        }

    best = min(real_options, key=lambda o: o["duration_minutes"])

    return {
        "status": "success",
        "data": {
            "listing_id": listing_id,
            "origin_address": origin,
            "origin_lat": origin_lat,
            "origin_lng": origin_lng,
            "destination_address": destination,
            "transportation_preference": transport,
            "commute_options": options,
            "best_option": best,
            "used_fallback_data": False,
            "data_source": "google_maps_api",
        },
        "error": None,
    }


if __name__ == "__main__":
    fake_listing = {
        "listing_id": "fallback_1",
        "address": "100 High St, Santa Cruz, CA 95064",
    }
    fake_prefs = {
        "preferences": {
            "destination_address": "UC Santa Cruz, Santa Cruz, CA",
            "transportation_preference": "bus",
            "max_commute_minutes": 30,
        }
    }
    result = get_commute_info(fake_listing, fake_prefs)
    print(json.dumps(result, indent=2))