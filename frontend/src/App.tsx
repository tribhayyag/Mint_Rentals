import { useState, useEffect } from "react";
import type { Listing, ViewName } from "./types/listing";
import type { UserPreferences } from "./types/preferences";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { SavedListings } from "./components/SavedListings";
import { Preferences } from "./components/Preferences";
import { Onboarding } from "./components/Onboarding";

export default function App() {
  const [activeView, setActiveView] = useState<ViewName>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(
    null
  );
  const [mapExpanded, setMapExpanded] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleSave = (id: string) =>
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, saved: !l.saved } : l))
    );

  const handleSelectListing = (id: string | null) => setSelectedListingId(id);

  const handleRefine = () => {
    setPreferences(null);
    setListings([]);
  };

  // Fetch listings when preferences change
  useEffect(() => {
    if (preferences !== null) {
      fetchListings();
    }
  }, [preferences]);

  const fetchListings = async () => {
    if (preferences === null) return;

    setLoading(true);
    setError(null);
    
    try {
      // Convert frontend preferences to backend format
      const backendPrefs = {
        max_rent: preferences.max_rent,
        general_location: preferences.general_location,
        destination_address: preferences.destination_address,
        transportation_preference: preferences.transportation_preference,
        max_commute_minutes: preferences.max_commute_minutes,
        property_type: preferences.property_type,
        roommates: preferences.roommates,
        room_type: preferences.room_type,
        amenities: preferences.amenities,
      };

      const response = await fetch(import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000" + "/search-listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preference_json: {
            status: "success",
            data: {
              user_query: "From frontend preferences",
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
      
      if (result.status === "success") {
        // Convert backend listing format to frontend Listing format
        const frontendListings = result.data.listings.map(convertBackendListingToFrontend);
        setListings(frontendListings);
      } else {
        throw new Error(result.error || "Unknown error from backend");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      // Fallback to empty listings on error
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  // Convert backend listing format to frontend Listing format
  const convertBackendListingToFrontend = (backendListing: any): Listing => {
    // Determine if this is fallback data
    const isFallback = backendListing.used_fallback_data === true || 
                      backendListing.data_source === "placeholder_fallback";
    
    // Map backend property_type to frontend housingType and roomType
    let housingType: Listing["housingType"] = "unknown";
    let roomType: Listing["roomType"] = "unknown";
    
    switch (backendListing.property_type) {
      case "apartment":
        housingType = "apartment";
        break;
      case "house":
        housingType = "house";
        break;
      case "room":
        housingType = "room";
        roomType = backendListing.room_type === "single" ? "private" : "shared";
        break;
      case "sublease":
        housingType = "sublease";
        break;
      default:
        housingType = "unknown";
        roomType = "unknown";
    }
    
    // Map backend roomType to frontend roomType if not already set
    if (roomType === "unknown") {
      switch (backendListing.room_type) {
        case "single":
          roomType = "private";
          break;
        case "shared":
          roomType = "shared";
          break;
        default:
          roomType = "unknown";
      }
    }
    
    // Determine commute info (we'd need to call commute endpoint for real data)
    // For now, we'll set defaults or calculate from available data
    const commuteMinutes = 0; // Would need to call commute endpoint
    const commuteMode: Listing["commuteMode"] = "unknown";
    const distanceMiles = 0; // Would need to call commute endpoint
    
    // Generate match score based on match notes or default
    let matchScore = 0;
    if (backendListing.match_notes && backendListing.match_notes.length > 0) {
      // Simple scoring based on number of match notes
      matchScore = Math.min(95, 50 + (backendListing.match_notes.length * 10));
    }
    
    // Generate tags from match notes and amenities
    const tags: string[] = [];
    if (backendListing.match_notes) {
      tags.push(...backendListing.match_notes.slice(0, 3)); // Limit to 3 tags
    }
    // Add amenity tags
    if (backendListing.amenities?.parking === "yes") tags.push("Parking");
    if (backendListing.amenities?.furnished === "yes") tags.push("Furnished");
    if (backendListing.amenities?.laundry === "in-unit") tags.push("In-unit Laundry");
    if (backendListing.amenities?.laundry === "shared") tags.push("Shared Laundry");
    if (backendListing.amenities?.pet_friendly === "yes") tags.push("Pet Friendly");
    
    return {
      id: backendListing.listing_id,
      title: backendListing.title,
      address: backendListing.address,
      neighborhood: backendListing.neighborhood || "Unknown",
      rent: backendListing.price || 0,
      roomType: roomType as Listing["roomType"],
      housingType: housingType as Listing["housingType"],
      commuteMinutes,
      commuteMode,
      distanceMiles,
      matchScore: matchScore > 0 ? matchScore : undefined,
      tags,
      aiReason: isFallback 
        ? "Fallback listing - real data unavailable" 
        : "Matched preferences",
      imageUrl: "", // No image data available from backend
      lat: backendListing.lat || 0,
      lng: backendListing.lng || 0,
      saved: false,
    };
  };

  if (preferences === null) {
    return <Onboarding onSubmit={(p) => setPreferences(p)} />;
  }

  return (
    <div className="flex min-h-screen bg-cream text-ink">
      <Sidebar
        activeView={activeView}
        onChangeView={setActiveView}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />
      <main className="flex-1 min-w-0">
        {activeView === "dashboard" && (
          <>
            {loading && (
              <div className="px-8 py-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint-deep"></div>
                <p className="mt-2 text-muted">Loading listings...</p>
              </div>
            )}
            {error && (
              <div className="px-8 py-4 bg-red-50 border-l-4 border-red-200 text-red-700">
                <p className="font-medium">Error loading listings:</p>
                <p>{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="mt-2 px-3 py-1 rounded bg-mint text-ink hover:bg-mint-deep"
                >
                  Dismiss
                </button>
              </div>
            )}
            {!loading && !error && (
              <Dashboard
                listings={listings}
                selectedListingId={selectedListingId}
                onSelectListing={handleSelectListing}
                onToggleSave={handleToggleSave}
                mapExpanded={mapExpanded}
                onSetMapExpanded={setMapExpanded}
                preferences={preferences}
                onRefine={handleRefine}
              />
            )}
          </>
        )}
        {activeView === "saved" && (
          <SavedListings
            listings={listings}
            selectedListingId={selectedListingId}
            onSelectListing={handleSelectListing}
            onToggleSave={handleToggleSave}
          />
        )}
        {activeView === "preferences" && (
          <Preferences preferences={preferences} />
        )}
      </main>
    </div>
  );
}
