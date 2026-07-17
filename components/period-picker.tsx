"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function PeriodPicker({ years }: { years: number[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get("period") ?? "latest";
  const [from, setFrom] = useState(searchParams.get("from") ?? `${years[0] ?? new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(searchParams.get("to") ?? `${years[0] ?? new Date().getFullYear()}-12-31`);

  return (
    <div className="period-control"><label className="period-picker">
      <CalendarDays size={17} aria-hidden="true" />
      <span className="sr-only">Recap period</span>
      <select
        value={value}
        onChange={(event) => {
          const next = new URLSearchParams(searchParams.toString());
          next.set("period", event.target.value);
          next.delete("from");
          next.delete("to");
          router.push(`${pathname}?${next.toString()}`);
        }}
      >
        <option value="latest">Latest year</option>
        {years.map((year) => <option key={year} value={year}>{year}</option>)}
        <option value="all">All time</option>
        <option value="custom">Custom dates</option>
      </select>
      <ChevronDown size={15} aria-hidden="true" />
    </label>{value === "custom" && <div className="custom-dates"><label>From<input type="date" value={from} onChange={(event)=>setFrom(event.target.value)}/></label><label>To<input type="date" value={to} min={from} onChange={(event)=>setTo(event.target.value)}/></label><button onClick={()=>{const next=new URLSearchParams(searchParams.toString());next.set("period","custom");next.set("from",from);next.set("to",to);router.push(`${pathname}?${next.toString()}`);}}>Apply</button></div>}</div>
  );
}
