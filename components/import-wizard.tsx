"use client";

import { useRef, useState } from "react";
import { CheckCircle2, FileArchive, LockKeyhole, UploadCloud, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/supabase/env";
import type { ImportPreview, ImportWorkerResponse, SanitizedEvent, SanitizedMessage } from "@/lib/import/types";
import type { Viewer } from "@/lib/types";
import { friendlyDate, fullNumber } from "@/lib/format";

type Status = "idle" | "parsing" | "preview" | "uploading" | "complete" | "error";
export function ImportWizard({ viewer, defaultExcluded = [] }: { viewer: Viewer; defaultExcluded?: string[] }) {
  const input = useRef<HTMLInputElement>(null); const workerRef = useRef<Worker | null>(null);
  const messageRows = useRef<SanitizedMessage[]>([]); const eventRows = useRef<SanitizedEvent[]>([]);
  const [status, setStatus] = useState<Status>("idle"); const [dragging, setDragging] = useState(false); const [progress, setProgress] = useState(0); const [preview, setPreview] = useState<ImportPreview | null>(null); const [included, setIncluded] = useState<Set<string>>(new Set()); const [error, setError] = useState("");

  function choose(file?: File) {
    if (!file) return; workerRef.current?.terminate(); messageRows.current = []; eventRows.current = []; setPreview(null); setProgress(0); setError(""); setStatus("parsing");
    const worker = new Worker(new URL("../workers/import.worker.ts", import.meta.url), { type: "module" }); workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<ImportWorkerResponse>) => { const data = event.data; if (data.type === "progress") setProgress(data.progress); else if (data.type === "message-batch") { messageRows.current.push(...data.messages); eventRows.current.push(...data.events); } else if (data.type === "complete") { setPreview(data.preview); setIncluded(new Set(data.preview.members.filter((member)=>!defaultExcluded.includes(member.source_user_id)).map((member) => member.source_user_id))); setStatus("preview"); worker.terminate(); } else { setError(data.error); setStatus("error"); worker.terminate(); } };
    worker.onerror = () => { setError("The browser could not process this export."); setStatus("error"); worker.terminate(); }; worker.postMessage({ file });
  }

  async function commit() {
    if (!preview) return; setStatus("uploading"); setProgress(3); setError("");
    let importId: string | null = null;
    try {
      const filtered = messageRows.current.filter((row) => included.has(row.source_user_id));
      if (isDemoMode) { for (let value=10; value<=100; value+=15) { await new Promise((resolve)=>setTimeout(resolve,100)); setProgress(Math.min(value,100)); } setStatus("complete"); return; }
      const supabase = createClient();
      const { data: importRow, error: importError } = await supabase.from("imports").insert({ group_id: viewer.groupId, created_by: viewer.id, status: "pending", source_filename: "browser-sanitized-export", row_count: preview.rowCount, message_count: filtered.length, event_count: eventRows.current.length, skipped_count: preview.skippedCount, min_date: preview.minDate, max_date: preview.maxDate, warnings: preview.warnings }).select("id").single();
      if (importError) throw importError;
      importId = importRow.id;
      const sourceMembers = preview.members.map((member) => ({ group_id: viewer.groupId, source_user_id: member.source_user_id, latest_export_name: member.display_name, is_excluded: !included.has(member.source_user_id) }));
      const memberResult = await supabase.from("source_members").upsert(sourceMembers, { onConflict: "group_id,source_user_id" }); if (memberResult.error) throw memberResult.error;
      const total = filtered.length + eventRows.current.length; let sent = 0;
      for (let index=0; index<filtered.length; index+=1000) { const rows = filtered.slice(index,index+1000).map((row)=>({ ...row, group_id: viewer.groupId, import_id: importRow.id })); const result = await supabase.from("message_metrics").insert(rows); if (result.error) throw result.error; sent += rows.length; setProgress(5 + Math.round(sent / Math.max(total,1) * 88)); }
      for (let index=0; index<eventRows.current.length; index+=1000) { const rows = eventRows.current.slice(index,index+1000).map((row)=>({ ...row, group_id: viewer.groupId, import_id: importRow.id })); const result = await supabase.from("group_events").insert(rows); if (result.error) throw result.error; sent += rows.length; setProgress(5 + Math.round(sent / Math.max(total,1) * 88)); }
      const finalized = await supabase.rpc("finalize_import", { p_import_id: importRow.id }); if (finalized.error) throw finalized.error; setProgress(100); setStatus("complete");
    } catch (cause) { const message=cause instanceof Error ? cause.message : "The sanitized import could not be saved."; if(importId&&!isDemoMode){await createClient().from("imports").update({status:"failed",error_message:message}).eq("id",importId);} setError(message); setStatus("error"); }
  }

  if (status === "complete") return <div className="empty-state"><span className="empty-state-icon" style={{color:"#087455",background:"var(--mint-soft)"}}><CheckCircle2 size={30}/></span><h2>Recap refreshed!</h2><p>The new snapshot is active. No message text or raw files were uploaded.</p><button className="button button-primary" onClick={()=>{setStatus("idle");setPreview(null);}}>Import another export</button></div>;
  return <div><div className="privacy-note"><LockKeyhole size={20}/><span><strong>Private by design.</strong> Your export is parsed inside this browser. Message bodies, attachments, and liker identities are discarded before anything is sent.</span></div>{status === "idle" || status === "error" ? <div className={dragging ? "upload-zone dragging" : "upload-zone"} role="button" tabIndex={0} onClick={()=>input.current?.click()} onKeyDown={(event)=>{if(event.key==="Enter"||event.key===" ")input.current?.click();}} onDragOver={(event)=>{event.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={(event)=>{event.preventDefault();setDragging(false);choose(event.dataTransfer.files[0]);}}><input ref={input} hidden type="file" accept=".zip,.json,application/zip,application/json" onChange={(event)=>choose(event.target.files?.[0])}/><span className="upload-icon">{status === "error" ? <XCircle size={25}/> : <UploadCloud size={25}/>}</span><strong>{status === "error" ? "That export didn’t work" : "Drop your GroupMe export here"}</strong><small>{status === "error" ? error : "ZIP or message.json · processed on this device"}</small></div> : status === "parsing" || status === "uploading" ? <div className="empty-state"><span className="empty-state-icon"><FileArchive size={28}/></span><h2>{status === "parsing" ? "Reading the group history…" : "Publishing the sanitized recap…"}</h2><p>{status === "parsing" ? "Large files are streamed in the background, so you can keep using your phone." : "The existing dashboard stays active until every chunk is safely stored."}</p><div style={{width:"min(100%,340px)"}}><div className="progress-track"><span style={{width:`${progress}%`}}/></div><small>{progress}% complete</small></div></div> : preview && <div className="import-preview"><h3 style={{margin:0,fontFamily:"Bricolage Grotesque Variable"}}>Ready to refresh</h3><div className="preview-grid"><div className="preview-item"><span>Messages</span><strong>{fullNumber(preview.messageCount)}</strong></div><div className="preview-item"><span>Group events</span><strong>{fullNumber(preview.eventCount)}</strong></div><div className="preview-item"><span>From</span><strong>{preview.minDate ? friendlyDate(preview.minDate) : "—"}</strong></div><div className="preview-item"><span>Through</span><strong>{preview.maxDate ? friendlyDate(preview.maxDate) : "—"}</strong></div></div>{preview.warnings.length > 0 && <ul className="warning-list">{preview.warnings.map((warning)=><li key={warning}>{warning}</li>)}</ul>}<h4>Included members</h4><div>{preview.members.map((member)=><label className="member-toggle" key={member.source_user_id}><input type="checkbox" checked={included.has(member.source_user_id)} onChange={(event)=>setIncluded((current)=>{const next=new Set(current);if(event.target.checked)next.add(member.source_user_id);else next.delete(member.source_user_id);return next;})}/><span style={{flex:1}}>{member.display_name}</span><small>{fullNumber(member.message_count)} messages</small></label>)}</div><div className="button-row" style={{marginTop:16}}><button className="button button-primary" onClick={commit}>Publish new recap</button><button className="button button-ghost" onClick={()=>{setStatus("idle");setPreview(null);}}>Cancel</button></div></div>}</div>;
}
