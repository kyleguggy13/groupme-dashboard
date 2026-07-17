import { Suspense } from "react";
import { PeriodPicker } from "@/components/period-picker";
import { RankingBoard } from "@/components/ranking-board";
import { getDashboardData } from "@/lib/dashboard-data";
import { getViewer } from "@/lib/auth";

export const metadata = { title: "Rankings" };

export default async function Rankings({ searchParams }: { searchParams: Promise<{ period?: string; from?: string; to?: string }> }) {
  const viewer = await getViewer();
  const { period, from, to } = await searchParams;
  const data = await getDashboardData(viewer, period, from, to, undefined, "rankings");
  return <div className="page-wrap"><header className="page-header"><div><span className="eyebrow">Friendly competition</span><h1>Rankings</h1><p>Receipts for who carried the chat.</p></div><Suspense><PeriodPicker years={data.availableYears}/></Suspense></header><RankingBoard members={data.members}/></div>;
}
