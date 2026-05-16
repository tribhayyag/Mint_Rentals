import type { Listing } from "../types/listing";

type Props = {
  listings: Listing[];
  selectedListing: Listing | null;
  onExpand: () => void;
  onSelectListing: (id: string | null) => void;
};

const pinPositions: { left: string; top: string }[] = [
  { left: "20%", top: "60%" },
  { left: "55%", top: "55%" },
  { left: "70%", top: "35%" },
  { left: "40%", top: "25%" },
  { left: "30%", top: "75%" },
  { left: "60%", top: "75%" },
  { left: "78%", top: "55%" },
  { left: "45%", top: "45%" },
];

export function MapPanel({
  listings,
  selectedListing,
  onExpand,
  onSelectListing,
}: Props) {
  return (
    <aside className="bg-white rounded-3xl border border-frame shadow-soft p-4 flex flex-col gap-3 h-full">
      <div>
        <div className="font-semibold">Map Preview</div>
        <p className="text-xs text-muted mt-0.5">
          Collapsed so listings stay spacious.
        </p>
      </div>

      <div className="relative rounded-2xl h-48 bg-gradient-to-br from-mint-soft to-beige overflow-hidden border border-frame">
        <div className="absolute left-1/2 top-3 -translate-x-1/2 flex items-center gap-1 bg-white/90 rounded-full border border-frame px-2 py-0.5 text-[10px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-mint-deep" /> UCSC
        </div>

        {listings.slice(0, pinPositions.length).map((l, i) => {
          const isSelected = l.id === selectedListing?.id;
          return (
            <button
              key={l.id}
              onClick={() => onSelectListing(isSelected ? null : l.id)}
              style={{ left: pinPositions[i].left, top: pinPositions[i].top }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-transform ${
                isSelected
                  ? "bg-mint-deep border-ink scale-150"
                  : "bg-mint border-white hover:scale-125"
              }`}
              aria-label={l.title}
              title={l.title}
            />
          );
        })}
      </div>

      <button
        onClick={onExpand}
        className="rounded-full bg-mint text-ink text-xs font-medium px-3 py-2 hover:bg-mint-deep transition-colors"
      >
        Expand map panel
      </button>

      <div className="rounded-2xl bg-beige/70 border border-frame p-3">
        {selectedListing ? (
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted">
              Selected
            </div>
            <div className="font-medium text-sm leading-tight mt-0.5">
              {selectedListing.title}
            </div>
            <div className="text-xs text-muted mt-1">
              ${selectedListing.rent.toLocaleString()} ·{" "}
              {selectedListing.commuteMinutes} min
            </div>
          </div>
        ) : (
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted">
              Mint Activity
            </div>
            <div className="text-sm leading-tight mt-1">
              Pick a listing to preview its pin.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
