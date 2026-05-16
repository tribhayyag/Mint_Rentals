// Drives the actual compiled toUserPreferences and prints JSON.
// Expects compiled output at COMPILED_OUT/lib/toUserPreferences.js, which is
// produced by test_real_ts.sh.
import { toUserPreferences, initialWizardState } from "./_compiled/lib/toUserPreferences.js";

const cases = {
  default: initialWizardState,
  permissive_westside: {
    ...initialWizardState,
    maxRent: 1600,
    neighborhoods: ["Westside"],
    roomType: "unknown",
  },
  multi_neighborhood_3: {
    ...initialWizardState,
    neighborhoods: ["Westside", "Eastside", "Downtown"],
  },
  multi_neighborhood_2: {
    ...initialWizardState,
    neighborhoods: ["Westside", "Eastside"],
  },
  no_preference: {
    ...initialWizardState,
    noNeighborhoodPreference: true,
    neighborhoods: ["Westside"],
  },
  select_all: {
    ...initialWizardState,
    neighborhoods: ["Westside","Eastside","Downtown","Beach Flats","Seabright","Live Oak","Capitola","Aptos"],
  },
  bike_with_pet: {
    ...initialWizardState,
    transportation: "biking",
    petFriendly: "yes",
    maxRent: 2000,
  },
  walking_quiet: {
    ...initialWizardState,
    transportation: "walking",
    maxCommuteMinutes: 15,
    parking: "unknown",
  },
  drive_with_parking: {
    ...initialWizardState,
    transportation: "driving",
    parking: "yes",
    maxCommuteMinutes: 60,
  },
  multi_property_types: {
    ...initialWizardState,
    propertyTypes: ["apartment", "house"],
  },
  all_property_types: {
    ...initialWizardState,
    propertyTypes: ["apartment", "house", "sublease"],
  },
  zero_roommates_furnished_no: {
    ...initialWizardState,
    roommates: 0,
    furnished: "no",
    laundry: "in-unit",
  },
  high_roommates: {
    ...initialWizardState,
    roommates: 5,
  },
  shared_room_accessible: {
    ...initialWizardState,
    roomType: "shared",
    accessible: "yes",
  },
  full_amenity_request: {
    ...initialWizardState,
    petFriendly: "yes",
    parking: "yes",
    accessible: "yes",
    furnished: "yes",
    laundry: "in-unit",
  },
  budget_edge_equal: {
    ...initialWizardState,
    minRent: 1500,
    maxRent: 1500,
  },
  budget_edge_max: {
    ...initialWizardState,
    minRent: 300,
    maxRent: 4000,
  },
  commute_edge_low: {
    ...initialWizardState,
    maxCommuteMinutes: 5,
  },
  commute_edge_high: {
    ...initialWizardState,
    maxCommuteMinutes: 90,
  },
};

const out = {};
for (const [name, state] of Object.entries(cases)) {
  out[name] = { state, prefs: toUserPreferences(state) };
}
process.stdout.write(JSON.stringify(out));
