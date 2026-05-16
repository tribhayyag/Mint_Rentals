import { toUserPreferences } from "./src/lib/toUserPreferences";

// Test converting wizard state to backend preferences format
const wizardState = {
  minRent: 500,
  maxRent: 1500,
  neighborhoods: ["Westside"],
  noNeighborhoodPreference: false,
  transportation: "bus",
  maxCommuteMinutes: 30,
  propertyTypes: ["room"],
  roommates: 1,
  roomType: "single",
  petFriendly: "unknown",
  parking: "unknown",
  accessible: "unknown",
  furnished: "either",
  laundry: "either",
};

const userPrefs = toUserPreferences(wizardState);
console.log("User preferences:", JSON.stringify(userPrefs, null, 2));

// Test backend preference format
const backendPrefs = {
  max_rent: userPrefs.max_rent,
  general_location: userPrefs.general_location,
  destination_address: userPrefs.destination_address,
  transportation_preference: userPrefs.transportation_preference,
  max_commute_minutes: userPrefs.max_commute_minutes,
  property_type: userPrefs.property_type,
  roommates: userPrefs.roommates,
  room_type: userPrefs.room_type,
  amenities: userPrefs.amenities,
};

console.log("\nBackend preferences:", JSON.stringify(backendPrefs, null, 2));

// Test API call
const fetch = await import("node-fetch").then(mod => mod.default);

try {
  const response = await fetch("http://127.0.0.1:8000/search-listings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      preference_json: {
        status: "success",
        data: {
          user_query: "Test connection",
          preferences: backendPrefs,
          missing_fields: [],
          assumptions: [],
          raw_constraints_notes: [],
        },
        error: null,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  console.log("\nBackend response:", JSON.stringify(result, null, 2));
  
  if (result.status === "success") {
    console.log(`\n✅ Success! Got ${result.data.results_count} listings`);
    console.log(`Data source: ${result.data.data_source}`);
    console.log(`Used fallback: ${result.data.used_fallback_data}`);
  } else {
    console.log(`\n❌ Error: ${result.error}`);
  }
} catch (error) {
  console.error(`\n❌ Connection error: ${error}`);
}
