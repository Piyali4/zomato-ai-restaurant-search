"use client";

import type { Recommendation, RecommendResponse } from "@/lib/types";

interface Props {
  data: RecommendResponse | null;
  loading: boolean;
  error: string | null;
}

export default function Results({ data, loading, error }: Props) {
  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div className="mt-12 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
        <p className="font-bold">Something went wrong</p>
        <p className="mt-1 text-sm opacity-90">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  if (data.recommendations.length === 0) {
    return (
      <div className="mt-12 rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand-strong)]">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
        </div>
        <h3 className="text-lg font-bold">No matches found</h3>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {data.summary || "Try lowering the rating or removing a filter."}
        </p>
      </div>
    );
  }

  return (
    <section className="mt-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand-strong)]">
            Top picks
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {data.recommendations.length} recommendations for you
          </h2>
          {data.summary ? (
            <p className="mt-1 max-w-2xl text-sm text-[var(--color-muted)]">{data.summary}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>
            {data.total_matches.toLocaleString()} match{data.total_matches === 1 ? "" : "es"} in dataset
          </Badge>
          <Badge tone={data.used_llm ? "brand" : "muted"}>
            {data.used_llm ? "Ranked by LLM" : "Deterministic ranking"}
          </Badge>
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {data.recommendations.map((r, i) => (
          <Card key={r.id} rec={r} delay={i * 70} />
        ))}
      </div>
    </section>
  );
}

function Card({ rec, delay }: { rec: Recommendation; delay: number }) {
  return (
    <article
      className="group relative animate-fade-in-up overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-rose-500/10"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand)] text-xs font-extrabold text-white shadow-md shadow-rose-500/30">
        #{rec.rank}
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-brand)] to-orange-400 text-lg font-extrabold text-white">
          {initials(rec.hotel_name)}
        </div>
        <div className="min-w-0">
          <h3 className="truncate pr-10 text-base font-bold leading-snug">{rec.hotel_name}</h3>
          <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">{rec.address}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <RatingPill rating={rec.rating} />
        <Badge tone="muted">{rec.area}</Badge>
        <Badge tone="muted">~₹{rec.budget_for_two} for two</Badge>
        <Badge tone={rec.budget_type === "low" ? "good" : rec.budget_type === "high" ? "warn" : "muted"}>
          {rec.budget_type}
        </Badge>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {rec.restaurant_type.map((c) => (
          <span
            key={c}
            className="rounded-full bg-[var(--color-brand-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-brand-strong)]"
          >
            {c}
          </span>
        ))}
      </div>

      <p className="mt-4 border-t border-dashed border-[var(--color-border)] pt-4 text-sm leading-relaxed text-[var(--color-foreground)]">
        <span className="mr-1.5 align-middle text-base">✨</span>
        {rec.explanation}
      </p>
    </article>
  );
}

function RatingPill({ rating }: { rating: number }) {
  const tone =
    rating >= 4.5 ? "bg-emerald-500" : rating >= 4.0 ? "bg-emerald-600/90" : rating >= 3.5 ? "bg-amber-500" : "bg-zinc-500";
  return (
    <span className={`inline-flex items-center gap-1 rounded-md ${tone} px-2 py-1 text-xs font-bold text-white`}>
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
      {rating.toFixed(1)}
    </span>
  );
}

function Badge({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "brand" | "good" | "warn";
}) {
  const cls =
    tone === "brand"
      ? "bg-[var(--color-brand-soft)] text-[var(--color-brand-strong)]"
      : tone === "good"
        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
        : tone === "warn"
          ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
          : "bg-black/[.05] text-[var(--color-foreground)] dark:bg-white/[.06]";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${cls}`}>
      {children}
    </span>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function LoadingState() {
  return (
    <section className="mt-14">
      <div className="h-6 w-48 skeleton rounded-md" />
      <div className="mt-3 h-4 w-72 skeleton rounded-md" />
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 skeleton rounded-2xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 skeleton rounded" />
                <div className="h-3 w-1/2 skeleton rounded" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <div className="h-6 w-16 skeleton rounded-full" />
              <div className="h-6 w-20 skeleton rounded-full" />
              <div className="h-6 w-14 skeleton rounded-full" />
            </div>
            <div className="mt-4 h-16 skeleton rounded-xl" />
          </div>
        ))}
      </div>
    </section>
  );
}
