import type { ViewName } from "../types/listing";
import { MintActivity } from "./MintActivity";

type NavItem = { id: ViewName; label: string; letter: string };

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", letter: "D" },
  { id: "saved", label: "Saved Listings", letter: "S" },
  { id: "compare", label: "Compare", letter: "C" },
  { id: "preferences", label: "Preferences", letter: "P" },
];

type Props = {
  activeView: ViewName;
  onChangeView: (v: ViewName) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  compareCount: number;
};

export function Sidebar({
  activeView,
  onChangeView,
  collapsed,
  onToggleCollapse,
  compareCount,
}: Props) {
  return (
    <aside
      className={`shrink-0 ${
        collapsed ? "w-20" : "w-56"
      } bg-beige border-r border-frame flex flex-col transition-[width] duration-200`}
    >
      <div className="px-4 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-mint flex items-center justify-center font-semibold text-ink shrink-0">
          M
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-semibold leading-tight">Mint Rental</div>
            <div className="text-xs text-muted">rental workspace</div>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="ml-auto text-muted hover:text-ink w-7 h-7 rounded-lg border border-frame flex items-center justify-center text-sm bg-white"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      <nav className="px-3 mt-2 space-y-1">
        {navItems.map((item) => {
          const active = item.id === activeView;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              title={item.label}
              className={`w-full flex items-center gap-3 ${
                collapsed ? "justify-center px-0" : "px-3"
              } py-2.5 rounded-2xl text-sm transition-colors ${
                active
                  ? "bg-mint-soft text-ink font-medium"
                  : "text-muted hover:bg-cream hover:text-ink"
              }`}
            >
              <span
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-semibold shrink-0 relative ${
                  active
                    ? "bg-mint text-ink"
                    : "bg-white text-muted border border-frame"
                }`}
              >
                {item.letter}
                {item.id === "compare" && compareCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {compareCount}
                  </span>
                )}
              </span>
              {!collapsed && (
                <span className="truncate flex-1 flex items-center gap-2">
                  {item.label}
                  {item.id === "compare" && compareCount > 0 && (
                    <span className="text-xs bg-orange-soft text-orange-900 px-1.5 py-0.5 rounded-full font-medium ml-auto">
                      {compareCount}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="mt-auto px-3 pb-4">
          <MintActivity />
        </div>
      )}
    </aside>
  );
}
