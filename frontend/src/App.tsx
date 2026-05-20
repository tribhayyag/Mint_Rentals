import { useState, useEffect } from "react";
import type { Listing, ViewName } from "./types/listing";
import type { UserPreferences } from "./types/preferences";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { SavedListings } from "./components/SavedListings";
import { Preferences } from "./components/Preferences";
import { Onboarding } from "./components/Onboarding";
import { generateListings } from "./lib/generateListings";

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

  const handleToggleSave = (id: string) =>
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, saved: !l.saved } : l))
    );

  const handleSelectListing = (id: string | null) => setSelectedListingId(id);

  const handleRefine = () => {
    setPreferences(null);
    setListings([]);
  };

  // Regenerate listings whenever preferences change. Pure client-side — no
  // backend required. Brief loading state so the UI feels responsive.
  useEffect(() => {
    if (preferences === null) return;
    setLoading(true);
    const handle = setTimeout(() => {
      setListings(generateListings(preferences));
      setLoading(false);
    }, 250);
    return () => clearTimeout(handle);
  }, [preferences]);

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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint-deep mx-auto"></div>
                <p className="mt-2 text-muted">Finding listings...</p>
              </div>
            )}
            {!loading && (
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
