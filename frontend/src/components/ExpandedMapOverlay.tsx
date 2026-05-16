import type { Listing } from "../types/listing";

type Props = {
  listings: Listing[];
  selectedListing: Listing | null;
  onClose: () => void;
  onSelectListing: (id: string | null) => void;
};

const expandedPins: { left: string; top: string }[] = [
  { left: "18%", top: "60%" },
  { left: "55%", top: "55%" },
  { left: "72%", top: "35%" },
  { left: "40%", top: "25%" },
  { left: "30%", top: "75%" },
  { left: "62%", top: "78%" },
  { left: "78%", top: "50%" },
  { left: "48%", top: "45%" },
];

export function ExpandedMapOverlay({
  listings,
  selectedListing,
  onClose,
  onSelectListing,
}: Props) {
  return (
    <div className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm flex items-center justify-center p-8">
      <div className="relative w-full max-w-5xl h-[80vh] rounded-4xl bg-white border border-frame shadow-lift overflow-hidden flex flex-col">
        <header className="px-6 py-4 flex items-center justify-between border-b border-frame">
          <div>
            <h2 className="font-semibold text-lg">Map Preview</h2>
            <p className="text-xs text-muted">
              Mock map — fixed pins, no real geocoding yet.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-sm rounded-full border border-frame px-3 py-1.5 hover:bg-cream transition-colors"
          >
            Close
          </button>
        </header>

        <div className="relative flex-1 bg-gradient-to-br from-mint-soft to-beige">
          <div className="absolute left-1/2 top-6 -translate-x-1/2 flex items-center gap-2 bg-white/90 rounded-full border border-frame px-3 py-1 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-mint-deep" /> UC Santa Cruz
          </div>

          {listings.slice(0, expandedPins.length).map((l, i) => {
            const isSelected = l.id === selectedListing?.id;
            return (
              <button
                key={l.id}
                onClick={() => onSelectListing(isSelected ? null : l.id)}
                style={{
                  left: expandedPins[i].left,
                  top: expandedPins[i].top,
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-full text-[10px] font-medium border-2 shadow-soft transition-colors ${
                  isSelected
                    ? "bg-mint-deep text-ink border-ink"
                    : "bg-white text-ink border-mint-deep hover:bg-mint"
                }`}
                title={l.title}
              >
                ${l.rent.toLocaleString()}
              </button>
            );
          })}
        </div>

        {selectedListing && (
          <footer className="px-6 py-4 border-t border-frame flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-semibold leading-tight truncate">
                {selectedListing.title}
              </div>
              <div className="text-xs text-muted truncate">
                {selectedListing.neighborhood} · $
                {selectedListing.rent.toLocaleString()}/mo ·{" "}
                {selectedListing.commuteMinutes} min
              </div>
            </div>
            {typeof selectedListing.matchScore === "number" && (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-mint">
                {selectedListing.matchScore}% fit
              </span>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}
