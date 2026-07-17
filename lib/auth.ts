import { redirect } from "next/navigation";
import { demoViewer } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { MemberRole, Viewer } from "@/lib/types";

type MembershipRow = {
  role: MemberRole;
  source_member_id: string | null;
  groups: { id: string; name: string; timezone: string } | Array<{ id: string; name: string; timezone: string }>;
};

export async function getViewer(): Promise<Viewer> {
  if (isDemoMode) return demoViewer;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("memberships")
    .select("role, source_member_id, groups!inner(id, name, timezone)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Could not load membership: ${error.message}`);
  if (!data) redirect("/unauthorized");

  const row = data as unknown as MembershipRow;
  const group = Array.isArray(row.groups) ? row.groups[0] : row.groups;
  return {
    id: user.id,
    name: user.user_metadata.full_name ?? user.user_metadata.name ?? user.email?.split("@")[0] ?? "Member",
    email: user.email ?? "",
    avatarUrl: user.user_metadata.avatar_url ?? null,
    role: row.role,
    sourceMemberId: row.source_member_id,
    groupId: group.id,
    groupName: group.name,
    groupTimezone: group.timezone,
  };
}
