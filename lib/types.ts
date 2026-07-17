export type MemberRole = "owner" | "admin" | "member";

export type PeriodKey = "latest" | "all" | string;

export interface Viewer {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: MemberRole;
  sourceMemberId?: string | null;
  groupId: string;
  groupName: string;
  groupTimezone: string;
}

export interface MemberStat {
  id: string;
  name: string;
  initials: string;
  color: string;
  messages: number;
  favorites: number;
  favoriteRate: number | null;
  rank: number;
  change?: number;
  reactions: Record<string, number>;
}

export interface TrendPoint {
  label: string;
  messages: number;
  favorites: number;
  [memberId: string]: string | number;
}

export interface GroupHistoryEvent {
  id: string;
  date: string;
  type: string;
  title: string;
  actor?: string;
}

export interface DashboardData {
  availableYears: number[];
  activePeriodLabel: string;
  summary: {
    messages: number;
    favorites: number;
    members: number;
    activeDays: number;
    topReaction: string;
  };
  members: MemberStat[];
  trend: TrendPoint[];
  history: GroupHistoryEvent[];
  reactions: Array<{ name: string; value: number; color: string }>;
  lastImportedAt: string;
}

export interface RecapSummaryDto {
  message_count: number;
  favorite_count: number;
  member_count: number;
  active_days: number;
  top_reaction: string | null;
}

export interface RankingDto {
  member_id: string;
  display_name: string;
  message_count: number;
  favorite_count: number;
  favorite_rate: number | null;
  reaction_counts: Record<string, number>;
}
