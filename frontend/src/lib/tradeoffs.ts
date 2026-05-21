import type { Listing } from "../types/listing";

// Summarize tradeoffs for a single listing relative to a small set of peers.
// Returns a short natural-language sentence like "Lower rent but longer bus commute".
export function summarizeTradeoff(listing: Listing, peers: Listing[]): string {
  if (!listing) return "Data unavailable";

  const others = peers.filter((p) => p.id !== listing.id);

  // Affordability: compare rent to peers when available
  let affordability: string | null = null;
  if (typeof listing.rent === "number" && others.length > 0) {
    const rents = others.map((o) => o.rent).filter((r) => typeof r === "number");
    if (rents.length > 0) {
      const avg = rents.reduce((a, b) => a + b, 0) / rents.length;
      if (listing.rent < avg * 0.95) affordability = "Lower rent";
      else if (listing.rent > avg * 1.05) affordability = "Higher rent";
      else affordability = "Similar rent";
    }
  }

  // Commute: use commuteMinutes and commuteMode
  let commute: string | null = null;
  if (typeof listing.commuteMinutes === "number") {
    if (others.length > 0) {
      const mins = others
        .map((o) => o.commuteMinutes)
        .filter((m) => typeof m === "number");
      if (mins.length > 0) {
        const avg = mins.reduce((a, b) => a + b, 0) / mins.length;
        if (listing.commuteMinutes < avg * 0.9) commute = "Shorter commute";
        else if (listing.commuteMinutes > avg * 1.1) commute = "Longer commute";
        else commute = "Similar commute";
      }
    } else {
      commute = `${listing.commuteMinutes} min commute`;
    }
    // add mode qualifier when helpful
    if (listing.commuteMode && listing.commuteMode !== "unknown") {
      const m = listing.commuteMode === "bike" ? "bike" : listing.commuteMode;
      commute = commute ? `${commute} by ${m}` : `Commute by ${m}`;
    }
  }

  // Safety
  let safety: string | null = null;
  if (typeof listing.safetyRating === "number") {
    if (listing.safetyRating >= 8) safety = `High safety (${listing.safetyRating}/10)`;
    else if (listing.safetyRating >= 6) safety = `Moderate safety (${listing.safetyRating}/10)`;
    else safety = `Lower safety (${listing.safetyRating}/10)`;
  } else if (listing.safetyRating === undefined) {
    safety = "Safety data unavailable";
  }

  // Roommates / room type
  let room: string | null = null;
  if (listing.roomType) {
    if (listing.roomType === "shared") room = "Shared room";
    else if (listing.roomType === "private" || listing.roomType === "entire") room = "Private/entire place";
  }

  // Amenities
  const amenityHints: string[] = [];
  if (listing.tags && listing.tags.length > 0) {
    // Choose up to two human-friendly tags
    amenityHints.push(...listing.tags.slice(0, 2));
  }

  // Build concise summary: prefer two-clause constructions
  const clauses: string[] = [];
  if (affordability) clauses.push(affordability);
  if (commute) clauses.push(commute);

  // If affordability+commute already present, append a short amenity or safety note
  if (clauses.length >= 2) {
    if (amenityHints.length > 0) clauses.push(amenityHints[0]);
    else if (safety) clauses.push(safety);
  } else {
    if (amenityHints.length > 0) clauses.push(amenityHints.join(", "));
    if (safety) clauses.push(safety);
    if (room) clauses.push(room);
  }

  // Filter unknown / null
  const out = clauses.filter(Boolean);
  if (out.length === 0) return "Data unavailable";
  // Join into a compact sentence with simple connectors
  // Prefer "X but Y" when there are two clauses
  if (out.length === 2) return `${out[0]} but ${out[1]}`;
  return out.join(" · ");
}

export default summarizeTradeoff;
