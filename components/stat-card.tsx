import type { LucideIcon } from "lucide-react";

export function StatCard({ label, value, note, icon: Icon, tone = "violet" }: { label: string; value: string; note?: string; icon: LucideIcon; tone?: string }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <span className="stat-icon"><Icon size={19} aria-hidden="true" /></span>
      <div><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>
    </article>
  );
}
