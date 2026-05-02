"use client";

import { FormEvent } from "react";
import type { BudgetType, UserPreferences } from "@/lib/types";

interface Props {
  areas: string[];
  cuisines: string[];
  prefs: UserPreferences;
  onChange: (next: UserPreferences) => void;
  onSubmit: () => void;
  loading: boolean;
}

const BUDGETS: { value: BudgetType; label: string; hint: string }[] = [
  { value: "low", label: "Low", hint: "Under ₹500" },
  { value: "medium", label: "Medium", hint: "₹500 – ₹1000" },
  { value: "high", label: "High", hint: "Above ₹1000" },
];

export default function FilterForm({
  areas,
  cuisines,
  prefs,
  onChange,
  onSubmit,
  loading,
}: Props) {
  function update<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    onChange({ ...prefs, [key]: value });
  }

  function toggleCuisine(c: string) {
    const list = new Set(prefs.cuisines ?? []);
    if (list.has(c)) list.delete(c);
    else list.add(c);
    update("cuisines", Array.from(list));
  }

  function reset() {
    onChange({
      area: "",
      budget: undefined,
      cuisines: [],
      minRating: 3.5,
      notes: "",
      topK: 5,
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <form
      id="filters"
      onSubmit={handleSubmit}
      className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-xl shadow-rose-500/5 md:p-8"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Tell us what you&apos;re craving</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Set your preferences — we&apos;ll do the rest.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="text-xs font-semibold text-[var(--color-muted)] underline-offset-4 hover:text-[var(--color-brand-strong)] hover:underline"
        >
          Reset
        </button>
      </div>

      <div className="mt-6 space-y-5">
        <Field label="Area / Neighbourhood">
          <select
            value={prefs.area ?? ""}
            onChange={(e) => update("area", e.target.value || undefined)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[var(--ring)] dark:bg-[#241715]"
          >
            <option value="">Anywhere in Kolkata</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Budget for two">
          <div className="grid grid-cols-3 gap-2">
            {BUDGETS.map((b) => {
              const active = prefs.budget === b.value;
              return (
                <button
                  type="button"
                  key={b.value}
                  onClick={() => update("budget", active ? undefined : b.value)}
                  className={`rounded-xl border px-3 py-3 text-left transition ${
                    active
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand-strong)] shadow-sm"
                      : "border-[var(--color-border)] hover:border-[var(--color-brand)]/60"
                  }`}
                >
                  <div className="text-sm font-bold">{b.label}</div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)]">
                    {b.hint}
                  </div>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Cuisines (pick any)">
          <div className="flex flex-wrap gap-2">
            {cuisines.map((c) => {
              const active = (prefs.cuisines ?? []).includes(c);
              return (
                <button
                  type="button"
                  key={c}
                  onClick={() => toggleCuisine(c)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white shadow-sm"
                      : "border-[var(--color-border)] bg-transparent text-[var(--color-foreground)] hover:border-[var(--color-brand)]/60 hover:bg-[var(--color-brand-soft)]"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </Field>

        <Field
          label={`Minimum rating · ${typeof prefs.minRating === "number" ? prefs.minRating.toFixed(1) : "0.0"}★`}
        >
          <input
            type="range"
            min={0}
            max={5}
            step={0.1}
            value={prefs.minRating ?? 0}
            onChange={(e) => update("minRating", Number(e.target.value))}
            className="w-full accent-[var(--color-brand)]"
          />
          <div className="mt-1 flex justify-between text-[11px] text-[var(--color-muted)]">
            <span>0.0</span>
            <span>2.5</span>
            <span>5.0</span>
          </div>
        </Field>

        <Field label="Anything else? (optional)">
          <textarea
            value={prefs.notes ?? ""}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="e.g. family-friendly, quick service, late-night, good for date night…"
            rows={3}
            className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[var(--ring)] dark:bg-[#241715]"
          />
        </Field>

        <Field label={`Number of recommendations · ${prefs.topK ?? 5}`}>
          <input
            type="range"
            min={3}
            max={10}
            step={1}
            value={prefs.topK ?? 5}
            onChange={(e) => update("topK", Number(e.target.value))}
            className="w-full accent-[var(--color-brand)]"
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-brand)] px-6 py-4 text-base font-bold text-white shadow-lg shadow-rose-500/30 transition hover:translate-y-[-1px] hover:bg-[var(--color-brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Spinner /> Finding the perfect picks…
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 21l-4.3-4.3" />
              <circle cx="11" cy="11" r="7" />
            </svg>
            Get recommendations
          </>
        )}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
    />
  );
}
