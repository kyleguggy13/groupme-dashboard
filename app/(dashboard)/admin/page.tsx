import { Download, KeyRound, Settings2, ShieldCheck, Smartphone, UsersRound } from "lucide-react";
import { AccessManager } from "@/components/access-manager";
import { Avatar } from "@/components/avatar";
import { GroupSettings } from "@/components/group-settings";
import { ImportWizard } from "@/components/import-wizard";
import { InviteManager } from "@/components/invite-manager";
import { SignOutButton } from "@/components/sign-out-button";
import { getAccessMembers, getSourceMembers } from "@/lib/admin-data";
import { getViewer } from "@/lib/auth";

export const metadata = { title: "Admin & settings" };

export default async function AdminPage() {
  const viewer = await getViewer();
  const accessMembers = await getAccessMembers(viewer);
  const sourceMembers = await getSourceMembers(viewer);
  const canAdmin = viewer.role === "owner" || viewer.role === "admin";
  return (
    <div className="page-wrap">
      <header className="page-header"><div><span className="eyebrow">Private controls</span><h1>Settings</h1><p>Manage the recap without exposing the chat.</p></div></header>
      <div className="admin-grid">
        <div>{canAdmin && <section className="settings-card card"><h2><Download size={20}/>Refresh group data</h2><p>Upload the latest official GroupMe export. The current recap stays live until the replacement passes validation.</p><ImportWizard viewer={viewer} defaultExcluded={sourceMembers.excluded}/></section>}</div>
        <div style={{display:"grid",gap:16}}>
          {canAdmin && <section className="settings-card card"><h2><KeyRound size={20}/>Invite a member</h2><p>Each invite is locked to one Google email and GroupMe identity.</p><InviteManager members={sourceMembers.members}/></section>}
          <section className="settings-card card"><h2><UsersRound size={20}/>Group access</h2><p>Members can view the recap. Admins can also invite and import. Only the owner can transfer ownership.</p><AccessManager members={accessMembers} viewerId={viewer.id} canManage={viewer.role === "owner"}/></section>
          <section className="settings-card card"><h2><ShieldCheck size={20}/>Your access</h2><div className="settings-list"><div className="settings-list-row"><Avatar name={viewer.name} src={viewer.avatarUrl} color="mint"/><span><strong>{viewer.name}</strong><small>{viewer.email}</small></span><span className="role-pill">{viewer.role}</span></div></div><div className="button-row" style={{marginTop:14}}><SignOutButton/></div></section>
          <section className="settings-card card"><h2><Smartphone size={20}/>Install DataBoard</h2><p>On iPhone, use Share → Add to Home Screen. On Android, open the browser menu and choose Install app.</p></section>
          <section className="settings-card card"><h2><Settings2 size={20}/>Group defaults</h2><GroupSettings groupId={viewer.groupId} initialTimezone={viewer.groupTimezone} canEdit={viewer.role === "owner"}/></section>
        </div>
      </div>
    </div>
  );
}
