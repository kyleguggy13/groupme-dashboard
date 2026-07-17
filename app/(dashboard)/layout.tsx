import { AppShell } from "@/components/app-shell";
import { getViewer } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  return <AppShell viewer={viewer}>{children}</AppShell>;
}
