import { Brand } from "@/components/brand";
import { GoogleSignIn } from "@/components/google-sign-in";
import { isDemoMode } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata={title:"Set up DataBoard"};
export default async function SetupPage(){if(isDemoMode)return <main className="auth-page"><section className="auth-card card"><Brand/><h1>Demo is ready.</h1><p>Disable demo mode and configure Supabase to bootstrap a private production group.</p></section></main>;const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();return <main className="auth-page"><section className="auth-card card"><Brand/><h1>Start the recap.</h1><p>The email configured as INITIAL_ADMIN_EMAIL can create the one-time owner account and first group.</p>{user?<form action="/api/setup" method="post"><div className="form-row"><label htmlFor="group-name">Group name</label><input id="group-name" className="input" name="groupName" required maxLength={100} placeholder="The Day Ones"/></div><button className="button button-primary">Create private group</button></form>:<GoogleSignIn next="/setup"/>}</section></main>}
