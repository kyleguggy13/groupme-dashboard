"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/supabase/env";

const timezones=["America/New_York","America/Chicago","America/Denver","America/Los_Angeles","America/Phoenix","Europe/London","UTC"];
export function GroupSettings({groupId,initialTimezone,canEdit}:{groupId:string;initialTimezone:string;canEdit:boolean}){const[timezone,setTimezone]=useState(initialTimezone);const[saved,setSaved]=useState(false);const[error,setError]=useState("");async function save(){setError("");if(!isDemoMode){const{error:saveError}=await createClient().from("groups").update({timezone}).eq("id",groupId);if(saveError){setError(saveError.message);return;}}setSaved(true);setTimeout(()=>setSaved(false),1800);}return <div><div className="form-row"><label htmlFor="group-timezone">Group timezone</label><select className="input" id="group-timezone" value={timezone} disabled={!canEdit} onChange={(event)=>setTimezone(event.target.value)}>{timezones.map((zone)=><option key={zone}>{zone}</option>)}</select></div>{canEdit&&<button className="button button-ghost" onClick={save}>{saved?"Saved":"Save defaults"}</button>}{error&&<p style={{color:"#a92d39",fontSize:12}}>{error}</p>}<p style={{fontSize:12,color:"var(--ink-soft)"}}>The recap opens on the latest available year. Message content is never stored.</p></div>}
