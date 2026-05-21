import type { Listing } from "../types/listing";
import type {
  UserPreferences,
  TransportationPreference,
  PropertyType,
} from "../types/preferences";

// Real-ish Santa Cruz neighborhood catalog. Coordinates are approximate centers
// pulled from public map data; per-mode commute estimates are rough averages
// to UC Santa Cruz (~36.991, -122.058).
type NeighborhoodMeta = {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  distanceMiles: number;
  commute: Record<"walk" | "bike" | "bus" | "drive", number>;
  streets: string[];
  rentMultiplier: number;
};

const NEIGHBORHOODS: NeighborhoodMeta[] = [
  {
    name: "Westside",
    displayName: "Westside Santa Cruz",
    lat: 36.971,
    lng: -122.045,
    distanceMiles: 2.4,
    commute: { walk: 40, bike: 12, bus: 16, drive: 8 },
    streets: ["Mission St", "Walnut Ave", "Western Dr", "King St", "Bay St", "Almar Ave"],
    rentMultiplier: 1.0,
  },
  {
    name: "Eastside",
    displayName: "Eastside Santa Cruz",
    lat: 36.965,
    lng: -122.005,
    distanceMiles: 4.6,
    commute: { walk: 80, bike: 24, bus: 28, drive: 16 },
    streets: ["Soquel Ave", "Water St", "Morrissey Blvd", "Branciforte Dr"],
    rentMultiplier: 0.92,
  },
  {
    name: "Downtown",
    displayName: "Downtown Santa Cruz",
    lat: 36.972,
    lng: -122.026,
    distanceMiles: 2.1,
    commute: { walk: 55, bike: 16, bus: 18, drive: 11 },
    streets: ["Pacific Ave", "Cedar St", "Front St", "Locust St", "Center St"],
    rentMultiplier: 1.08,
  },
  {
    name: "Beach Flats",
    displayName: "Beach Flats",
    lat: 36.962,
    lng: -122.02,
    distanceMiles: 2.8,
    commute: { walk: 70, bike: 20, bus: 24, drive: 13 },
    streets: ["Beach St", "Riverside Ave", "Leibrandt Ave"],
    rentMultiplier: 0.95,
  },
  {
    name: "Seabright",
    displayName: "Seabright",
    lat: 36.964,
    lng: -122.011,
    distanceMiles: 3.6,
    commute: { walk: 80, bike: 22, bus: 26, drive: 14 },
    streets: ["Seabright Ave", "Pilkington Ave", "East Cliff Dr", "Murray St"],
    rentMultiplier: 1.02,
  },
  {
    name: "Live Oak",
    displayName: "Live Oak",
    lat: 36.969,
    lng: -121.99,
    distanceMiles: 5.4,
    commute: { walk: 110, bike: 30, bus: 34, drive: 18 },
    streets: ["Capitola Rd", "17th Ave", "7th Ave", "Brommer St"],
    rentMultiplier: 0.88,
  },
  {
    name: "Capitola",
    displayName: "Capitola",
    lat: 36.975,
    lng: -121.953,
    distanceMiles: 7.8,
    commute: { walk: 150, bike: 45, bus: 50, drive: 24 },
    streets: ["Monterey Ave", "Park Ave", "40th Ave", "Bay Ave"],
    rentMultiplier: 1.05,
  },
  {
    name: "Aptos",
    displayName: "Aptos",
    lat: 36.977,
    lng: -121.899,
    distanceMiles: 10.6,
    commute: { walk: 200, bike: 65, bus: 60, drive: 32 },
    streets: ["Soquel Dr", "State Park Dr", "Trout Gulch Rd"],
    rentMultiplier: 0.97,
  },
];

const PROPERTY_TEMPLATES: {
  type: Exclude<PropertyType, "unknown">;
  titles: string[];
  baseRent: number;
}[] = [
  {
    type: "apartment",
    titles: [
      "Cozy {n} studio apartment",
      "Modern 1BR apartment in {n}",
      "Bright apartment near {n} core",
      "Newly renovated {n} apartment",
    ],
    baseRent: 1850,
  },
  {
    type: "house",
    titles: [
      "Charming {n} house with yard",
      "Sunny {n} bungalow",
      "Spacious {n} shared house",
      "Quiet {n} cottage",
    ],
    baseRent: 2100,
  },
  {
    type: "room",
    titles: [
      "Private room in {n} home",
      "Single room near {n}",
      "Shared room in cozy {n} house",
      "Furnished room in {n} share house",
    ],
    baseRent: 1200,
  },
  {
    type: "sublease",
    titles: [
      "{n} summer sublease",
      "Short-term {n} sublet",
      "Furnished {n} sublease",
    ],
    baseRent: 1500,
  },
];

