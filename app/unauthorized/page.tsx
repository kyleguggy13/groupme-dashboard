import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { Brand } from "@/components/brand";

export const metadata = { title: "Invite required" };
export default function UnauthorizedPage() { return <main className="auth-page"><section className="auth-card card"><Brand/><div className="empty-state" style={{padding:"38px 0 5px"}}><span className="empty-state-icon"><LockKeyhole size={28}/></span><h2>This recap is invite-only</h2><p>You signed in successfully, but this Google account is not connected to a group member. Ask the group admin for your personal invite link.</p><Link className="button button-ghost" href="/login">Try another account</Link></div></section></main>; }
