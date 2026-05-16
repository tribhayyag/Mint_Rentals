import { useState } from "react";
import type { Listing, ViewName } from "./types/listing";
import type { UserPreferences } from "./types/preferences";
import { mockListings } from "./data/mockListings";
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
  const [listings, setListings] = useState<Listing[]>(mockListings);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  const handleToggleSave = (id: string) =>
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, saved: !l.saved } : l))
    );

  const handleSelectListing = (id: string | null) => setSelectedListingId(id);

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
          <Dashboard
            listings={listings}
            selectedListingId={selectedListingId}
            onSelectListing={handleSelectListing}
            onToggleSave={handleToggleSave}
            mapExpanded={mapExpanded}
            onSetMapExpanded={setMapExpanded}
            preferences={preferences}
            onRefine={() => setPreferences(null)}
          />
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
