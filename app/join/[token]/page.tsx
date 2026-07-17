import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { GoogleSignIn } from "@/components/google-sign-in";
import { isDemoMode } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata={title:"Join group"};
export default async function JoinPage({params}:{params:Promise<{token:string}>}){const{token}=await params;if(isDemoMode)redirect("/");const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(user)redirect(`/join/${encodeURIComponent(token)}/claim`);return <main className="auth-page"><section className="auth-card card"><Brand/><h1>You&apos;re invited.</h1><p>Use the exact Google account named by your group admin to connect your recap identity.</p><GoogleSignIn next={`/join/${encodeURIComponent(token)}/claim`}/><p className="auth-footnote">This one-time link expires after seven days.</p></section></main>}
