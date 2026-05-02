"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BudgetType, RecommendResponse, UserPreferences } from "@/lib/types";
import FilterForm from "./FilterForm";
import Results from "./Results";

interface Props {
  areas: string[];
  cuisines: string[];
  totalRestaurants: number;
}

export default function RecommendApp({ areas, cuisines, totalRestaurants }: Props) {
  const [prefs, setPrefs] = useState<UserPreferences>({
    area: "",
    budget: undefined,
    cuisines: [],
    minRating: 3.5,
    notes: "",
    topK: 5,
  });
  const [data, setData] = useState<RecommendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (data && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [data]);

  async function submit(p: UserPreferences) {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const body: Record<string, unknown> = { ...p };
      if (!body.area) delete body.area;
      if (!body.budget) delete body.budget;
      if (!body.notes) delete body.notes;
      if (Array.isArray(body.cuisines) && (body.cuisines as string[]).length === 0) {
        delete body.cuisines;
      }
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong");
      setData(json as RecommendResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(
    () => [
      { label: "Restaurants indexed", value: totalRestaurants.toLocaleString() },
      { label: "Neighbourhoods", value: areas.length },
      { label: "Cuisines", value: cuisines.length },
    ],
    [areas.length, cuisines.length, totalRestaurants],
  );

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-8 md:px-8">
        <Hero stats={stats} />

        <section className="mt-8 grid gap-8 md:mt-12 lg:grid-cols-[1.1fr_1fr]">
          <FilterForm
            areas={areas}
            cuisines={cuisines}
            prefs={prefs}
            onChange={setPrefs}
            onSubmit={() => submit(prefs)}
            loading={loading}
          />
          <SidePanel />
        </section>

        <div ref={resultsRef} className="scroll-mt-24">
          <Results data={data} loading={loading} error={error} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] glass">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-brand)] text-white shadow-md shadow-rose-500/20">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11l1.5-7h15L21 11" />
              <path d="M3 11h18v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
              <path d="M9 11v3a3 3 0 0 0 6 0v-3" />
            </svg>
          </div>
          <div className="leading-tight">
            <p className="text-base font-bold tracking-tight">Zomato AI</p>
            <p className="text-xs text-[var(--color-muted)]">Smart picks for Kolkata</p>
          </div>
        </div>
        <a
          href="#filters"
          className="hidden rounded-full bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-rose-500/20 transition hover:bg-[var(--color-brand-strong)] sm:inline-flex"
        >
          Find restaurants
        </a>
      </div>
    </header>
  );
}

function Hero({ stats }: { stats: { label: string; value: string | number }[] }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-brand)] to-[#ff7a59] p-7 text-white shadow-2xl shadow-rose-500/20 md:p-12">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
      <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-orange-300/30 blur-3xl" />
      <div className="relative">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          AI-powered · Kolkata
        </span>
        <h1 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
          Find your next favourite restaurant — picked by AI, not by guesswork.
        </h1>
        <p className="mt-4 max-w-xl text-base/relaxed text-white/90 md:text-lg">
          Tell us your area, budget, cuisine, and minimum rating. We&apos;ll filter thousands of
          Kolkata restaurants and have an LLM rank the best matches with a short reason for each pick.
        </p>
        <div className="mt-8 grid grid-cols-3 gap-3 md:max-w-md">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur transition hover:bg-white/25"
            >
              <div className="text-2xl font-extrabold">{s.value}</div>
              <div className="text-[11px] uppercase tracking-wider text-white/80">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SidePanel() {
  return (
    <aside className="space-y-4">
      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
        <h3 className="text-base font-bold">How it works</h3>
        <ol className="mt-4 space-y-3 text-sm">
          {[
            "Pick your area, budget band, and cuisines.",
            "We filter the dataset down to top candidates.",
            "An LLM ranks the best matches with explanations.",
          ].map((line, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-xs font-bold text-[var(--color-brand-strong)]">
                {i + 1}
              </span>
              <span className="text-[var(--color-muted)]">{line}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)]/60 p-6 text-sm">
        <h3 className="font-bold">Tip</h3>
        <p className="mt-2 text-[var(--color-muted)]">
          Add free-text preferences like <em>&quot;family-friendly&quot;</em> or{" "}
          <em>&quot;quick service&quot;</em> — the LLM will use them when ranking.
        </p>
      </div>
    </aside>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] py-6 text-center text-xs text-[var(--color-muted)]">
      Built with Next.js · Data: kolkata_hotels.json · Inspired by the Zomato use case
    </footer>
  );
}

export type { BudgetType };
