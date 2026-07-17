import { Brand } from "@/components/brand";
import { GoogleSignIn } from "@/components/google-sign-in";

export const metadata = { title: "Sign in" };
export default function LoginPage() { return <main className="auth-page"><section className="auth-card card"><Brand/><h1>Your group had a year.</h1><p>Sign in to relive the messages, favorites, running jokes, and deeply unnecessary group names.</p><GoogleSignIn/><p className="auth-footnote">Invite-only. DataBoard never stores message text.</p></section></main>; }
