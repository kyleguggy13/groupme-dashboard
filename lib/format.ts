export function compactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: value >= 10000 ? 1 : 0 }).format(value);
}

export function fullNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatRate(value: number | null): string {
  return value === null ? "—" : value.toFixed(2);
}

export function friendlyDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}
