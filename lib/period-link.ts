export interface PeriodSelection {
  period?: string | null;
  from?: string | null;
  to?: string | null;
}

export function withPeriodSelection(href: string, selection: PeriodSelection): string {
  const [path, query = ""] = href.split("?", 2);
  const params = new URLSearchParams(query);

  if (selection.period) params.set("period", selection.period);
  if (selection.period === "custom" && selection.from && selection.to) {
    params.set("from", selection.from);
    params.set("to", selection.to);
  } else {
    params.delete("from");
    params.delete("to");
  }

  const nextQuery = params.toString();
  return nextQuery ? `${path}?${nextQuery}` : path;
}
