import type {
  UserPreferences,
  PropertyType,
  TransportationPreference,
  RoomType,
  YesNoUnknown,
  FurnishedValue,
  LaundryValue,
} from "../types/preferences";
import { DEFAULT_DESTINATION } from "../types/preferences";

export type WizardState = {
  minRent: number;
  maxRent: number;
  neighborhoods: string[];
  noNeighborhoodPreference: boolean;
  transportation: TransportationPreference;
  maxCommuteMinutes: number;
  propertyTypes: PropertyType[];
  roommates: number;
  roomType: RoomType;
  petFriendly: YesNoUnknown;
  parking: YesNoUnknown;
  accessible: YesNoUnknown;
  furnished: FurnishedValue;
  laundry: LaundryValue;
};

export const initialWizardState: WizardState = {
  minRent: 500,
  maxRent: 2000,
  neighborhoods: [],
  noNeighborhoodPreference: false,
  transportation: "bus",
  maxCommuteMinutes: 30,
  propertyTypes: [],
  roommates: 1,
  roomType: "single",
  petFriendly: "unknown",
  parking: "unknown",
  accessible: "unknown",
  furnished: "either",
  laundry: "either",
};

// Map a wizard state to a UserPreferences object the Python tools accept
// directly (matches user_preference_parser.py's preferences shape, with
// extra structured fields neighborhoods/property_types/min_rent for the
// orchestrator).
export function toUserPreferences(s: WizardState): UserPreferences {
  const neighborhoods = s.noNeighborhoodPreference ? [] : s.neighborhoods;
  // `general_location` is substring-matched against one listing field by the
  // scraper, so a single string is required. Multi-neighborhood selections
  // collapse to "Santa Cruz"; the structured `neighborhoods` array travels
  // alongside for the orchestrator to do finer-grained scoring.
  const general_location = s.noNeighborhoodPreference
    ? "unknown"
    : neighborhoods.length === 0
    ? "unknown"
    : neighborhoods.length === 1
    ? neighborhoods[0]
    : "Santa Cruz";

  const property_type: PropertyType =
    s.propertyTypes.length === 1 ? s.propertyTypes[0] : "unknown";

  return {
    max_rent: s.maxRent,
    min_rent: s.minRent,
    general_location,
    neighborhoods,
    destination_address: DEFAULT_DESTINATION,
    transportation_preference: s.transportation,
    max_commute_minutes: s.maxCommuteMinutes,
    property_type,
    property_types: s.propertyTypes,
    roommates: s.roommates,
    room_type: s.roomType,
    amenities: {
      pet_friendly: s.petFriendly,
      parking: s.parking,
      accessible: s.accessible,
      furnished: s.furnished,
      laundry: s.laundry,
    },
  };
}
