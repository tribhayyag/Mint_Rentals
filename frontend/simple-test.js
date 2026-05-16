// Simple test to verify backend connection
async function testConnection() {
  try {
    const response = await fetch("http://127.0.0.1:8000/health", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Backend health check:", result);
    return true;
  } catch (error) {
    console.error("❌ Backend connection failed:", error);
    return false;
  }
}

// Test search-listings endpoint
async function testSearchListings() {
  try {
    const response = await fetch("http://127.0.0.1:8000/search-listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preference_json: {
          status: "success",
          data: {
            user_query: "Test connection",
            preferences: {
              max_rent: 1500,
              general_location: "Santa Cruz",
              destination_address: "UC Santa Cruz, Santa Cruz, CA",
              transportation_preference: "bus",
              max_commute_minutes: 30,
              property_type: "room",
              roommates: null,
              room_type: "single",
              amenities: {
                pet_friendly: "either",
                parking: "yes",
                accessible: "either",
                furnished: "yes",
                laundry: "shared",
              },
            },
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
    console.log("✅ Search listings response:", JSON.stringify(result, null, 2));
    
    if (result.status === "success") {
      console.log(`   Got ${result.data.results_count} listings`);
      console.log(`   Data source: ${result.data.data_source}`);
      console.log(`   Used fallback: ${result.data.used_fallback_data}`);
    }
    
    return true;
  } catch (error) {
    console.error("❌ Search listings failed:", error);
    return false;
  }
}

// Run tests
(async () => {
  console.log("Testing backend connection...");
  const healthOk = await testConnection();
  if (healthOk) {
    await testSearchListings();
  }
})();
