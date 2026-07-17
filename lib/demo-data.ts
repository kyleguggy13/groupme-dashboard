import type { DashboardData, MemberStat, Viewer } from "@/lib/types";

export const demoViewer: Viewer = {
  id: "demo-viewer",
  name: "Alex Morgan",
  email: "alex@example.com",
  role: "owner",
  sourceMemberId: "alex",
  groupId: "demo-group",
  groupName: "The Day Ones",
  groupTimezone: "America/New_York",
};

const members: MemberStat[] = [
  { id: "jordan", name: "Jordan", initials: "JO", color: "violet", messages: 8421, favorites: 3952, favoriteRate: 0.47, rank: 1, change: 2, reactions: { "❤️": 2104, "😂": 1320, "🔥": 528 } },
  { id: "maya", name: "Maya", initials: "MA", color: "coral", messages: 7958, favorites: 4102, favoriteRate: 0.52, rank: 2, change: -1, reactions: { "❤️": 2210, "😂": 1498, "🔥": 394 } },
  { id: "alex", name: "Alex", initials: "AM", color: "mint", messages: 7254, favorites: 3681, favoriteRate: 0.51, rank: 3, change: 1, reactions: { "❤️": 1841, "😂": 1224, "🔥": 616 } },
  { id: "sam", name: "Sam", initials: "SA", color: "blue", messages: 6419, favorites: 2751, favoriteRate: 0.43, rank: 4, reactions: { "❤️": 1202, "😂": 1060, "🔥": 489 } },
  { id: "devon", name: "Devon", initials: "DE", color: "yellow", messages: 5822, favorites: 3015, favoriteRate: 0.52, rank: 5, change: 3, reactions: { "❤️": 1684, "😂": 930, "🔥": 401 } },
  { id: "riley", name: "Riley", initials: "RI", color: "pink", messages: 4904, favorites: 2086, favoriteRate: 0.43, rank: 6, reactions: { "❤️": 1052, "😂": 721, "🔥": 313 } },
  { id: "casey", name: "Casey", initials: "CA", color: "orange", messages: 4117, favorites: 1754, favoriteRate: 0.43, rank: 7, change: -2, reactions: { "❤️": 890, "😂": 614, "🔥": 250 } },
  { id: "taylor", name: "Taylor", initials: "TA", color: "teal", messages: 3764, favorites: 1599, favoriteRate: 0.42, rank: 8, reactions: { "❤️": 818, "😂": 540, "🔥": 241 } },
];

export const demoData: DashboardData = {
  availableYears: [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015],
  activePeriodLabel: "2026 recap",
  summary: { messages: 48659, favorites: 22940, members: 8, activeDays: 312, topReaction: "❤️" },
  members,
  trend: [
    { label: "Jan", messages: 3520, favorites: 1480 },
    { label: "Feb", messages: 3890, favorites: 1730 },
    { label: "Mar", messages: 3610, favorites: 1650 },
    { label: "Apr", messages: 4250, favorites: 2020 },
    { label: "May", messages: 3980, favorites: 1910 },
    { label: "Jun", messages: 4540, favorites: 2230 },
    { label: "Jul", messages: 4920, favorites: 2410 },
    { label: "Aug", messages: 4480, favorites: 2110 },
    { label: "Sep", messages: 3870, favorites: 1800 },
    { label: "Oct", messages: 4210, favorites: 1980 },
    { label: "Nov", messages: 3620, favorites: 1740 },
    { label: "Dec", messages: 3769, favorites: 1880 },
  ],
  history: [
    { id: "e1", date: "2026-03-14", type: "group.name_change", title: "Spring Break Survivors", actor: "Maya" },
    { id: "e2", date: "2025-12-31", type: "group.name_change", title: "New Year, Same Problems", actor: "Jordan" },
    { id: "e3", date: "2025-08-22", type: "group.name_change", title: "The Day Ones", actor: "Alex" },
    { id: "e4", date: "2025-05-03", type: "group.topic_change", title: "Nobody leaves the chat", actor: "Sam" },
  ],
  reactions: [
    { name: "Love", value: 11801, color: "#ff6b72" },
    { name: "Laugh", value: 7907, color: "#7868e6" },
    { name: "Fire", value: 3232, color: "#ffad5b" },
  ],
  lastImportedAt: "2026-03-26T13:36:48-04:00",
};
