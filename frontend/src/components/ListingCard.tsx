import type { Listing } from "../types/listing";

type Props = {
  listing: Listing;
  selected: boolean;
  compareSelected: boolean;
  compareDisabled: boolean;
  onSelect: () => void;
  onToggleSave: () => void;
  onToggleCompare: () => void;
};

const commuteLabel: Record<Listing["commuteMode"], string> = {
  walk: "Walk",
  bike: "Bike",
  bus: "Bus",
  drive: "Drive",
  unknown: "Commute",
};

export function ListingCard({
  listing,
  selected,
  compareSelected,
  compareDisabled,
  onSelect,
  onToggleSave,
  onToggleCompare,
}: Props) {
  const reasonChips = [
    listing.matchScore && listing.matchScore >= 85 ? "Strong match" : null,
    listing.commuteMinutes <= 20
      ? "Near campus"
      : listing.commuteMode === "bus"
      ? "Bus-friendly commute"
      : listing.commuteMode === "bike"
      ? "Bike-friendly commute"
      : null,
    listing.tags.includes("Furnished") ? "Furnished" : null,
    listing.tags.includes("Parking") ? "Parking available" : null,
    listing.safetyRating != null
      ? `Safety ${listing.safetyRating}/10`
      : "Safety data unavailable",
  ]
    .filter(Boolean)
    .slice(0, 5) as string[];

  return (
    <article
      onClick={onSelect}
      className={`group cursor-pointer rounded-3xl bg-white border ${
        selected ? "border-mint-deep ring-2 ring-mint" : "border-frame"
      } shadow-soft hover:shadow-card transition p-3`}
    >
      <div className="rounded-2xl h-24 bg-gradient-to-br from-mint-soft to-beige flex items-center justify-center text-muted text-xs">
        {listing.neighborhood}
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold leading-tight truncate">
            {listing.title}
          </div>
          <div className="text-xs text-muted mt-0.5 truncate">
            {listing.address} · {listing.neighborhood}
          </div>
        </div>
        {typeof listing.matchScore === "number" && (
          <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-mint text-ink">
            {listing.matchScore}%
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="font-semibold">
          ${listing.rent.toLocaleString()}/mo
        </span>
        <span className="text-xs text-muted">
          {commuteLabel[listing.commuteMode]} · {listing.commuteMinutes} min
        </span>
      </div>
      {listing.aiReason && (
        <p className="text-xs text-muted mt-2 line-clamp-2">{listing.aiReason}</p>
      )}
      <div className="mt-3">
        <div className="text-xs font-semibold text-ink mb-2">Why this matches</div>
        <div className="flex flex-wrap gap-2">
          {reasonChips.map((chip) => (
            <span
              key={chip}
              className="text-[11px] px-2.5 py-1 rounded-full bg-mint-soft text-ink"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {listing.tags.slice(0, 3).map((t) => (
          <span
            key={t}
            className="text-[11px] px-2 py-0.5 rounded-full bg-cream border border-frame text-muted"
          >
            {t}
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare();
            }}
            disabled={compareDisabled && !compareSelected}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              compareSelected
                ? "bg-ink text-white border-ink"
                : "bg-white text-muted border-frame hover:border-mint-deep hover:text-ink"
            } ${compareDisabled && !compareSelected ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {compareSelected ? "Comparing" : compareDisabled ? "Max 3" : "Compare"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave();
            }}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              listing.saved
                ? "bg-mint-deep text-ink border-mint-deep"
                : "bg-white text-muted border-frame hover:border-mint-deep hover:text-ink"
            }`}
          >
            {listing.saved ? "Saved" : "Save"}
          </button>
        </div>
        <span className="text-[11px] text-muted">{listing.dataSource ?? "Mock data"}</span>
      </div>
    </article>
  );
}
