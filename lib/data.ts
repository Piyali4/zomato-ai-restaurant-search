import fs from "node:fs";
import path from "node:path";
import type { BudgetType, Restaurant, UserPreferences } from "./types";

let cache: Restaurant[] | null = null;

function normalize(raw: unknown, idx: number): Restaurant | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const ratingNum =
    typeof r.rating === "number"
      ? r.rating
      : typeof r.rating === "string"
        ? parseFloat(r.rating)
        : NaN;
  if (!Number.isFinite(ratingNum)) return null;

  const types = Array.isArray(r.restaurant_type)
    ? (r.restaurant_type as unknown[]).filter((t): t is string => typeof t === "string")
    : [];

  const budgetType = (typeof r.budget_type === "string" ? r.budget_type : "medium") as BudgetType;

  return {
    id: `r${idx}`,
    hotel_name: String(r.hotel_name ?? "Unknown"),
    rating: Math.round(ratingNum * 10) / 10,
    address: String(r.address ?? ""),
    area: String(r.area ?? ""),
    restaurant_type: types,
    budget_for_two: typeof r.budget_for_two === "number" ? r.budget_for_two : 0,
    budget_type: ["low", "medium", "high"].includes(budgetType) ? budgetType : "medium",
  };
}

export function loadRestaurants(): Restaurant[] {
  if (cache) return cache;
  const file = path.join(process.cwd(), "data", "kolkata_hotels.json");
  const buf = fs.readFileSync(file, "utf-8");
  const parsed = JSON.parse(buf) as unknown[];
  const list: Restaurant[] = [];
  parsed.forEach((row, idx) => {
    const r = normalize(row, idx);
    if (r) list.push(r);
  });
  cache = list;
  return list;
}

export function listAreas(): string[] {
  return Array.from(new Set(loadRestaurants().map((r) => r.area))).sort();
}

export function listCuisines(): string[] {
  const set = new Set<string>();
  for (const r of loadRestaurants()) for (const c of r.restaurant_type) set.add(c);
  return Array.from(set).sort();
}

export interface FilterStats {
  totalDataset: number;
  matched: number;
}

export function filterRestaurants(prefs: UserPreferences): {
  matches: Restaurant[];
  stats: FilterStats;
} {
  const all = loadRestaurants();
  const minRating = typeof prefs.minRating === "number" ? prefs.minRating : 0;
  const wantedCuisines = (prefs.cuisines ?? []).map((c) => c.toLowerCase());
  const area = prefs.area?.trim().toLowerCase();
  const budget = prefs.budget;

  const matches = all.filter((r) => {
    if (area && r.area.toLowerCase() !== area) return false;
    if (budget && r.budget_type !== budget) return false;
    if (r.rating < minRating) return false;
    if (wantedCuisines.length > 0) {
      const has = r.restaurant_type.some((c) => wantedCuisines.includes(c.toLowerCase()));
      if (!has) return false;
    }
    return true;
  });

  // Composite ranking score: rating dominates, with small bonus for cuisine overlap.
  matches.sort((a, b) => {
    const overlap = (r: Restaurant) =>
      wantedCuisines.length === 0
        ? 0
        : r.restaurant_type.filter((c) => wantedCuisines.includes(c.toLowerCase())).length;
    const scoreA = a.rating + overlap(a) * 0.05;
    const scoreB = b.rating + overlap(b) * 0.05;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return a.budget_for_two - b.budget_for_two;
  });

  return { matches, stats: { totalDataset: all.length, matched: matches.length } };
}

export function templateExplanation(r: Restaurant, prefs: UserPreferences): string {
  const bits: string[] = [];
  if (prefs.area && r.area.toLowerCase() === prefs.area.toLowerCase()) {
    bits.push(`right in ${r.area}`);
  }
  const overlap = (prefs.cuisines ?? []).filter((c) =>
    r.restaurant_type.map((x) => x.toLowerCase()).includes(c.toLowerCase()),
  );
  if (overlap.length) bits.push(`serves ${overlap.join(" & ")}`);
  if (r.rating >= 4.5) bits.push(`top-rated at ${r.rating}/5`);
  else if (r.rating >= 4.0) bits.push(`well-reviewed at ${r.rating}/5`);
  if (r.budget_type === "low") bits.push(`easy on the wallet (~₹${r.budget_for_two} for two)`);
  else if (r.budget_type === "medium") bits.push(`mid-range pricing (~₹${r.budget_for_two} for two)`);
  else bits.push(`a more premium choice (~₹${r.budget_for_two} for two)`);

  const lead = `${r.hotel_name} is a strong pick — `;
  return lead + bits.join(", ") + ".";
}