const AMENITY_TAGS: Record<string, string> = {
  pet_friendly: "Pet Friendly",
  parking: "Parking",
  accessible: "Accessible",
  furnished_yes: "Furnished",
  laundry_in_unit: "In-unit Laundry",
  laundry_shared: "Shared Laundry",
};

function pickMode(t: TransportationPreference): "walk" | "bike" | "bus" | "drive" {
  switch (t) {
    case "walking":
      return "walk";
    case "biking":
      return "bike";
    case "driving":
      return "drive";
    case "transit":
    case "bus":
      return "bus";
    default:
      return "bus";
  }
}

// Deterministic seeded RNG so repeated submissions with the same preferences
// produce the same listings. Mulberry32.
function seededRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashPrefs(p: UserPreferences): number {
  const s = JSON.stringify({
    max: p.max_rent,
    min: p.min_rent,
    n: p.neighborhoods,
    t: p.transportation_preference,
    c: p.max_commute_minutes,
    pt: p.property_types,
    rt: p.room_type,
    a: p.amenities,
  });
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function jitter(rng: () => number, base: number, pct: number): number {
  const delta = base * pct * (rng() * 2 - 1);
  return base + delta;
}

function neighborhoodPool(prefs: UserPreferences): NeighborhoodMeta[] {
  if (prefs.neighborhoods.length === 0) return NEIGHBORHOODS;
  const lowered = prefs.neighborhoods.map((n) => n.toLowerCase());
  const matched = NEIGHBORHOODS.filter((n) =>
    lowered.includes(n.name.toLowerCase())
  );
  return matched.length > 0 ? matched : NEIGHBORHOODS;
}

function propertyTypePool(prefs: UserPreferences): Exclude<PropertyType, "unknown">[] {
  const wanted = prefs.property_types.filter((t) => t !== "unknown");
  if (wanted.length > 0) {
    if (prefs.room_type === "shared" && !wanted.includes("room")) {
      return [...wanted, "room"] as Exclude<PropertyType, "unknown">[];
    }
    return wanted as Exclude<PropertyType, "unknown">[];
  }
  return ["apartment", "house", "room", "sublease"];
}

function pricePoint(
  rng: () => number,
  prefs: UserPreferences,
  meta: NeighborhoodMeta,
  template: (typeof PROPERTY_TEMPLATES)[number]
): number {
  const minRent = prefs.min_rent ?? 500;
  const maxRent = prefs.max_rent ?? 4000;
  const center = (minRent + maxRent) / 2;
  const baseline = template.baseRent * meta.rentMultiplier;
  // Bias toward baseline but clamp to the user's range.
  const mixed = baseline * 0.55 + center * 0.45;
  const noisy = jitter(rng, mixed, 0.18);
  const clamped = Math.min(Math.max(noisy, minRent), maxRent);
  return Math.round(clamped / 25) * 25;
}

function buildListing(
  rng: () => number,
  idx: number,
  meta: NeighborhoodMeta,
  template: (typeof PROPERTY_TEMPLATES)[number],
  prefs: UserPreferences
): Listing | null {
  const mode = pickMode(prefs.transportation_preference);
  const commuteMinutes = Math.round(jitter(rng, meta.commute[mode], 0.15));
  if (
    prefs.max_commute_minutes !== null &&
    commuteMinutes > prefs.max_commute_minutes
  ) {
    return null;
  }

  const rent = pricePoint(rng, prefs, meta, template);

  const street = meta.streets[Math.floor(rng() * meta.streets.length)];
  const houseNumber = 100 + Math.floor(rng() * 1800);
  const address = `${houseNumber} ${street}, Santa Cruz, CA`;

  const titleTmpl = template.titles[Math.floor(rng() * template.titles.length)];
  const title = titleTmpl.replace("{n}", meta.displayName);

  // Room type mapping
  let roomType: Listing["roomType"];
  if (template.type === "room") {
    if (prefs.room_type === "shared") roomType = "shared";
    else if (prefs.room_type === "single") roomType = "private";
    else roomType = rng() > 0.5 ? "private" : "shared";
  } else if (template.type === "apartment" || template.type === "sublease") {
    roomType = "entire";
  } else {
    roomType = rng() > 0.5 ? "shared" : "private";
  }

  // Amenities: respect "yes" requests, leave others probabilistic.
  const has = {
    pet_friendly:
      prefs.amenities.pet_friendly === "yes" ? true : rng() > 0.55,
    parking: prefs.amenities.parking === "yes" ? true : rng() > 0.4,
    accessible:
      prefs.amenities.accessible === "yes" ? true : rng() > 0.75,
    furnished:
      prefs.amenities.furnished === "yes"
        ? true
        : prefs.amenities.furnished === "no"
        ? false
        : rng() > 0.55,
    laundry:
      prefs.amenities.laundry === "in-unit"
        ? "in-unit"
        : prefs.amenities.laundry === "shared"
        ? "shared"
        : rng() > 0.5
        ? "in-unit"
        : "shared",
  } as const;

  // Hard-filter required amenities (only filter when user demanded "yes").
  if (prefs.amenities.pet_friendly === "yes" && !has.pet_friendly) return null;
  if (prefs.amenities.parking === "yes" && !has.parking) return null;
  if (prefs.amenities.accessible === "yes" && !has.accessible) return null;
  if (prefs.amenities.furnished === "yes" && !has.furnished) return null;
  if (prefs.amenities.furnished === "no" && has.furnished) return null;
  if (
    prefs.amenities.laundry === "in-unit" &&
    has.laundry !== "in-unit"
  )
    return null;
  if (prefs.amenities.laundry === "shared" && has.laundry !== "shared")
    return null;

  const tags: string[] = [];
  if (has.parking) tags.push(AMENITY_TAGS.parking);
  if (has.furnished) tags.push(AMENITY_TAGS.furnished_yes);
  if (has.laundry === "in-unit") tags.push(AMENITY_TAGS.laundry_in_unit);
  else if (has.laundry === "shared") tags.push(AMENITY_TAGS.laundry_shared);
  if (has.pet_friendly) tags.push(AMENITY_TAGS.pet_friendly);
  if (has.accessible) tags.push(AMENITY_TAGS.accessible);

  // Match score: rewards aligned preferences and budget headroom.
  let score = 60;
  if (prefs.max_rent && rent <= prefs.max_rent) score += 8;
  if (prefs.max_rent && rent <= prefs.max_rent * 0.85) score += 6;
  if (
    prefs.max_commute_minutes &&
    commuteMinutes <= prefs.max_commute_minutes * 0.7
  )
    score += 8;
  if (prefs.property_types.length === 0 || prefs.property_types.includes(template.type))
    score += 4;
  if (prefs.amenities.parking === "yes" && has.parking) score += 3;
  if (prefs.amenities.furnished === "yes" && has.furnished) score += 3;
  if (prefs.amenities.pet_friendly === "yes" && has.pet_friendly) score += 3;
  score += Math.floor(rng() * 6);
  if (score > 98) score = 98;

  const distanceMiles =
    Math.round(jitter(rng, meta.distanceMiles, 0.1) * 10) / 10;

  // Tiny coordinate jitter so pins don't pile up on the map.
  const lat = meta.lat + (rng() - 0.5) * 0.008;
  const lng = meta.lng + (rng() - 0.5) * 0.012;

  const reasonBits: string[] = [];
  if (prefs.max_rent && rent <= prefs.max_rent * 0.85)
    reasonBits.push("well under your budget");
  else if (prefs.max_rent && rent <= prefs.max_rent)
    reasonBits.push("within your budget");
  if (
    prefs.max_commute_minutes &&
    commuteMinutes <= prefs.max_commute_minutes * 0.7
  )
    reasonBits.push("short commute by " + mode);
  if (prefs.amenities.parking === "yes" && has.parking)
    reasonBits.push("has parking");
  if (prefs.amenities.furnished === "yes" && has.furnished)
    reasonBits.push("furnished");
  const aiReason =
    reasonBits.length > 0
      ? "Matches: " + reasonBits.join(", ") + "."
      : "Fits your preferences.";
  const safetyRating = Math.round(6 + rng() * 3);
  return {
    id: `gen_${idx}`,
    title,
    address,
    neighborhood: meta.displayName,
    rent,
    roomType,
    housingType: template.type,
    commuteMinutes,
    commuteMode: mode,
    distanceMiles,
    matchScore: score,
    tags,
    aiReason,
    safetyRating,
    safetySource: "Mock data",
    dataSource: "Mock data",
    matchNotes: reasonBits,
    lat,
    lng,
    saved: false,
  };
}

export function generateListings(prefs: UserPreferences): Listing[] {
  const rng = seededRng(hashPrefs(prefs));
  const hoods = neighborhoodPool(prefs);
  const types = propertyTypePool(prefs);
  const templatesByType = new Map(PROPERTY_TEMPLATES.map((t) => [t.type, t]));

  const target = 16;
  const out: Listing[] = [];
  let safety = 0;
  let idx = 0;
  while (out.length < target && safety < 400) {
    safety++;
    const meta = hoods[Math.floor(rng() * hoods.length)];
    const typ = types[Math.floor(rng() * types.length)];
    const template = templatesByType.get(typ);
    if (!template) continue;
    const listing = buildListing(rng, idx++, meta, template, prefs);
    if (listing) out.push(listing);
  }

  // Sort: matchScore desc, then rent asc as tiebreaker.
  out.sort((a, b) => {
    const sa = a.matchScore ?? 0;
    const sb = b.matchScore ?? 0;
    if (sb !== sa) return sb - sa;
    return a.rent - b.rent;
  });

  return out;
}
