import type { Listing } from "../types/listing";
import summarizeTradeoff from "../lib/tradeoffs";

type Props = {
  listings: Listing[];
  compareIds: string[];
  onToggleSave: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onClearCompare: () => void;
};

export function CompareView({
  listings,
  compareIds,
  onToggleSave,
  onToggleCompare,
  onClearCompare,
}: Props) {
  const selectedListings = listings.filter((l) => compareIds.includes(l.id));

  if (selectedListings.length === 0) {
    return (
      <div className="px-8 py-6 flex flex-col items-center justify-center min-h-screen text-center">
        <div className="w-20 h-20 rounded-full bg-cream flex items-center justify-center mb-4">
          <span className="text-3xl">📋</span>
        </div>
        <h2 className="text-2xl font-semibold mb-2">No listings to compare</h2>
        <p className="text-muted mb-6 max-w-sm">
          Go to the Dashboard or Saved Listings and click "Compare" on listing cards to select
          up to 3 properties for side-by-side comparison.
        </p>
      </div>
    );
  }

  return (
    <div className="px-8 py-6 flex flex-col gap-5 min-h-screen">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Compare listings</h1>
          <p className="text-muted text-sm mt-1">
            {selectedListings.length} listing{selectedListings.length !== 1 ? "s" : ""} selected
            for comparison
          </p>
        </div>
        <button
          onClick={onClearCompare}
          className="px-4 py-2 rounded-full border border-frame bg-cream text-muted font-medium text-sm hover:border-mint-deep hover:text-ink transition-colors"
        >
          Clear all
        </button>
      </header>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {selectedListings.map((listing) => (
          <div
            key={listing.id}
            className="rounded-3xl border border-frame bg-white p-6 shadow-soft flex flex-col"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{listing.title}</h3>
                <p className="text-xs text-muted mt-1">{listing.address}</p>
              </div>
              <button
                onClick={() => onToggleCompare(listing.id)}
                className="p-2 rounded-full border border-frame bg-cream hover:bg-mint-soft hover:border-mint transition-colors"
                title="Remove from comparison"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 flex-1">
              <div className="text-sm bg-beige/50 rounded-2xl p-3">
                <p className="font-medium text-ink">{summarizeTradeoff(listing, selectedListings)}</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Rent</span>
                  <span className="font-semibold text-lg">${listing.rent.toLocaleString()}/mo</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Commute</span>
                  <span className="font-medium">{listing.commuteMinutes ?? "Unknown"} min</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Distance</span>
                  <span className="font-medium">{listing.distanceMiles ?? "Unknown"} mi</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Type</span>
                  <span className="font-medium capitalize">
                    {listing.housingType ?? "Unknown"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Room</span>
                  <span className="font-medium capitalize">{listing.roomType ?? "Unknown"}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Safety</span>
                  <span className="font-medium">{listing.safetyRating ?? "Unknown"}/10</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Source</span>
                  <span className="text-xs bg-cream px-2 py-1 rounded-full">
                    {listing.dataSource ?? "Mock data"}
                  </span>
                </div>
              </div>

              {listing.matchNotes?.length ? (
                <div className="pt-3 border-t border-frame">
                  <p className="text-xs text-muted mb-2 font-medium">Match notes</p>
                  <div className="flex flex-wrap gap-2">
                    {listing.matchNotes.map((note) => (
                      <span
                        key={note}
                        className="text-xs bg-mint-soft text-ink px-2.5 py-1 rounded-full"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => onToggleSave(listing.id)}
                className={`flex-1 py-2 px-3 rounded-full font-medium text-sm transition-colors ${
                  listing.saved
                    ? "bg-mint text-ink hover:bg-mint-deep"
                    : "border border-frame text-muted hover:bg-cream"
                }`}
              >
                {listing.saved ? "❤ Saved" : "Save"}
              </button>
              <button
                onClick={() => onToggleCompare(listing.id)}
                className="flex-1 py-2 px-3 rounded-full border border-frame text-muted font-medium text-sm hover:bg-cream transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
