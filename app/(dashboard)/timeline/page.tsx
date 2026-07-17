import { Suspense } from "react";
import { ActivityChart, MemberBarChart, ReactionDonut } from "@/components/charts";
import { HistoryList } from "@/components/history-list";
import { MemberFilter } from "@/components/member-filter";
import { PeriodPicker } from "@/components/period-picker";
import { getDashboardData } from "@/lib/dashboard-data";
import { getViewer } from "@/lib/auth";

export const metadata = { title: "Timeline" };

export default async function Timeline({ searchParams }: { searchParams: Promise<{ period?: string; from?: string; to?: string; member?: string }> }) {
  const viewer = await getViewer();
  const { period, from, to, member } = await searchParams;
  const data = await getDashboardData(viewer, period, from, to, member, "timeline");
  return <div className="page-wrap"><header className="page-header"><div><span className="eyebrow">Through the years</span><h1>Timeline</h1><p>Every streak, spike, and questionable group name.</p></div><Suspense><PeriodPicker years={data.availableYears}/></Suspense></header><section className="section"><div className="section-heading"><div><span className="eyebrow">Activity filter</span><h2>The group pulse</h2></div><Suspense><MemberFilter members={data.members}/></Suspense></div><ActivityChart data={data.trend}/></section><section className="section dashboard-grid"><MemberBarChart members={data.members}/><ReactionDonut data={data.reactions}/></section><section className="section"><div className="section-heading"><div><span className="eyebrow">Group history</span><h2>The name-change archives</h2></div></div><HistoryList events={data.history}/></section></div>;
}
