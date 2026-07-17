import type { RawGroupMeMessage, SanitizedEvent, SanitizedMessage } from "@/lib/import/types";

const ALLOWED_EVENTS = new Set(["group.name_change", "group.topic_change", "group.avatar_change", "group.theme_change", "group.like_icon_set", "membership.nickname_changed", "membership.announce.added", "membership.announce.rejoined", "membership.notifications.exited", "membership.notifications.removed"]);

function timestamp(value: unknown): string | null {
  if (typeof value === "number") {
    const date = new Date(value < 10_000_000_000 ? value * 1000 : value);
    return Number.isNaN(date.valueOf()) ? null : date.toISOString();
  }
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? null : date.toISOString();
  }
  return null;
}

function listCount(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  return 0;
}

export function reactionCounts(value: unknown): Record<string, number> {
  if (!value) return {};
  if (!Array.isArray(value) && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).flatMap(([key, count]) => typeof count === "number" && count > 0 ? [[key, count]] : []));
  }
  if (!Array.isArray(value)) return {};
  return value.reduce<Record<string, number>>((counts, raw) => {
    if (!raw || typeof raw !== "object") return counts;
    const item = raw as Record<string, unknown>;
    const label = String(item.code ?? item.emoji ?? item.type ?? "Reaction").slice(0, 32);
    const count = Array.isArray(item.user_ids) ? item.user_ids.length : Array.isArray(item.users) ? item.users.length : typeof item.count === "number" ? item.count : 1;
    if (count > 0) counts[label] = (counts[label] ?? 0) + count;
    return counts;
  }, {});
}

function eventData(event: unknown): Record<string, unknown> | null {
  if (!event || typeof event !== "object" || Array.isArray(event)) return null;
  return event as Record<string, unknown>;
}

export function sanitizeRecord(raw: RawGroupMeMessage): { message?: SanitizedMessage; event?: SanitizedEvent; member?: { id: string; name: string }; warning?: string } {
  const id = raw.id === undefined || raw.id === null ? "" : String(raw.id);
  const userId = raw.user_id === undefined || raw.user_id === null ? "" : String(raw.user_id);
  const occurredAt = timestamp(raw.created_at);
  if (!id || !userId || !occurredAt) return { warning: "Skipped a record missing a valid id, user_id, or created_at." };
  const event = eventData(raw.event);
  if (event && typeof event.type === "string" && ALLOWED_EVENTS.has(event.type)) {
    const data = eventData(event.data) ?? {};
    const actor = eventData(data.user);
    const display = event.type === "group.name_change" ? data.name : event.type === "group.topic_change" ? data.topic : actor?.nickname;
    return { event: { source_event_id: id, event_type: event.type, occurred_at: occurredAt, actor_source_user_id: actor?.id === undefined ? null : String(actor.id), display_value: typeof display === "string" ? display.slice(0, 500) : null } };
  }
  if (userId === "system" || userId === "calendar") return {};
  const name = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim().slice(0, 120) : "Unknown member";
  return {
    member: { id: userId, name },
    message: { source_message_id: id, source_user_id: userId, occurred_at: occurredAt, favorite_count: listCount(raw.favorited_by), reaction_counts: reactionCounts(raw.reactions) },
  };
}
