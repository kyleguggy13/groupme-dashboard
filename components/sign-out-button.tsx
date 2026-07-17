"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/supabase/env";

export function SignOutButton() { return <button className="button button-ghost" onClick={async()=>{if(!isDemoMode)await createClient().auth.signOut();window.location.assign("/login");}}><LogOut size={16}/>Sign out</button>; }
