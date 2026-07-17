import { PencilLine } from "lucide-react";
import { friendlyDate } from "@/lib/format";
import type { GroupHistoryEvent } from "@/lib/types";

export function HistoryList({ events, limit }: { events: GroupHistoryEvent[]; limit?: number }) {
  return <div className="history-list">{events.slice(0, limit).map((event) => <article className="history-item card" key={event.id}><span className="history-icon"><PencilLine size={19}/></span><div><time dateTime={event.date}>{friendlyDate(event.date)}</time><strong>{event.title}</strong>{event.actor && <small>Changed by {event.actor}</small>}</div></article>)}</div>;
}
