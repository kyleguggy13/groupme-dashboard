import { describe, expect, it } from "vitest";
import { resolvePeriod } from "@/lib/period";

describe("resolvePeriod", () => {
  const years = [2026, 2025, 2024];
  it("defaults to the latest available year", () => expect(resolvePeriod(undefined, years).label).toBe("2026 recap"));
  it("supports all time", () => expect(resolvePeriod("all", years)).toEqual({ from: null, to: null, label: "All-time recap" }));
  it("accepts a valid custom range and rejects a reversed range", () => {
    expect(resolvePeriod("custom", years, "2025-02-01", "2025-03-01").label).toBe("Custom recap");
    expect(resolvePeriod("custom", years, "2025-04-01", "2025-03-01").label).toBe("2026 recap");
  });
});
