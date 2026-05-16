import { useState } from "react";
import type {
  UserPreferences,
  TransportationPreference,
  PropertyType,
  RoomType,
  FurnishedValue,
  LaundryValue,
  YesNoUnknown,
} from "../types/preferences";
import { SANTA_CRUZ_NEIGHBORHOODS } from "../types/preferences";
import {
  toUserPreferences,
  initialWizardState,
  type WizardState,
} from "../lib/toUserPreferences";

type Props = {
  onSubmit: (prefs: UserPreferences) => void;
};

const TOTAL_STEPS = 5;

export function Onboarding({ onSubmit }: Props) {
  const [step, setStep] = useState(0); // 0 = welcome card
  const [state, setState] = useState<WizardState>(initialWizardState);

  function patch(part: Partial<WizardState>) {
    setState((s) => ({ ...s, ...part }));
  }

  function handleSubmit() {
    onSubmit(toUserPreferences(state));
  }

  if (step === 0) {
    return <WelcomeCard onGetStarted={() => setStep(1)} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-10 bg-cream">
      <Brand />

      <div className="w-full max-w-2xl bg-white rounded-4xl border border-frame shadow-card p-7 mt-6">
        <StepHeader step={step} total={TOTAL_STEPS} />

        {step === 1 && (
          <BudgetStep
            min={state.minRent}
            max={state.maxRent}
            onChange={(min, max) => patch({ minRent: min, maxRent: max })}
          />
        )}
        {step === 2 && (
          <LocationStep
            selected={state.neighborhoods}
            noPreference={state.noNeighborhoodPreference}
            onToggle={(name) =>
              patch({
                noNeighborhoodPreference: false,
                neighborhoods: state.neighborhoods.includes(name)
                  ? state.neighborhoods.filter((n) => n !== name)
                  : [...state.neighborhoods, name],
              })
            }
            onSelectAll={() =>
              patch({
                neighborhoods: [...SANTA_CRUZ_NEIGHBORHOODS],
                noNeighborhoodPreference: false,
              })
            }
            onNoPreference={() =>
              patch({
                neighborhoods: [],
                noNeighborhoodPreference: true,
              })
            }
          />
        )}
        {step === 3 && (
          <CommuteStep
            transportation={state.transportation}
            maxCommute={state.maxCommuteMinutes}
            onChangeTransportation={(t) => patch({ transportation: t })}
            onChangeMaxCommute={(n) => patch({ maxCommuteMinutes: n })}
          />
        )}
        {step === 4 && (
          <SpaceStep
            propertyTypes={state.propertyTypes}
            roommates={state.roommates}
            roomType={state.roomType}
            onTogglePropertyType={(p) =>
              patch({
                propertyTypes: state.propertyTypes.includes(p)
                  ? state.propertyTypes.filter((x) => x !== p)
                  : [...state.propertyTypes, p],
              })
            }
            onChangeRoommates={(n) =>
              patch({ roommates: Math.max(0, Math.min(8, n)) })
            }
            onChangeRoomType={(r) => patch({ roomType: r })}
          />
        )}
        {step === 5 && (
          <AmenitiesStep
            petFriendly={state.petFriendly}
            parking={state.parking}
            accessible={state.accessible}
            furnished={state.furnished}
            laundry={state.laundry}
            onToggle={(key, current) =>
              patch({ [key]: current === "yes" ? "unknown" : "yes" } as Partial<
                WizardState
              >)
            }
            onChangeFurnished={(v) => patch({ furnished: v })}
            onChangeLaundry={(v) => patch({ laundry: v })}
          />
        )}

        <NavButtons
          step={step}
          total={TOTAL_STEPS}
          onBack={() => setStep((s) => Math.max(1, s - 1))}
          onNext={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

// --- Subcomponents -----------------------------------------------------------

function Brand() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-12 h-12 rounded-2xl bg-mint-soft flex items-center justify-center">
        <HouseIcon className="w-6 h-6 text-mint-deep" />
      </div>
      <h1 className="text-2xl font-semibold leading-tight">Mint Rental</h1>
      <p className="text-sm text-muted">Your autonomous rental assistant</p>
    </div>
  );
}

function WelcomeCard({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 bg-cream">
      <div className="w-14 h-14 rounded-2xl bg-mint-soft flex items-center justify-center">
        <HouseIcon className="w-7 h-7 text-mint-deep" />
      </div>
      <h1 className="mt-5 text-4xl font-semibold">Mint Rental</h1>
      <p className="mt-3 text-muted">Your autonomous rental assistant.</p>
      <p className="mt-1 max-w-md text-center text-muted">
        Tell us what matters. Mint quietly searches, compares, and organizes
        housing options around your lifestyle.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full">
        <FeatureCard
          icon={<PeopleIcon className="w-5 h-5 text-mint-deep" />}
          title="Smart Matching"
          body="AI-powered recommendations based on your preferences and lifestyle"
        />
        <FeatureCard
          icon={<PinIcon className="w-5 h-5 text-mint-deep" />}
          title="Commute Analysis"
          body="Real-time commute calculations to UCSC for every listing"
        />
        <FeatureCard
          icon={<HeartIcon className="w-5 h-5 text-mint-deep" />}
          title="Organized Search"
          body="Keep track of favorites, compare options, and draft messages"
        />
      </div>

      <button
        onClick={onGetStarted}
        className="mt-8 rounded-full bg-mint text-ink font-medium px-8 py-3 hover:bg-mint-deep transition-colors"
      >
        Get Started
      </button>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-3xl bg-white border border-frame p-5 shadow-soft text-center">
      <div className="w-10 h-10 rounded-2xl bg-mint-soft flex items-center justify-center mx-auto">
        {icon}
      </div>
      <div className="mt-3 font-semibold">{title}</div>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}

function StepHeader({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          Step {step} of {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="mt-2 h-1.5 bg-cream rounded-full overflow-hidden">
        <div
          className="h-full bg-mint-deep transition-[width] duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function NavButtons({
  step,
  total,
  onBack,
  onNext,
  onSubmit,
}: {
  step: number;
  total: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  const isLast = step === total;
  return (
    <div className="mt-6 flex items-center gap-3">
      {step > 1 && (
        <button
          onClick={onBack}
          className="rounded-full bg-white border border-frame px-5 py-2.5 text-sm font-medium hover:bg-cream transition-colors"
        >
          Back
        </button>
      )}
      <button
        onClick={isLast ? onSubmit : onNext}
        className="flex-1 rounded-full bg-mint text-ink font-medium py-2.5 hover:bg-mint-deep transition-colors"
      >
        {isLast ? "Find My Home" : "Continue"}
      </button>
    </div>
  );
}

// --- Steps -------------------------------------------------------------------

function BudgetStep({
  min,
  max,
  onChange,
}: {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold">What's your budget?</h2>
      <p className="text-sm text-muted mt-1">
        We'll find listings that fit your price range
      </p>

      <div className="mt-6 flex items-center justify-between text-sm">
        <span className="font-medium">${min}</span>
        <span className="font-medium">${max}</span>
      </div>
      <input
        type="range"
        min={300}
        max={4000}
        step={50}
        value={max}
        onChange={(e) => onChange(min, Number(e.target.value))}
        className="mt-2 w-full accent-mint-deep"
      />

      <div className="mt-5 grid grid-cols-2 gap-4">
        <NumberField
          label="Min"
          value={min}
          onChange={(v) => onChange(Math.min(v, max), max)}
        />
        <NumberField
          label="Max"
          value={max}
          onChange={(v) => onChange(min, Math.max(v, min))}
        />
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <label className="text-xs text-muted block mb-1.5">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full rounded-2xl border border-frame bg-cream/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mint"
      />
    </div>
  );
}

function LocationStep({
  selected,
  noPreference,
  onToggle,
  onSelectAll,
  onNoPreference,
}: {
  selected: string[];
  noPreference: boolean;
  onToggle: (name: string) => void;
  onSelectAll: () => void;
  onNoPreference: () => void;
}) {
  // Static positions for the stylized fake map. Dots cluster around UCSC anchor.
  const pinPositions: Record<string, { left: string; top: string }> = {
    Westside: { left: "30%", top: "40%" },
    Eastside: { left: "58%", top: "38%" },
    Downtown: { left: "42%", top: "50%" },
    "Beach Flats": { left: "36%", top: "62%" },
    Seabright: { left: "50%", top: "62%" },
    "Live Oak": { left: "66%", top: "50%" },
    Capitola: { left: "76%", top: "65%" },
    Aptos: { left: "86%", top: "75%" },
  };

  return (
    <div>
      <h2 className="text-xl font-semibold">Where do you want to live?</h2>
      <p className="text-sm text-muted mt-1">
        Select your preferred neighborhoods around Santa Cruz
      </p>

      <div className="mt-5 relative rounded-3xl border border-frame bg-gradient-to-b from-mint-soft to-cream h-64 overflow-hidden">
        <div className="absolute left-1/2 top-4 -translate-x-1/2 flex items-center gap-1.5 text-xs font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-mint-deep" />
          UCSC
        </div>
        {SANTA_CRUZ_NEIGHBORHOODS.map((n) => {
          const isSelected = selected.includes(n);
          const pos = pinPositions[n];
          return (
            <button
              key={n}
              onClick={() => onToggle(n)}
              style={{ left: pos.left, top: pos.top }}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5"
            >
              <span
                className={`w-4 h-4 rounded-full border-2 transition-transform ${
                  isSelected
                    ? "bg-mint-deep border-ink scale-110"
                    : "bg-white border-frame"
                }`}
              />
              <span className="text-[10px] text-ink">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={onSelectAll}
          className={`rounded-2xl border px-4 py-2.5 text-sm font-medium transition-colors ${
            selected.length === SANTA_CRUZ_NEIGHBORHOODS.length
              ? "bg-mint-soft border-mint-deep text-ink"
              : "bg-white border-frame text-muted hover:border-mint-deep hover:text-ink"
          }`}
        >
          Select All
        </button>
        <button
          onClick={onNoPreference}
          className={`rounded-2xl border px-4 py-2.5 text-sm font-medium transition-colors ${
            noPreference
              ? "bg-mint-soft border-mint-deep text-ink"
              : "bg-white border-frame text-muted hover:border-mint-deep hover:text-ink"
          }`}
        >
          No Preference
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {SANTA_CRUZ_NEIGHBORHOODS.map((n) => {
          const isSelected = selected.includes(n);
          return (
            <button
              key={n}
              onClick={() => onToggle(n)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                isSelected
                  ? "bg-mint border-mint-deep text-ink"
                  : "bg-white border-frame text-muted hover:text-ink"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CommuteStep({
  transportation,
  maxCommute,
  onChangeTransportation,
  onChangeMaxCommute,
}: {
  transportation: TransportationPreference;
  maxCommute: number;
  onChangeTransportation: (t: TransportationPreference) => void;
  onChangeMaxCommute: (n: number) => void;
}) {
  const options: { value: TransportationPreference; label: string }[] = [
    { value: "bus", label: "Bus" },
    { value: "biking", label: "Bike" },
    { value: "walking", label: "Walk" },
    { value: "driving", label: "Drive" },
  ];
  return (
    <div>
      <h2 className="text-xl font-semibold">How do you get to campus?</h2>
      <p className="text-sm text-muted mt-1">
        This helps us calculate accurate commute times
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {options.map((o) => {
          const active = transportation === o.value;
          return (
            <button
              key={o.value}
              onClick={() => onChangeTransportation(o.value)}
              className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-mint-soft border-mint-deep text-ink"
                  : "bg-white border-frame text-muted hover:border-mint-deep hover:text-ink"
              }`}
            >
              <CarIcon className="w-4 h-4" />
              {o.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <div className="text-sm text-muted">
          Max commute time: <span className="text-ink font-medium">{maxCommute} minutes</span>
        </div>
        <input
          type="range"
          min={5}
          max={90}
          step={5}
          value={maxCommute}
          onChange={(e) => onChangeMaxCommute(Number(e.target.value))}
          className="mt-2 w-full accent-mint-deep"
        />
      </div>
    </div>
  );
}

function SpaceStep({
  propertyTypes,
  roommates,
  roomType,
  onTogglePropertyType,
  onChangeRoommates,
  onChangeRoomType,
}: {
  propertyTypes: PropertyType[];
  roommates: number;
  roomType: RoomType;
  onTogglePropertyType: (p: PropertyType) => void;
  onChangeRoommates: (n: number) => void;
  onChangeRoomType: (r: RoomType) => void;
}) {
  const propOptions: { value: PropertyType; label: string }[] = [
    { value: "apartment", label: "Apartment" },
    { value: "house", label: "House" },
    { value: "sublease", label: "Sublease" },
  ];
  return (
    <div>
      <h2 className="text-xl font-semibold">What kind of space?</h2>
      <p className="text-sm text-muted mt-1">Tell us about your living situation</p>

      <div className="mt-5">
        <div className="text-xs text-muted mb-2">
          Property type (select all that apply)
        </div>
        <div className="grid grid-cols-3 gap-3">
          {propOptions.map((o) => {
            const active = propertyTypes.includes(o.value);
            return (
              <button
                key={o.value}
                onClick={() => onTogglePropertyType(o.value)}
                className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-mint-soft border-mint-deep text-ink font-medium"
                    : "bg-white border-frame text-muted hover:border-mint-deep hover:text-ink"
                }`}
              >
                <HouseIcon className="w-4 h-4" />
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-xs text-muted mb-2">Number of roommates</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-2xl border border-frame bg-cream/60 px-4 py-2.5 text-center font-medium">
            {roommates}
          </div>
          <button
            onClick={() => onChangeRoommates(roommates + 1)}
            className="w-10 h-10 rounded-2xl bg-mint-soft text-ink font-semibold hover:bg-mint transition-colors"
            aria-label="Add roommate"
          >
            +
          </button>
          <button
            onClick={() => onChangeRoommates(roommates - 1)}
            className="w-10 h-10 rounded-2xl bg-mint-soft text-ink font-semibold hover:bg-mint transition-colors"
            aria-label="Remove roommate"
          >
            −
          </button>
        </div>
        <div className="text-xs text-muted mt-1">
          {roommates} {roommates === 1 ? "roommate" : "roommates"}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-xs text-muted mb-2">Room type</div>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: "single", label: "Private Room" },
              { value: "shared", label: "Shared Room" },
            ] as { value: RoomType; label: string }[]
          ).map((o) => {
            const active = roomType === o.value;
            return (
              <button
                key={o.value}
                onClick={() => onChangeRoomType(o.value)}
                className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-mint-soft border-mint-deep text-ink font-medium"
                    : "bg-white border-frame text-muted hover:border-mint-deep hover:text-ink"
                }`}
              >
                <BedIcon className="w-4 h-4" />
                {o.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AmenitiesStep({
  petFriendly,
  parking,
  accessible,
  furnished,
  laundry,
  onToggle,
  onChangeFurnished,
  onChangeLaundry,
}: {
  petFriendly: YesNoUnknown;
  parking: YesNoUnknown;
  accessible: YesNoUnknown;
  furnished: FurnishedValue;
  laundry: LaundryValue;
  onToggle: (
    key: "petFriendly" | "parking" | "accessible",
    current: YesNoUnknown
  ) => void;
  onChangeFurnished: (v: FurnishedValue) => void;
  onChangeLaundry: (v: LaundryValue) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold">Any amenities you need?</h2>
      <p className="text-sm text-muted mt-1">
        We'll prioritize listings with these features
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <ToggleChip
          active={petFriendly === "yes"}
          onClick={() => onToggle("petFriendly", petFriendly)}
          icon={<PawIcon className="w-4 h-4" />}
          label="Pet friendly"
        />
        <ToggleChip
          active={parking === "yes"}
          onClick={() => onToggle("parking", parking)}
          icon={<ParkingIcon className="w-4 h-4" />}
          label="Parking"
        />
        <ToggleChip
          active={accessible === "yes"}
          onClick={() => onToggle("accessible", accessible)}
          icon={<AccessibleIcon className="w-4 h-4" />}
          label="Accessible"
        />
      </div>

      <div className="mt-6">
        <div className="text-xs text-muted mb-2">Furnished</div>
        <SegmentedRow
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
            { value: "either", label: "Either" },
          ]}
          value={furnished}
          onChange={(v) => onChangeFurnished(v as FurnishedValue)}
        />
      </div>

      <div className="mt-5">
        <div className="text-xs text-muted mb-2">Laundry</div>
        <SegmentedRow
          options={[
            { value: "in-unit", label: "In-Unit" },
            { value: "shared", label: "Shared" },
            { value: "either", label: "Either" },
          ]}
          value={laundry}
          onChange={(v) => onChangeLaundry(v as LaundryValue)}
        />
      </div>
    </div>
  );
}

function ToggleChip({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm transition-colors ${
        active
          ? "bg-mint-soft border-mint-deep text-ink font-medium"
          : "bg-white border-frame text-muted hover:border-mint-deep hover:text-ink"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SegmentedRow({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-2xl border px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-mint-soft border-mint-deep text-ink font-medium"
                : "bg-white border-frame text-muted hover:border-mint-deep hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// --- Inline icons (no library) ----------------------------------------------

type IconProps = { className?: string };

function HouseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

function CarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 16h14l-1.5-5.5A2 2 0 0 0 15.6 9H8.4a2 2 0 0 0-1.9 1.5L5 16Z" />
      <circle cx="8" cy="17" r="1.5" />
      <circle cx="16" cy="17" r="1.5" />
    </svg>
  );
}

function BedIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 18V8" />
      <path d="M3 14h18v4" />
      <path d="M21 18v-4a3 3 0 0 0-3-3H10v3" />
    </svg>
  );
}

function PeopleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="9" cy="9" r="3" />
      <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M15 20c0-2.5 1.5-4 4-4" />
    </svg>
  );
}

function PinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function HeartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />
    </svg>
  );
}

function PawIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="6" cy="10" r="1.5" />
      <circle cx="10" cy="6" r="1.5" />
      <circle cx="14" cy="6" r="1.5" />
      <circle cx="18" cy="10" r="1.5" />
      <path d="M8 17a4 4 0 0 1 8 0 2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2Z" />
    </svg>
  );
}

function ParkingIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M10 17V7h3a2.5 2.5 0 0 1 0 5h-3" />
    </svg>
  );
}

function AccessibleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="10" cy="5" r="1.5" />
      <path d="M10 8v5h5l2 5" />
      <circle cx="11" cy="17" r="4" />
    </svg>
  );
}
