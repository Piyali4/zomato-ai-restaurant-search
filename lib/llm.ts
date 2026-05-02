import OpenAI from "openai";
import type { Recommendation, Restaurant, UserPreferences } from "./types";
import { templateExplanation } from "./data";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export interface LLMResult {
  used_llm: boolean;
  recommendations: Recommendation[];
  summary?: string;
}

function deterministicResult(
  candidates: Restaurant[],
  prefs: UserPreferences,
  topK: number,
): LLMResult {
  const recs: Recommendation[] = candidates.slice(0, topK).map((r, i) => ({
    id: r.id,
    rank: i + 1,
    hotel_name: r.hotel_name,
    area: r.area,
    address: r.address,
    rating: r.rating,
    budget_for_two: r.budget_for_two,
    budget_type: r.budget_type,
    restaurant_type: r.restaurant_type,
    explanation: templateExplanation(r, prefs),
  }));
  const summary = recs.length
    ? `Here ${recs.length === 1 ? "is" : "are"} the top ${recs.length} ${
        recs.length === 1 ? "match" : "matches"
      }${prefs.area ? ` in ${prefs.area}` : ""}, ranked by rating and your filters.`
    : undefined;
  return { used_llm: false, recommendations: recs, summary };
}

interface LLMRanking {
  rankings: Array<{ restaurant_id: string; rank: number; explanation: string }>;
  summary?: string;
}

export async function rankWithLLM(
  candidates: Restaurant[],
  prefs: UserPreferences,
  topK: number,
): Promise<LLMResult> {
  if (candidates.length === 0) return { used_llm: false, recommendations: [] };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return deterministicResult(candidates, prefs, topK);

  const slim = candidates.slice(0, 25).map((r) => ({
    id: r.id,
    name: r.hotel_name,
    area: r.area,
    cuisines: r.restaurant_type,
    rating: r.rating,
    budget_for_two: r.budget_for_two,
    budget_type: r.budget_type,
  }));

  const system = [
    "You are a helpful restaurant recommendation assistant for Kolkata.",
    "You will be given a list of candidate restaurants and a user's preferences.",
    "Pick the top recommendations ONLY from the candidate list.",
    "For each pick, give a short, warm, human explanation (1-2 sentences) describing why it fits the user's preferences.",
    "Reference concrete details from the candidate (cuisine, rating, area, price). Do not invent facts.",
    "Respond with strict JSON matching the requested schema.",
  ].join(" ");

  const user = JSON.stringify({
    user_preferences: prefs,
    top_k: topK,
    candidates: slim,
    output_schema: {
      rankings: [{ restaurant_id: "string (must match a candidate id)", rank: "number 1..K", explanation: "string" }],
      summary: "1-2 sentence overall summary (optional)",
    },
  });

  try {
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
      max_tokens: 900,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as LLMRanking;
    if (!Array.isArray(parsed.rankings) || parsed.rankings.length === 0) {
      return deterministicResult(candidates, prefs, topK);
    }

    const byId = new Map(candidates.map((c) => [c.id, c]));
    const recs: Recommendation[] = [];
    for (const item of parsed.rankings) {
      const r = byId.get(item.restaurant_id);
      if (!r) continue;
      recs.push({
        id: r.id,
        rank: item.rank,
        hotel_name: r.hotel_name,
        area: r.area,
        address: r.address,
        rating: r.rating,
        budget_for_two: r.budget_for_two,
        budget_type: r.budget_type,
        restaurant_type: r.restaurant_type,
        explanation: item.explanation || templateExplanation(r, prefs),
      });
    }
    recs.sort((a, b) => a.rank - b.rank);
    const trimmed = recs.slice(0, topK);
    if (trimmed.length === 0) return deterministicResult(candidates, prefs, topK);

    return { used_llm: true, recommendations: trimmed, summary: parsed.summary };
  } catch (err) {
    console.error("[llm] falling back due to error:", err);
    return deterministicResult(candidates, prefs, topK);
  }
}
