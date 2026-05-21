import type { Listing } from "../types/listing";
import { ListingCard } from "./ListingCard";

type Props = {
  listings: Listing[];
  selectedListingId: string | null;
  compareIds: string[];
  onSelectListing: (id: string | null) => void;
  onToggleSave: (id: string) => void;
  onToggleCompare: (id: string) => void;
  compareLimitReached: boolean;
  onNavigateToCompare: () => void;
};

export function SavedListings({
  listings,
  selectedListingId,
  compareIds,
  onSelectListing,
  onToggleSave,
  onToggleCompare,
  compareLimitReached,
  onNavigateToCompare,
}: Props) {
  const saved = listings.filter((l) => l.saved);

  return (
    <div className="px-8 py-6 min-h-screen">
      <h1 className="text-2xl font-semibold">Saved Listings</h1>
      <p className="text-muted text-sm mt-1">
        Rentals you've kept for later. Unsave anytime.
      </p>

      {saved.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-white border border-frame p-8 max-w-md shadow-soft">
          <div className="text-sm text-muted">
            No saved listings yet. Save a rental from your dashboard to see it
            here.
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-6xl">
          {saved.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              selected={l.id === selectedListingId}
              compareSelected={compareIds.includes(l.id)}
              compareDisabled={compareLimitReached}
              onSelect={() =>
                onSelectListing(l.id === selectedListingId ? null : l.id)
              }
              onToggleSave={() => onToggleSave(l.id)}
              onToggleCompare={() => onToggleCompare(l.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
