"""Python mirror of the frontend wizard's preference-mapping logic.

Must stay byte-for-byte equivalent to `frontend/src/lib/toUserPreferences.ts`.
`test_real_ts.py` drives the actual compiled TypeScript and compares its output
to the output of this module — if the two ever diverge, that test fails and
this file needs to be re-synced from the TS source.
"""

from typing import Any

DEFAULT_DESTINATION = "UC Santa Cruz, Santa Cruz, CA"

SANTA_CRUZ_NEIGHBORHOODS = [
    "Westside", "Eastside", "Downtown", "Beach Flats",
    "Seabright", "Live Oak", "Capitola", "Aptos",
]

INITIAL_WIZARD_STATE: dict[str, Any] = {
    "minRent": 500,
    "maxRent": 2000,
    "neighborhoods": [],
    "noNeighborhoodPreference": False,
    "transportation": "bus",
    "maxCommuteMinutes": 30,
    "propertyTypes": [],
    "roommates": 1,
    "roomType": "single",
    "petFriendly": "unknown",
    "parking": "unknown",
    "accessible": "unknown",
    "furnished": "either",
    "laundry": "either",
}


def to_user_preferences(s: dict[str, Any]) -> dict[str, Any]:
    """Mirror of toUserPreferences() in frontend/src/lib/toUserPreferences.ts."""
    neighborhoods = [] if s["noNeighborhoodPreference"] else list(s["neighborhoods"])
    if s["noNeighborhoodPreference"]:
        general_location = "unknown"
    elif len(neighborhoods) == 0:
        general_location = "unknown"
    elif len(neighborhoods) == 1:
        general_location = neighborhoods[0]
    else:
        general_location = "Santa Cruz"

    property_type = (
        s["propertyTypes"][0] if len(s["propertyTypes"]) == 1 else "unknown"
    )

    return {
        "max_rent": s["maxRent"],
        "min_rent": s["minRent"],
        "general_location": general_location,
        "neighborhoods": neighborhoods,
        "destination_address": DEFAULT_DESTINATION,
        "transportation_preference": s["transportation"],
        "max_commute_minutes": s["maxCommuteMinutes"],
        "property_type": property_type,
        "property_types": list(s["propertyTypes"]),
        "roommates": s["roommates"],
        "room_type": s["roomType"],
        "amenities": {
            "pet_friendly": s["petFriendly"],
            "parking": s["parking"],
            "accessible": s["accessible"],
            "furnished": s["furnished"],
            "laundry": s["laundry"],
        },
    }


def make_state(**overrides) -> dict[str, Any]:
    """Build a wizard state from defaults plus the given overrides."""
    s = {**INITIAL_WIZARD_STATE}
    s.update(overrides)
    return s
