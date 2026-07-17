import { describe, expect, it } from "vitest";
import { reactionCounts, sanitizeRecord } from "@/lib/import/sanitize";

describe("sanitizeRecord", () => {
  it("keeps only aggregate message metadata", () => {
    const result = sanitizeRecord({ id: "999999999999999999", user_id: "123", name: "Zoë", created_at: "2026-01-02T03:04:05Z", favorited_by: ["a", "b"], reactions: [{ code: "❤️", user_ids: ["a", "b", "c"] }], text: "secret message", attachments: [{ url: "secret" }], avatar_url: "private" });
    expect(result.message).toEqual({ source_message_id: "999999999999999999", source_user_id: "123", occurred_at: "2026-01-02T03:04:05.000Z", favorite_count: 2, reaction_counts: { "❤️": 3 } });
    expect(JSON.stringify(result)).not.toMatch(/secret|attachments|avatar|favorited_by|user_ids/);
  });

  it("sanitizes allowlisted events with apostrophes and Unicode", () => {
    const result = sanitizeRecord({ id: "evt-1", user_id: "system", created_at: 1767225600, event: { type: "group.name_change", data: { user: { id: "42", nickname: "Nikolai" }, name: "Josh ❤️'s Era" } } });
    expect(result.event?.display_value).toBe("Josh ❤️'s Era");
    expect(result.event?.actor_source_user_id).toBe("42");
  });

  it("rejects invalid records and ignores system chatter", () => {
    expect(sanitizeRecord({ id: "1", user_id: "2" }).warning).toBeTruthy();
    expect(sanitizeRecord({ id: "1", user_id: "system", created_at: "2026-01-01" })).toEqual({});
  });
});

describe("reactionCounts", () => {
  it("handles object and array export shapes", () => {
    expect(reactionCounts({ love: 2, laugh: 0 })).toEqual({ love: 2 });
    expect(reactionCounts([{ type: "fire", users: [1, 2] }, { type: "fire", count: 3 }])).toEqual({ fire: 5 });
  });
});
