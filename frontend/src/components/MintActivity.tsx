const items = [
  "Preferences saved",
  "Listings ranked",
  "Commutes checked",
  "Ready to refine",
];

export function MintActivity() {
  return (
    <div className="rounded-3xl bg-white border border-frame p-4 shadow-soft">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-mint flex items-center justify-center text-[10px] font-bold text-ink">
          M
        </div>
        <div className="text-sm font-medium">Mint Activity</div>
      </div>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li
            key={it}
            className="text-xs text-muted flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-mint-deep" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
