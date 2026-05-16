// Mirrors tools/user_preference_parser.py output shape so the onboarding
// wizard produces something the backend tools can consume as-is.

export type TransportationPreference =
  | "bus"
  | "biking"
  | "walking"
  | "driving"
  | "transit"
  | "either"
  | "unknown";

export type PropertyType =
  | "apartment"
  | "house"
  | "sublease"
  | "room"
  | "unknown";

export type RoomType = "single" | "shared" | "unknown";

export type YesNoUnknown = "yes" | "no" | "unknown";
export type FurnishedValue = "yes" | "no" | "either" | "unknown";
export type LaundryValue = "in-unit" | "shared" | "either" | "unknown";

export type Amenities = {
  pet_friendly: YesNoUnknown;
  parking: YesNoUnknown;
  accessible: YesNoUnknown;
  furnished: FurnishedValue;
  laundry: LaundryValue;
};

export type UserPreferences = {
  // Tool-compatible fields.
  max_rent: number | null;
  min_rent: number | null;
  general_location: string;
  neighborhoods: string[];
  destination_address: string;
  transportation_preference: TransportationPreference;
  max_commute_minutes: number | null;
  property_type: PropertyType;
  property_types: PropertyType[];
  roommates: number | null;
  room_type: RoomType;
  amenities: Amenities;
};

export const DEFAULT_DESTINATION = "UC Santa Cruz, Santa Cruz, CA";

export const SANTA_CRUZ_NEIGHBORHOODS = [
  "Westside",
  "Eastside",
  "Downtown",
  "Beach Flats",
  "Seabright",
  "Live Oak",
  "Capitola",
  "Aptos",
] as const;
