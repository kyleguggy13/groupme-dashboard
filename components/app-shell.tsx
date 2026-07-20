"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChartNoAxesColumnIncreasing, Clock3, House, Settings, Users } from "lucide-react";
import type { ReactNode } from "react";
import type { Viewer } from "@/lib/types";
import { Avatar } from "@/components/avatar";
import { Brand } from "@/components/brand";
import { OfflineBanner } from "@/components/offline-banner";
import { withPeriodSelection } from "@/lib/period-link";

const navigation = [
  { href: "/", label: "Home", icon: House },
  { href: "/rankings", label: "Rankings", icon: ChartNoAxesColumnIncreasing },
  { href: "/timeline", label: "Timeline", icon: Clock3 },
  { href: "/people", label: "People", icon: Users },
];

export function AppShell({ children, viewer }: { children: ReactNode; viewer: Viewer }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const periodSelection = {
    period: searchParams.get("period"),
    from: searchParams.get("from"),
    to: searchParams.get("to"),
  };
  const periodHref = (href: string) => withPeriodSelection(href, periodSelection);
  return (
    <div className="app-shell">
      <OfflineBanner />
      <aside className="desktop-sidebar">
        <Brand href={periodHref("/")} />
        <div className="group-stamp">
          <span className="eyebrow">Group recap</span>
          <strong>{viewer.groupName}</strong>
        </div>
        <nav aria-label="Primary navigation">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return <Link className={active ? "nav-link active" : "nav-link"} href={periodHref(href)} key={href}><Icon size={20} /><span>{label}</span></Link>;
          })}
        </nav>
        <Link className={pathname.startsWith("/admin") ? "sidebar-profile active" : "sidebar-profile"} href={periodHref("/admin")}>
          <Avatar name={viewer.name} src={viewer.avatarUrl} size="sm" color="mint" />
          <span><strong>{viewer.name}</strong><small>{viewer.role}</small></span>
          <Settings size={17} />
        </Link>
      </aside>
      <div className="mobile-topbar">
        <Brand href={periodHref("/")} />
        <Link href={periodHref("/admin")} aria-label="Open settings"><Avatar name={viewer.name} src={viewer.avatarUrl} size="sm" color="mint" /></Link>
      </div>
      <main className="app-main">{children}</main>
      <nav className="bottom-nav" aria-label="Primary navigation">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return <Link className={active ? "bottom-link active" : "bottom-link"} href={periodHref(href)} key={href}><Icon size={21} strokeWidth={active ? 2.7 : 2} /><span>{label}</span></Link>;
        })}
      </nav>
    </div>
  );
}
