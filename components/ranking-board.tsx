"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/avatar";
import { formatRate, fullNumber } from "@/lib/format";
import type { MemberStat } from "@/lib/types";

type Metric = "messages" | "favorites" | "rate" | "reactions";
const metrics: Array<{ id: Metric; label: string }> = [{ id: "messages", label: "Messages" }, { id: "favorites", label: "Favorites" }, { id: "rate", label: "Favs / message" }, { id: "reactions", label: "Reactions" }];

export function RankingBoard({ members }: { members: MemberStat[] }) {
  const [metric, setMetric] = useState<Metric>("messages");
  const sorted = useMemo(() => [...members].sort((a, b) => {
    if (metric === "rate") return (b.favoriteRate ?? -1) - (a.favoriteRate ?? -1);
    if (metric === "reactions") return Object.values(b.reactions).reduce((x,y)=>x+y,0) - Object.values(a.reactions).reduce((x,y)=>x+y,0);
    return b[metric] - a[metric];
  }), [members, metric]);
  const getValue = (member: MemberStat) => metric === "rate" ? formatRate(member.favoriteRate) : fullNumber(metric === "reactions" ? Object.values(member.reactions).reduce((x,y)=>x+y,0) : member[metric]);
  const unit = metric === "messages" ? "messages" : metric === "favorites" ? "favorites" : metric === "rate" ? "average" : "reactions";
  return <><div className="segmented" role="tablist" aria-label="Ranking metric">{metrics.map((item) => <button className={metric === item.id ? "segment-button active" : "segment-button"} key={item.id} onClick={() => setMetric(item.id)} role="tab" aria-selected={metric === item.id}>{item.label}</button>)}</div><div className="ranking-list">{sorted.map((member, index) => <article className="ranking-row card" key={member.id}><span className="rank-number">{index + 1}</span><Avatar name={member.name} initials={member.initials} color={member.color} /><span className="ranking-name"><strong>{member.name}</strong><small>{index === 0 ? "Currently leading" : `Ranked #${index + 1}`}</small></span><span className="ranking-value"><strong>{getValue(member)}</strong><small>{unit}</small></span></article>)}</div></>;
}
