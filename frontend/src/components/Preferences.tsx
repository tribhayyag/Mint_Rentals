import { useEffect } from "react";
import type {
  UserPreferences,
  TransportationPreference,
  PropertyType,
  RoomType,
  YesNoUnknown,
  FurnishedValue,
  LaundryValue,
} from "../types/preferences";
import { SANTA_CRUZ_NEIGHBORHOODS } from "../types/preferences";

type Props = {
  preferences: UserPreferences;
};

// Display vocab mapping — keeps internal tool vocab (`single`, `biking`, etc.)
// separate from user-facing labels.
const transportLabel: Record<TransportationPreference, string> = {
  bus: "Bus",
  biking: "Bike",
  walking: "Walk",
  driving: "Drive",
  transit: "Transit",
  either: "Any",
  unknown: "No preference",
};

const propertyLabel: Record<PropertyType, string> = {
  apartment: "Apartment",
  house: "House",
  sublease: "Sublease",
  room: "Room",
  unknown: "Any",
};

const roomLabel: Record<RoomType, string> = {
  single: "Private",
  shared: "Shared",
  unknown: "No preference",
};

const yesNoLabel: Record<YesNoUnknown, string> = {
  yes: "Required",
  no: "No",
  unknown: "No preference",
};

const furnishedLabel: Record<FurnishedValue, string> = {
  yes: "Yes",
  no: "No",
  either: "Either",
  unknown: "No preference",
};

const laundryLabel: Record<LaundryValue, string> = {
  "in-unit": "In-unit",
  shared: "Shared",
  either: "Either",
  unknown: "No preference",
};

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-muted mb-1.5">{label}</div>
      <div className="rounded-2xl border border-frame bg-cream/60 px-3 py-2 text-sm">
        {value}
      </div>
    </div>
  );
}

function ChipRow({
  label,
  options,
  selected,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-muted mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <span
            key={opt}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              selected.has(opt)
                ? "bg-mint border-mint-deep text-ink font-medium"
                : "bg-white border-frame text-muted"
            }`}
          >
            {opt}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Preferences({ preferences: p }: Props) {
  const budgetText =
    p.min_rent !== null && p.max_rent !== null
      ? `$${p.min_rent.toLocaleString()} – $${p.max_rent.toLocaleString()}/mo`
      : p.max_rent !== null
      ? `Up to $${p.max_rent.toLocaleString()}/mo`
      : "No preference";

  const neighborhoodLabel =
    p.neighborhoods.length === 0
      ? "No preference"
      : p.neighborhoods.length === SANTA_CRUZ_NEIGHBORHOODS.length
      ? `All ${SANTA_CRUZ_NEIGHBORHOODS.length} neighborhoods`
      : p.neighborhoods.join(", ");

  const commuteText =
    p.max_commute_minutes !== null
      ? `Up to ${p.max_commute_minutes} minutes`
      : "No preference";

  const propertyTypeLabel =
    p.property_types.length === 0
      ? "No preference"
      : p.property_types.map((t) => propertyLabel[t]).join(", ");

  const roommatesLabel =
    p.roommates === null
      ? "No preference"
      : p.roommates === 0
      ? "Living alone"
      : `${p.roommates} roommate${p.roommates === 1 ? "" : "s"}`;

  useEffect(() => {
    const url = (import.meta.env.VITE_SAVE_PREFS_URL as string) || "http://localhost:8000/save_preferences";
    try {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      }).catch(() => {
        /* best-effort only */
      });
    } catch (err) {
      /* ignore in read-only UI */
    }
  }, [p]);

  return (
    <div className="px-8 py-6 min-h-screen">
      <h1 className="text-2xl font-semibold">Preferences</h1>
      <p className="text-muted text-sm mt-1">
        What Mint uses to rank your rentals. Tap{" "}
        <span className="font-medium text-ink">Refine</span> on the dashboard to
        change these.
      </p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl">
        <section className="rounded-3xl bg-white border border-frame p-5 shadow-soft">
          <header className="mb-4">
            <h2 className="font-semibold">Budget & location</h2>
            <p className="text-xs text-muted mt-0.5">The basics.</p>
          </header>
          <div className="space-y-4">
            <ReadOnlyField label="Monthly budget" value={budgetText} />
            <ReadOnlyField label="Destination" value={p.destination_address} />
            <ChipRow
              label="Preferred neighborhoods"
              options={[...SANTA_CRUZ_NEIGHBORHOODS]}
              selected={new Set(p.neighborhoods)}
            />
            <ReadOnlyField
              label="Selected neighborhoods"
              value={neighborhoodLabel}
            />
          </div>
        </section>

        <section className="rounded-3xl bg-white border border-frame p-5 shadow-soft">
          <header className="mb-4">
            <h2 className="font-semibold">Commute</h2>
            <p className="text-xs text-muted mt-0.5">How you get to UCSC.</p>
          </header>
          <div className="space-y-4">
            <ReadOnlyField label="Max commute" value={commuteText} />
            <ChipRow
              label="Transportation"
              options={["Bus", "Bike", "Walk", "Drive"]}
              selected={new Set([transportLabel[p.transportation_preference]])}
            />
          </div>
        </section>

        <section className="rounded-3xl bg-white border border-frame p-5 shadow-soft">
          <header className="mb-4">
            <h2 className="font-semibold">Housing</h2>
            <p className="text-xs text-muted mt-0.5">Type of place.</p>
          </header>
          <div className="space-y-4">
            <ChipRow
              label="Property type"
              options={["Apartment", "House", "Sublease"]}
              selected={
                new Set(p.property_types.map((t) => propertyLabel[t]))
              }
            />
            <ReadOnlyField label="Property summary" value={propertyTypeLabel} />
            <ChipRow
              label="Room type"
              options={["Private", "Shared"]}
              selected={new Set([roomLabel[p.room_type]])}
            />
            <ReadOnlyField label="Roommates" value={roommatesLabel} />
          </div>
        </section>

        <section className="rounded-3xl bg-white border border-frame p-5 shadow-soft">
          <header className="mb-4">
            <h2 className="font-semibold">Amenities</h2>
            <p className="text-xs text-muted mt-0.5">Nice-to-haves.</p>
          </header>
          <div className="space-y-4">
            <ReadOnlyField
              label="Pet friendly"
              value={yesNoLabel[p.amenities.pet_friendly]}
            />
            <ReadOnlyField
              label="Parking"
              value={yesNoLabel[p.amenities.parking]}
            />
            <ReadOnlyField
              label="Accessible"
              value={yesNoLabel[p.amenities.accessible]}
            />
            <ReadOnlyField
              label="Furnished"
              value={furnishedLabel[p.amenities.furnished]}
            />
            <ReadOnlyField
              label="Laundry"
              value={laundryLabel[p.amenities.laundry]}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
