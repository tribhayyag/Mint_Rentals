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
        {props.compareIds.length > 0 && (
          <ComparePanel
            listings={selectedCompareListings}
            onClearCompare={props.onClearCompare}
          />
        )}
        <AgentReasoningPanel />
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

function ComparePanel({
  listings,
  onClearCompare,
}: {
  listings: Listing[];
  onClearCompare: () => void;
}) {
  return (
    <section className="rounded-3xl bg-white border border-frame p-5 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Compare selected listings</h2>
          <p className="text-xs text-muted mt-1">
            Compare rent, commute, safety, and match notes side-by-side.
          </p>
        </div>
        <button
          onClick={onClearCompare}
          className="rounded-full border border-frame bg-cream px-4 py-2 text-xs font-medium text-muted hover:border-mint-deep hover:text-ink transition-colors"
        >
          Clear selection
        </button>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div
          className={`grid gap-4 ${
            listings.length === 1
              ? "grid-cols-1"
              : listings.length === 2
              ? "grid-cols-2"
              : "grid-cols-3"
          }`}
        >
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="rounded-3xl border border-frame bg-beige/70 p-4"
            >
                <div className="font-semibold text-sm">{listing.title}</div>
              <div className="text-[11px] text-muted mt-1">
                {listing.address}
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="text-sm font-medium">{summarizeTradeoff(listing, listings)}</div>
                <div>
                  <span className="font-medium">Rent:</span>{" "}
                  ${listing.rent.toLocaleString()}/mo
                </div>
                <div>
                  <span className="font-medium">Commute:</span>{" "}
                  {listing.commuteMinutes ?? "Unknown"} min
                </div>
                <div>
                  <span className="font-medium">Distance:</span>{" "}
                  {listing.distanceMiles ?? "Unknown"} mi
                </div>
                <div>
                  <span className="font-medium">Type:</span>{" "}
                  {listing.housingType ?? "Unknown"}
                </div>
                <div>
                  <span className="font-medium">Room:</span>{" "}
                  {listing.roomType ?? "Unknown"}
                </div>
                <div>
                  <span className="font-medium">Safety:</span>{" "}
                  {listing.safetyRating ?? "Unknown"}/10
                </div>
                <div>
                  <span className="font-medium">Source:</span>{" "}
                  {listing.dataSource ?? "Mock data"}
                </div>
                <div className="text-xs text-muted">
                  {listing.matchNotes?.length
                    ? listing.matchNotes.join(", ")
                    : "No match notes available."}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
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
