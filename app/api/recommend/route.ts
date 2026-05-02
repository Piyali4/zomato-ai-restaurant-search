import { NextResponse } from "next/server";
import { filterRestaurants } from "@/lib/data";
import { rankWithLLM } from "@/lib/llm";
import type { BudgetType, RecommendResponse, UserPreferences } from "@/lib/types";

export const runtime = "nodejs";

const VALID_BUDGETS: BudgetType[] = ["low", "medium", "high"];

function parseBody(body: unknown): { ok: true; prefs: UserPreferences } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid JSON body" };
  const b = body as Record<string, unknown>;

  const prefs: UserPreferences = {};
  if (typeof b.area === "string" && b.area.trim()) prefs.area = b.area.trim();
  if (typeof b.budget === "string") {
    if (!VALID_BUDGETS.includes(b.budget as BudgetType)) return { ok: false, error: "budget must be low/medium/high" };
    prefs.budget = b.budget as BudgetType;
  }
  if (Array.isArray(b.cuisines)) {
    prefs.cuisines = b.cuisines.filter((c): c is string => typeof c === "string");
  }
  if (b.minRating !== undefined && b.minRating !== null && b.minRating !== "") {
    const n = Number(b.minRating);
    if (!Number.isFinite(n) || n < 0 || n > 5) return { ok: false, error: "minRating must be between 0 and 5" };
    prefs.minRating = n;
  }
  if (typeof b.notes === "string") prefs.notes = b.notes.slice(0, 500);
  if (b.topK !== undefined) {
    const k = Number(b.topK);
    if (!Number.isFinite(k) || k < 1 || k > 10) return { ok: false, error: "topK must be 1..10" };
    prefs.topK = k;
  }
  return { ok: true, prefs };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseBody(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { prefs } = parsed;
  const topK = prefs.topK ?? 5;
  const { matches, stats } = filterRestaurants(prefs);

  if (matches.length === 0) {
    const resp: RecommendResponse = {
      total_matches: 0,
      used_llm: false,
      recommendations: [],
      summary: "No restaurants matched your filters. Try relaxing the rating or budget.",
      filters_used: prefs,
    };
    return NextResponse.json(resp);
  }

  const result = await rankWithLLM(matches.slice(0, 25), prefs, topK);

  const resp: RecommendResponse = {
    total_matches: stats.matched,
    used_llm: result.used_llm,
    recommendations: result.recommendations,
    summary: result.summary,
    filters_used: prefs,
  };
  return NextResponse.json(resp);
}
