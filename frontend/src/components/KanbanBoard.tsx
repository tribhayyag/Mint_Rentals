import type { Listing } from "../types/listing";
import { ListingCard } from "./ListingCard";

type Props = {
  listings: Listing[];
  selectedListingId: string | null;
  onSelectListing: (id: string | null) => void;
  onToggleSave: (id: string) => void;
};

export function KanbanBoard({
  listings,
  selectedListingId,
  onSelectListing,
  onToggleSave,
}: Props) {
  const bestMatches = [...listings]
    .sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1))
    .slice(0, 3);
  const cheapest = [...listings].sort((a, b) => a.rent - b.rent).slice(0, 3);
  const bestCommute = [...listings]
    .sort((a, b) => a.commuteMinutes - b.commuteMinutes)
    .slice(0, 3);

  const columns: {
    title: string;
    subtitle: string;
    items: Listing[];
  }[] = [
    {
      title: "Best Matches",
      subtitle: "Top fit overall",
      items: bestMatches,
    },
    {
      title: "Cheapest",
      subtitle: "Lowest rent",
      items: cheapest,
    },
    {
      title: "Best Commute",
      subtitle: "Shortest commute to UCSC",
      items: bestCommute,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-full">
      {columns.map((col) => (
        <section
          key={col.title}
          className="rounded-3xl bg-beige/60 border border-frame p-4 flex flex-col"
        >
          <header className="px-1 pb-3 flex items-center justify-between">
            <div>
              <div className="font-semibold">{col.title}</div>
              <div className="text-xs text-muted">{col.subtitle}</div>
            </div>
            <div className="text-xs text-muted bg-white rounded-full border border-frame px-2 py-0.5">
              {col.items.length}
            </div>
          </header>
          <div className="flex flex-col gap-3">
            {col.items.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                selected={listing.id === selectedListingId}
                onSelect={() =>
                  onSelectListing(
                    listing.id === selectedListingId ? null : listing.id
                  )
                }
                onToggleSave={() => onToggleSave(listing.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
