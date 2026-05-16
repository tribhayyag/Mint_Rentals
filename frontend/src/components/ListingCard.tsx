import type { Listing } from "../types/listing";

type Props = {
  listing: Listing;
  selected: boolean;
  onSelect: () => void;
  onToggleSave: () => void;
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
  onSelect,
  onToggleSave,
}: Props) {
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
      <div className="mt-2 flex flex-wrap gap-1.5">
        {listing.tags.slice(0, 3).map((t) => (
          <span
            key={t}
            className="text-[11px] px-2 py-0.5 rounded-full bg-cream border border-frame text-muted"
          >
            {t}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end">
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
    </article>
  );
}
