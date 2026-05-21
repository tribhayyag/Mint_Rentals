export type Listing = {
  id: string;
  title: string;
  address: string;
  neighborhood: string;
  rent: number;
  // UI vocab: private/shared/entire. Tool vocab: single/shared/either/unknown.
  // Both accepted so tool output can flow in without a renaming pass.
  roomType:
    | "private"
    | "shared"
    | "entire"
    | "single"
    | "either"
    | "unknown";
  // Tools may emit "room" or "unknown"; both now allowed alongside UI vocab.
  housingType:
    | "apartment"
    | "house"
    | "sublease"
    | "room"
    | "unknown";
  commuteMinutes: number;
  commuteMode: "walk" | "bike" | "bus" | "drive" | "unknown";
  distanceMiles: number;
  // Optional: nemoclaw composes these; tools alone don't produce them.
  matchScore?: number | null;
  tags: string[];
  aiReason?: string;
  safetyRating?: number;
  safetySource?: string;
  dataSource?: string;
  matchNotes?: string[];
  imageUrl?: string;
  lat: number;
  lng: number;
  saved: boolean;
};

export type ViewName = "dashboard" | "saved" | "preferences" | "compare";
