import { expect, test } from "@playwright/test";

test("home recap is usable without horizontal overflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Hey, Alex/ })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await expect(page.locator(".recharts-surface").first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

test("admin import explains the privacy boundary", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByText("Private by design.")).toBeVisible();
  await expect(page.getByText(/Message bodies, attachments, and liker identities/)).toBeVisible();
});
