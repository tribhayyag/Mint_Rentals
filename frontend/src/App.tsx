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
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("mint_saved_ids");
      if (stored) setSavedIds(JSON.parse(stored));
    } catch {
      /* ignore localStorage errors */
    }
  }, []);

  useEffect(() => {
    if (preferences === null) return;
    setLoading(true);
    const handle = window.setTimeout(() => {
      const generated = generateListings(preferences).map((listing) => ({
        ...listing,
        saved: savedIds.includes(listing.id),
      }));
      setListings(generated);
      setLoading(false);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [preferences]);

  useEffect(() => {
    window.localStorage.setItem("mint_saved_ids", JSON.stringify(savedIds));
    if (preferences !== null) {
      setListings((prev) =>
        prev.map((listing) => ({
          ...listing,
          saved: savedIds.includes(listing.id),
        }))
      );
    }
  }, [savedIds, preferences]);

  const handleToggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];
      setListings((current) =>
        current.map((listing) =>
          listing.id === id
            ? { ...listing, saved: !prev.includes(id) }
            : listing
        )
      );
      return next;
    });
  };

  const handleToggleCompare = (id: string) =>
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });

  const handleSelectListing = (id: string | null) => setSelectedListingId(id);

  const handleRefine = () => {
    setPreferences(null);
    setListings([]);
    setCompareIds([]);
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint-deep mx-auto"></div>
                <p className="mt-2 text-muted">Finding listings...</p>
              </div>
            )}
            {!loading && (
              <Dashboard
                listings={listings}
                selectedListingId={selectedListingId}
                compareIds={compareIds}
                onSelectListing={handleSelectListing}
                onToggleSave={handleToggleSave}
                onToggleCompare={handleToggleCompare}
                compareLimitReached={compareIds.length >= 3}
                mapExpanded={mapExpanded}
                onSetMapExpanded={setMapExpanded}
                preferences={preferences}
                onRefine={handleRefine}
                onClearCompare={() => setCompareIds([])}
              />
            )}
          </>
        )}
        {activeView === "saved" && (
          <SavedListings
            listings={listings}
            selectedListingId={selectedListingId}
            compareIds={compareIds}
            onSelectListing={handleSelectListing}
            onToggleSave={handleToggleSave}
            onToggleCompare={handleToggleCompare}
            compareLimitReached={compareIds.length >= 3}
          />
        )}
        {activeView === "preferences" && (
          <Preferences preferences={preferences} />
        )}
      </main>
    </div>
  );
}
