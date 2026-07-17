import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { PeriodPicker } from "@/components/period-picker";
import { getDashboardData } from "@/lib/dashboard-data";
import { compactNumber, formatRate } from "@/lib/format";
import { getViewer } from "@/lib/auth";

export const metadata = { title: "People" };

export default async function People({ searchParams }: { searchParams: Promise<{ period?: string; from?: string; to?: string }> }) {
  const viewer = await getViewer();
  const { period, from, to } = await searchParams;
  const data = await getDashboardData(viewer, period, from, to);
  return <div className="page-wrap"><header className="page-header"><div><span className="eyebrow">The cast</span><h1>People</h1><p>Every personality behind the numbers.</p></div><Suspense><PeriodPicker years={data.availableYears}/></Suspense></header><div className="people-grid">{data.members.map((member) => <Link className="person-card card" href={`/people/${member.id}`} key={member.id}><Avatar name={member.name} initials={member.initials} color={member.color} size="lg"/><h3>{member.name}</h3><small>#{member.rank} in messages</small><div className="person-card-stats"><span><strong>{compactNumber(member.messages)}</strong>messages</span><span><strong>{compactNumber(member.favorites)}</strong>favorites</span><span><strong>{formatRate(member.favoriteRate)}</strong>avg.</span></div></Link>)}</div></div>;
}
