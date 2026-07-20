import { notFound } from "next/navigation";
import { Heart, MessageCircle, Sparkles, Trophy } from "lucide-react";
import { ActivityChart, ReactionDonut } from "@/components/charts";
import { Avatar } from "@/components/avatar";
import { StatCard } from "@/components/stat-card";
import { getDashboardData } from "@/lib/dashboard-data";
import { compactNumber, formatRate } from "@/lib/format";
import { getViewer } from "@/lib/auth";

export default async function MemberPage({ params, searchParams }: { params: Promise<{ memberId: string }>; searchParams: Promise<{ period?: string; from?: string; to?: string }> }) {
  const viewer = await getViewer();
  const { memberId } = await params;
  const { period, from, to } = await searchParams;
  const data = await getDashboardData(viewer, period, from, to, memberId, "member");
  const member = data.members.find((item) => item.id === memberId);
  if (!member) notFound();
  const colors=["#ff6b72","#7868e6","#ffad5b","#51c9a5"];
  const reactions=Object.entries(member.reactions).map(([name,value],index)=>({name,value,color:colors[index%colors.length]}));
  return <div className="page-wrap"><article className="profile-hero card"><Avatar name={member.name} initials={member.initials} color={member.color} size="xl"/><h1>{member.name}</h1><p>Member of {viewer.groupName}</p><span className="profile-badge">Top {Math.max(1, Math.round(member.rank / data.members.length * 100))}% chatter</span></article><section className="stats-grid"><StatCard label="Message rank" value={`#${member.rank}`} icon={Trophy} tone="yellow"/><StatCard label="Messages" value={compactNumber(member.messages)} icon={MessageCircle}/><StatCard label="Favorites" value={compactNumber(member.favorites)} icon={Heart} tone="coral"/><StatCard label="Favs / message" value={formatRate(member.favoriteRate)} icon={Sparkles} tone="mint"/></section><section className="section"><div className="section-heading"><div><span className="eyebrow">Their rhythm</span><h2>Activity over time</h2></div></div><div className="dashboard-grid"><ActivityChart data={data.trend} showFavorites={false}/><ReactionDonut data={reactions}/></div></section></div>;
}
