"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { compactNumber, fullNumber } from "@/lib/format";
import type { MemberStat, TrendPoint } from "@/lib/types";

function TooltipBox({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><strong>{label}</strong>{payload.map((item) => <div key={item.name} style={{ color: item.color }}>{item.name}: {fullNumber(item.value)}</div>)}</div>;
}

export function ActivityChart({ data, showFavorites = true }: { data: TrendPoint[]; showFavorites?: boolean }) {
  return (
    <div className="chart-card card">
      <div className="chart-toolbar"><strong>Activity rhythm</strong><div className="legend"><span><i style={{ background: "#7868e6" }} />Messages</span>{showFavorites && <span><i style={{ background: "#ff6b72" }} />Favorites</span>}</div></div>
      <ResponsiveContainer width="100%" height={235} initialDimension={{ width: 250, height: 235 }}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs><linearGradient id="messageFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7868e6" stopOpacity={0.3}/><stop offset="95%" stopColor="#7868e6" stopOpacity={0}/></linearGradient></defs>
          <CartesianGrid stroke="rgba(23,24,47,.07)" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis axisLine={false} tickLine={false} tickFormatter={compactNumber} width={44} />
          <Tooltip content={<TooltipBox />} cursor={{ stroke: "#7868e6", strokeDasharray: "4 4" }} />
          <Area type="monotone" dataKey="messages" stroke="#7868e6" strokeWidth={3} fill="url(#messageFill)" activeDot={{ r: 5 }} />
          {showFavorites && <Area type="monotone" dataKey="favorites" stroke="#ff6b72" strokeWidth={2} fill="transparent" activeDot={{ r: 4 }} />}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MemberBarChart({ members, metric = "messages" }: { members: MemberStat[]; metric?: "messages" | "favorites" }) {
  const data = members.slice(0, 8).map((member) => ({ name: member.name.split(" ")[0], value: member[metric] }));
  const colors = ["#7868e6", "#ff6b72", "#51c9a5", "#56a4e8", "#f5c857", "#bd7de8", "#ff9b62", "#54b7ad"];
  return <div className="chart-card card"><div className="chart-toolbar"><strong>{metric === "messages" ? "Messages by member" : "Favorites received"}</strong></div><ResponsiveContainer width="100%" height={235} initialDimension={{ width: 250, height: 235 }}><BarChart data={data} margin={{ left: -15, right: 8 }}><CartesianGrid stroke="rgba(23,24,47,.07)" vertical={false}/><XAxis dataKey="name" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false} tickFormatter={compactNumber}/><Tooltip content={<TooltipBox />} cursor={{ fill: "rgba(120,104,230,.05)" }}/><Bar dataKey="value" radius={[9,9,3,3]}>{data.map((_, index) => <Cell key={index} fill={colors[index % colors.length]}/>)}</Bar></BarChart></ResponsiveContainer></div>;
}

export function ReactionDonut({ data }: { data: Array<{ name: string; value: number; color: string }> }) {
  return <div className="chart-card card"><div className="chart-toolbar"><strong>Reaction mix</strong></div><ResponsiveContainer width="100%" height={235} initialDimension={{ width: 250, height: 235 }}><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={57} outerRadius={91} paddingAngle={4} cornerRadius={6}>{data.map((item) => <Cell key={item.name} fill={item.color}/>)}</Pie><Tooltip content={<TooltipBox />}/></PieChart></ResponsiveContainer></div>;
}
