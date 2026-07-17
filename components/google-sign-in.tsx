"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv, isDemoMode } from "@/lib/supabase/env";

export function GoogleSignIn({ next = "/" }: { next?: string }) {
  const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function signIn() {
    if (isDemoMode) { window.location.assign(next); return; }
    if (!hasSupabaseEnv) { setError("Supabase is not configured. Add the variables from .env.example."); return; }
    setLoading(true); const supabase = createClient(); const origin = window.location.origin;
    const { error: authError } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`, queryParams: { access_type: "offline", prompt: "consent" } } });
    if (authError) { setError(authError.message); setLoading(false); }
  }
  return <><button className="google-button" onClick={signIn} disabled={loading}><svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.3Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1a5.8 5.8 0 0 1-5.4-4H3.3v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.6 14a6 6 0 0 1 0-3.9V7.5H3.3a10 10 0 0 0 0 9.1L6.6 14Z"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 3.3 7.5l3.3 2.6A5.8 5.8 0 0 1 12 6Z"/></svg>{loading ? "Opening Google…" : "Continue with Google"}</button>{error && <p style={{color:"#a92d39",fontSize:12}}>{error}</p>}</>;
}
