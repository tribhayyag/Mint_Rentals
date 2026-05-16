import type { Listing } from "../types/listing";
import type { UserPreferences } from "../types/preferences";
import { KanbanBoard } from "./KanbanBoard";
import { MapPanel } from "./MapPanel";
import { ExpandedMapOverlay } from "./ExpandedMapOverlay";

type Props = {
  listings: Listing[];
  selectedListingId: string | null;
  onSelectListing: (id: string | null) => void;
  onToggleSave: (id: string) => void;
  mapExpanded: boolean;
  onSetMapExpanded: (b: boolean) => void;
  preferences: UserPreferences;
  onRefine: () => void;
};

const transportLabel: Record<UserPreferences["transportation_preference"], string> = {
  bus: "Bus",
  biking: "Bike",
  walking: "Walk",
  driving: "Drive",
  transit: "Transit",
  either: "Any transport",
  unknown: "Any transport",
};

function summarizePreferences(p: UserPreferences): string {
  const parts: string[] = [];
  if (p.max_rent !== null) parts.push(`$${p.max_rent.toLocaleString()} max`);
  if (p.neighborhoods.length > 0)
    parts.push(
      p.neighborhoods.length <= 2
        ? p.neighborhoods.join(" / ")
        : `${p.neighborhoods.length} areas`
    );
  else parts.push("Near UCSC");
  if (p.max_commute_minutes !== null)
    parts.push(
      `${transportLabel[p.transportation_preference]} under ${p.max_commute_minutes} min`
    );
  if (p.roommates !== null && p.roommates > 0)
    parts.push(`${p.roommates} roommate${p.roommates === 1 ? "" : "s"}`);
  return parts.join(" • ");
}

export function Dashboard(props: Props) {
  const selectedListing =
    props.listings.find((l) => l.id === props.selectedListingId) ?? null;
  const summary = summarizePreferences(props.preferences);

  return (
    <div className="px-8 py-6 flex flex-col gap-5 min-h-screen">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted text-sm mt-1">
            Organize rentals that match your preferences.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-full border border-frame px-4 py-2 shadow-soft text-sm">
          <span className="text-muted truncate max-w-xs sm:max-w-md" title={summary}>
            {summary}
          </span>
          <button
            onClick={props.onRefine}
            className="ml-2 px-3 py-1.5 rounded-full bg-mint text-ink font-medium text-sm hover:bg-mint-deep transition-colors"
          >
            Refine
          </button>
        </div>
      </header>

      <div className="flex gap-5 flex-1 min-h-0">
        <div className="flex-1 min-w-0">
          <KanbanBoard
            listings={props.listings}
            selectedListingId={props.selectedListingId}
            onSelectListing={props.onSelectListing}
            onToggleSave={props.onToggleSave}
          />
        </div>
        <div className="shrink-0 w-64">
          <MapPanel
            listings={props.listings}
            selectedListing={selectedListing}
            onExpand={() => props.onSetMapExpanded(true)}
            onSelectListing={props.onSelectListing}
          />
        </div>
      </div>

      {props.mapExpanded && (
        <ExpandedMapOverlay
          listings={props.listings}
          selectedListing={selectedListing}
          onClose={() => props.onSetMapExpanded(false)}
          onSelectListing={props.onSelectListing}
        />
      )}
    </div>
  );
}
