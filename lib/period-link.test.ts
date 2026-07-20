import { describe, expect, it } from "vitest";
import { withPeriodSelection } from "@/lib/period-link";

describe("withPeriodSelection", () => {
  it("carries a selected year to another page", () => {
    expect(withPeriodSelection("/rankings", { period: "2025" })).toBe("/rankings?period=2025");
  });

  it("carries both dates for a custom period", () => {
    expect(withPeriodSelection("/timeline?member=42", {
      period: "custom",
      from: "2025-02-01",
      to: "2025-03-01",
    })).toBe("/timeline?member=42&period=custom&from=2025-02-01&to=2025-03-01");
  });

  it("does not carry custom dates for another period", () => {
    expect(withPeriodSelection("/people?from=old&to=old", {
      period: "all",
      from: "2025-02-01",
      to: "2025-03-01",
    })).toBe("/people?period=all");
  });
});
