"use client";

import { useState } from "react";
import { Avatar } from "@/components/avatar";
import type { AccessMember } from "@/lib/admin-data";
import type { MemberRole } from "@/lib/types";

export function AccessManager({ members, viewerId, canManage }: { members: AccessMember[]; viewerId: string; canManage: boolean }) {
  const [rows,setRows]=useState(members); const [error,setError]=useState(""); const [saving,setSaving]=useState("");
  async function changeRole(member:AccessMember,role:MemberRole){if(role==="owner"&&!window.confirm(`Transfer ownership to ${member.name}? You will become an admin.`))return;setSaving(member.id);setError("");const response=await fetch(`/api/members/${member.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({role})});const body=await response.json();setSaving("");if(!response.ok){setError(body.error??"Could not change access.");return;}setRows((current)=>current.map((row)=>row.id===member.id?{...row,role}:role==="owner"&&row.userId===viewerId?{...row,role:"admin"}:row));}
  return <div className="settings-list">{rows.map((member)=><div className="settings-list-row" key={member.id}><Avatar name={member.name} size="sm" color={member.role==="owner"?"yellow":"violet"}/><span><strong>{member.name}{member.userId===viewerId?" (you)":""}</strong><small>{member.email}</small></span>{canManage&&member.userId!==viewerId?<select className="role-select" value={member.role} disabled={saving===member.id} onChange={(event)=>changeRole(member,event.target.value as MemberRole)}><option value="member">Member</option><option value="admin">Admin</option><option value="owner">Owner</option></select>:<span className="role-pill">{member.role}</span>}</div>)}{error&&<p style={{color:"#a92d39",fontSize:12}}>{error}</p>}</div>;
}
