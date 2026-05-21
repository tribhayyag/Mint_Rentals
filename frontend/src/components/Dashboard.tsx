import type { Listing } from "../types/listing";
import type { UserPreferences } from "../types/preferences";
import { KanbanBoard } from "./KanbanBoard";
import { MapPanel } from "./MapPanel";
import { ExpandedMapOverlay } from "./ExpandedMapOverlay";
import summarizeTradeoff from "../lib/tradeoffs";

type Props = {
  listings: Listing[];
  selectedListingId: string | null;
  compareIds: string[];
  onSelectListing: (id: string | null) => void;
  onToggleSave: (id: string) => void;
  onToggleCompare: (id: string) => void;
  compareLimitReached: boolean;
  onClearCompare: () => void;
  mapExpanded: boolean;
  onSetMapExpanded: (b: boolean) => void;
  preferences: UserPreferences;
  onRefine: () => void;
  onNavigateToCompare: () => void;
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
  const selectedCompareListings = props.listings.filter((l) =>
    props.compareIds.includes(l.id)
  );
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

      <div className="flex flex-col gap-5 lg:flex-row flex-1 min-h-0">
        <div className="flex-1 min-w-0">
          <KanbanBoard
            listings={props.listings}
            selectedListingId={props.selectedListingId}
            compareIds={props.compareIds}
            onSelectListing={props.onSelectListing}
            onToggleSave={props.onToggleSave}
            onToggleCompare={props.onToggleCompare}
            compareLimitReached={props.compareLimitReached}
          />
        </div>
        <div className="shrink-0 w-full lg:w-80">
          <MapPanel
            listings={props.listings}
            selectedListing={selectedListing}
            onExpand={() => props.onSetMapExpanded(true)}
            onSelectListing={props.onSelectListing}
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <AgentReasoningPanel />
      </div>

      {props.compareIds.length > 0 && (
        <div className="bg-mint-soft border border-mint rounded-2xl p-4 mt-5 flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">
              {props.compareIds.length} listing{props.compareIds.length !== 1 ? "s" : ""} selected for comparison
            </p>
            <p className="text-xs text-muted mt-1">View them side-by-side in the Compare tab</p>
          </div>
          <button
            onClick={props.onNavigateToCompare}
            className="px-4 py-2 rounded-full bg-mint text-ink font-medium text-sm hover:bg-mint-deep transition-colors"
          >
            View Compare
          </button>
        </div>
      )}

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


function AgentReasoningPanel() {
  const stages = [
    {
      label: "Parsed Preferences",
      description:
        "Converted your budget, commute, and housing needs into structured rules.",
      status: "Complete",
    },
    {
      label: "Searched Listings",
      description: "Filtered mock/local listings for the best fit.",
      status: "Complete",
    },
    {
      label: "Calculated Commute",
      description: "Estimated travel time to UCSC for each listing.",
      status: "Complete",
    },
    {
      label: "Checked Safety",
      description: "Applied fallback safety scores from mock data.",
      status: "Fallback Used",
    },
    {
      label: "Ranked Matches",
      description: "Scored options by fit, price, and amenities.",
      status: "Complete",
    },
  ];

  return (
    <section className="rounded-3xl bg-white border border-frame p-5 shadow-soft">
      <h2 className="font-semibold">Agent reasoning</h2>
      <p className="text-xs text-muted mt-1">
        Step-by-step mock reasoning for the current housing recommendations.
      </p>

      <div className="mt-5 space-y-3">
        {stages.map((stage) => (
          <div
            key={stage.label}
            className="rounded-3xl border border-frame bg-cream/80 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{stage.label}</div>
                <div className="text-xs text-muted mt-1">
                  {stage.description}
                </div>
              </div>
              <span
                className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${
                  stage.status === "Complete"
                    ? "bg-mint text-ink"
                    : stage.status === "Fallback Used"
                    ? "bg-orange-soft text-orange-900"
                    : "bg-cream text-muted"
                }`}
              >
                {stage.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-[11px] text-muted">
        This explanation panel is generated from local mock data and should be used as a guide, not as a verified safety report.
      </div>
    </section>
  );
}
