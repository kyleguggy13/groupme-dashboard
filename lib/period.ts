export interface DateWindow { from: string | null; to: string | null; label: string; }

export function resolvePeriod(period: string | undefined, years: number[], customFrom?: string, customTo?: string): DateWindow {
  if (period === "all") return { from: null, to: null, label: "All-time recap" };
  if (period === "custom" && customFrom && customTo && !Number.isNaN(Date.parse(customFrom)) && !Number.isNaN(Date.parse(customTo)) && customFrom <= customTo) {
    return { from: `${customFrom}T00:00:00`, to: `${customTo}T23:59:59.999`, label: "Custom recap" };
  }
  const latest = years[0] ?? new Date().getFullYear();
  const parsed = Number(period);
  const year = Number.isInteger(parsed) && years.includes(parsed) ? parsed : latest;
  return { from: `${year}-01-01`, to: `${year}-12-31T23:59:59.999`, label: `${year} recap` };
}
