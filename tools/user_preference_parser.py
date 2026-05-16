import json
import re

DEFAULT_DESTINATION = "UC Santa Cruz, Santa Cruz, CA"

VAGUE_TERMS = ["cheap", "affordable", "close", "near campus", "safe", "nice area"]


def _default_preferences():
    return {
        "max_rent": None,
        "general_location": "unknown",
        "destination_address": DEFAULT_DESTINATION,
        "transportation_preference": "unknown",
        "max_commute_minutes": None,
        "property_type": "unknown",
        "roommates": None,
        "room_type": "unknown",
        "amenities": {
            "pet_friendly": "unknown",
            "parking": "unknown",
            "accessible": "unknown",
            "furnished": "unknown",
            "laundry": "unknown",
        },
    }


def _default_response(user_query=""):
    return {
        "user_query": user_query,
        "preferences": _default_preferences(),
        "missing_fields": [],
        "assumptions": [],
        "raw_constraints_notes": [],
    }


def _parse_rent(text):
    patterns = [
        r"\$\s*(\d{3,5})",
        r"under\s+\$?(\d{3,5})",
        r"below\s+\$?(\d{3,5})",
        r"max(?:imum)?\s+\$?(\d{3,5})",
        r"budget\s+(?:of\s+)?\$?(\d{3,5})",
        r"up\s+to\s+\$?(\d{3,5})",
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            return int(m.group(1))
    return None


def _parse_commute(text):
    patterns = [
        r"under\s+(\d{1,3})\s*(?:minutes?|mins?)",
        r"(\d{1,3})\s*(?:minutes?|mins?)\s+commute",
        r"max(?:imum)?\s+(\d{1,3})\s*(?:minutes?|mins?)",
        r"within\s+(\d{1,3})\s*(?:minutes?|mins?)",
        r"less\s+than\s+(\d{1,3})\s*(?:minutes?|mins?)",
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            return int(m.group(1))
    return None


def _parse_transportation(text):
    t = text.lower()
    no_car_patterns = [
        r"\bno car\b",
        r"\bwithout a car\b",
        r"\bdon'?t have a car\b",
        r"\bdo not have a car\b",
        r"\bdon'?t drive\b",
        r"\bdo not drive\b",
        r"\bno license\b",
        r"\bcan'?t drive\b",
        r"\brely on (?:public )?(?:transit|transportation)\b",
        r"\bneed public (?:transit|transportation)\b",
    ]
    for p in no_car_patterns:
        if re.search(p, t):
            return "transit"
    if re.search(r"\bbus\b", t):
        return "bus"
    if "transit" in t or "public transportation" in t:
        return "transit"
    if re.search(r"\b(driv\w*|car)\b", t):
        return "driving"
    if re.search(r"\bwalk\w*\b", t):
        return "walking"
    if re.search(r"\bbik\w*\b", t):
        return "biking"
    if re.search(r"\b(either|any|flexible|no preference)\b", t):
        return "either"
    return "unknown"


def _parse_property_type(text):
    t = text.lower()
    if re.search(r"\b(sublease|sublet)\b", t):
        return "sublease"
    if re.search(r"\b(apartment|apt)\b", t):
        return "apartment"
    if re.search(r"\bhouse\b", t):
        return "house"
    if re.search(r"\broom\b", t):
        return "room"
    return "unknown"


def _parse_room_type(text):
    t = text.lower()
    if "single" in t:
        return "single"
    if "shared" in t:
        return "shared"
    return "unknown"


def _parse_amenities(text):
    t = text.lower()
    amenities = {
        "pet_friendly": "unknown",
        "parking": "unknown",
        "accessible": "unknown",
        "furnished": "unknown",
        "laundry": "unknown",
    }

    if re.search(r"\b(no pets?|pet[-\s]?free)\b", t):
        amenities["pet_friendly"] = "no"
    elif re.search(r"\bpets?\b|pet[-\s]?friendly", t):
        amenities["pet_friendly"] = "yes"

    if re.search(r"\bno parking\b", t):
        amenities["parking"] = "no"
    elif re.search(r"\bparking\b", t):
        amenities["parking"] = "yes"

    if re.search(r"\b(accessible|wheelchair|ada)\b", t):
        amenities["accessible"] = "yes"

    if re.search(r"\bunfurnished\b", t):
        amenities["furnished"] = "no"
    elif re.search(r"\bfurnished\b", t):
        amenities["furnished"] = "yes"

    if re.search(r"\b(in[-\s]?unit|washer|dryer)\b", t):
        amenities["laundry"] = "in-unit"
    elif "shared laundry" in t:
        amenities["laundry"] = "shared"
    elif "laundry" in t:
        amenities["laundry"] = "either"

    return amenities


def _parse_general_location(text):
    stop = r"(?:\s+(?:with|for|and|under|max|below|over|that|in|near|to)|[.,;:$]|\d|$)"
    patterns = [
        r"near\s+([A-Z][A-Za-z\s]+?)" + stop,
        r"in\s+([A-Z][A-Za-z\s]+?)" + stop,
        r"around\s+([A-Z][A-Za-z\s]+?)" + stop,
    ]
    for p in patterns:
        m = re.search(p, text)
        if m:
            loc = m.group(1).strip()
            if loc:
                return loc
    return "unknown"


def _parse_roommates(text):
    m = re.search(r"(\d+)\s+roommates?", text, re.IGNORECASE)
    if m:
        return int(m.group(1))
    return None


def parse_user_preferences(user_input):
    if not isinstance(user_input, str) or not user_input.strip():
        return {
            "status": "error",
            "data": _default_response(""),
            "error": "user_input must be a non-empty string",
        }

    response = _default_response(user_input)
    prefs = response["preferences"]

    prefs["max_rent"] = _parse_rent(user_input)
    prefs["max_commute_minutes"] = _parse_commute(user_input)
    prefs["transportation_preference"] = _parse_transportation(user_input)
    prefs["property_type"] = _parse_property_type(user_input)
    prefs["room_type"] = _parse_room_type(user_input)
    prefs["amenities"] = _parse_amenities(user_input)
    prefs["general_location"] = _parse_general_location(user_input)
    prefs["roommates"] = _parse_roommates(user_input)

    prefs["destination_address"] = DEFAULT_DESTINATION
    response["assumptions"].append(
        "destination_address defaulted to UC Santa Cruz, Santa Cruz, CA"
    )

    t_lower = user_input.lower()
    for vague in VAGUE_TERMS:
        if vague in t_lower:
            response["raw_constraints_notes"].append(
                "User used vague term '" + vague + "'; no exact number inferred."
            )

    if prefs["max_rent"] is None:
        response["missing_fields"].append("max_rent")
    if prefs["max_commute_minutes"] is None:
        response["missing_fields"].append("max_commute_minutes")
    if prefs["general_location"] == "unknown":
        response["missing_fields"].append("general_location")
    if prefs["property_type"] == "unknown":
        response["missing_fields"].append("property_type")

    return {"status": "success", "data": response, "error": None}


if __name__ == "__main__":
    result = parse_user_preferences(
        "I want a furnished single room under $1500 near Santa Cruz with parking and a bus commute under 30 minutes."
    )
    print(json.dumps(result, indent=2))