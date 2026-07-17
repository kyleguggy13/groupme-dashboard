"use client";

import { CalendarDays, ChevronDown, LoaderCircle } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export function PeriodPicker({ years }: { years: number[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get("period") ?? "latest";
  const [from, setFrom] = useState(searchParams.get("from") ?? `${years[0] ?? new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(searchParams.get("to") ?? `${years[0] ?? new Date().getFullYear()}-12-31`);
  const [customRequested, setCustomRequested] = useState(false);
  const [isPending, startTransition] = useTransition();

  function navigate(next: URLSearchParams) {
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  return (
    <div className="period-control" aria-busy={isPending}>
      <label className="period-picker">
        {isPending ? <LoaderCircle className="period-spinner" size={17} aria-hidden="true" /> : <CalendarDays size={17} aria-hidden="true" />}
        <span className="sr-only">Recap period</span>
        <select
          key={value}
          defaultValue={value}
          disabled={isPending}
          onChange={(event) => {
            const period = event.target.value;
            if (period === "custom") {
              setCustomRequested(true);
              return;
            }
            setCustomRequested(false);
            const next = new URLSearchParams(searchParams.toString());
            next.set("period", period);
            next.delete("from");
            next.delete("to");
            navigate(next);
          }}
        >
          <option value="latest">Latest year</option>
          {years.map((year) => <option key={year} value={year}>{year}</option>)}
          <option value="all">All time</option>
          <option value="custom">Custom dates</option>
        </select>
        <ChevronDown size={15} aria-hidden="true" />
      </label>

      {(value === "custom" || customRequested) && (
        <div className="custom-dates">
          <label>From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
          <label>To<input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} /></label>
          <button
            disabled={isPending}
            onClick={() => {
              setCustomRequested(false);
              const next = new URLSearchParams(searchParams.toString());
              next.set("period", "custom");
              next.set("from", from);
              next.set("to", to);
              navigate(next);
            }}
          >
            {isPending ? "Loading..." : "Apply"}
          </button>
        </div>
      )}

      {isPending && <span className="sr-only" role="status">Loading the selected date range</span>}
    </div>
  );
}
