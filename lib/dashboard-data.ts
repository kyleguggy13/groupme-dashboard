import { demoData } from "@/lib/demo-data";
import { resolvePeriod } from "@/lib/period";
import { isDemoMode } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { DashboardData, GroupHistoryEvent, RankingDto, Viewer } from "@/lib/types";

type DashboardDataScope = "full" | "rankings" | "timeline" | "member";

export async function getDashboardData(
  viewer: Viewer,
  period?: string,
  customFrom?: string,
  customTo?: string,
  timelineMemberId?: string,
  scope: DashboardDataScope = "full",
): Promise<DashboardData> {
  if (isDemoMode) {
    const window = resolvePeriod(period, demoData.availableYears, customFrom, customTo);
    if (!timelineMemberId) return { ...demoData, activePeriodLabel: window.label };
    const member=demoData.members.find((item)=>item.id===timelineMemberId); const ratio=(member?.messages??0)/Math.max(demoData.summary.messages,1);
    return { ...demoData, activePeriodLabel: window.label, trend: demoData.trend.map((point)=>({...point,messages:Math.round(point.messages*ratio),favorites:Math.round(point.favorites*ratio)})) };
  }
  const supabase = await createClient();
  const { data: yearsRaw, error: yearsError } = await supabase.rpc("get_available_years", { p_group_id: viewer.groupId });
  if (yearsError) throw new Error(yearsError.message);
  const years = ((yearsRaw ?? []) as Array<{ year: number }>).map((row) => Number(row.year)).sort((a, b) => b - a);
  const window = resolvePeriod(period, years, customFrom, customTo);
  const args = { p_group_id: viewer.groupId, p_from: window.from, p_to: window.to };
  const needsSummary = scope === "full";
  const needsTrend = scope === "full" || scope === "timeline" || scope === "member";
  const needsHistory = scope === "full" || scope === "timeline";
  const [summaryResult, rankingsResult, trendResult, historyResult] = await Promise.all([
    needsSummary ? supabase.rpc("get_recap_summary", args) : Promise.resolve({ data: null, error: null }),
    supabase.rpc("get_rankings", args),
    needsTrend
      ? supabase.rpc("get_timeline", { ...args, p_bucket: "month", p_member_ids: timelineMemberId ? [timelineMemberId] : null })
      : Promise.resolve({ data: null, error: null }),
    needsHistory ? supabase.rpc("get_group_history", args) : Promise.resolve({ data: null, error: null }),
  ]);
  const results = [
    ["get_recap_summary", summaryResult],
    ["get_rankings", rankingsResult],
    ["get_timeline", trendResult],
    ["get_group_history", historyResult],
  ] as const;
  const failed = results.find(([, result]) => result.error);
  if (failed?.[1].error) {
    const [rpc, result] = failed;
    console.error("Dashboard RPC failed", {
      rpc,
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });
    throw new Error(`${rpc} failed: ${result.error.message}`);
  }
  const summary = Array.isArray(summaryResult.data) ? summaryResult.data[0] : summaryResult.data;
  const rankings = (rankingsResult.data ?? []) as RankingDto[];
  const reactionTotals = rankings.reduce<Record<string, number>>((totals, row) => {
    Object.entries(row.reaction_counts ?? {}).forEach(([key, count]) => { totals[key] = (totals[key] ?? 0) + Number(count); });
    return totals;
  }, {});
  const palette = ["#ff6b72", "#7868e6", "#ffad5b", "#51c9a5", "#56a4e8"];
  const members = rankings.map((row, index) => ({
    id: row.member_id,
    name: row.display_name,
    initials: row.display_name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
    color: ["violet", "coral", "mint", "blue", "yellow", "pink", "teal"][index % 7],
    messages: Number(row.message_count),
    favorites: Number(row.favorite_count),
    favoriteRate: row.favorite_rate === null ? null : Number(row.favorite_rate),
    rank: index + 1,
    reactions: row.reaction_counts ?? {},
  }));
  return {
    availableYears: years,
    activePeriodLabel: window.label,
    summary: {
      messages: Number(summary?.message_count ?? 0),
      favorites: Number(summary?.favorite_count ?? 0),
      members: Number(summary?.member_count ?? 0),
      activeDays: Number(summary?.active_days ?? 0),
      topReaction: summary?.top_reaction ?? "—",
    },
    members,
    trend: (trendResult.data ?? []).map((row: Record<string, unknown>) => ({ label: String(row.label), messages: Number(row.message_count), favorites: Number(row.favorite_count) })),
    history: (historyResult.data ?? []).map((row: Record<string, unknown>) => ({ id: String(row.event_id), date: String(row.occurred_at), type: String(row.event_type), title: String(row.display_value), actor: row.actor_name ? String(row.actor_name) : undefined })) as GroupHistoryEvent[],
    reactions: Object.entries(reactionTotals).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value], index) => ({ name, value, color: palette[index] })),
    lastImportedAt: String(summary?.last_imported_at ?? new Date().toISOString()),
  };
}
