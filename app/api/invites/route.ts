import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body=await request.json().catch(()=>null) as {email?:string;sourceMemberId?:string}|null; const email=body?.email?.trim().toLowerCase(); const sourceMemberId=body?.sourceMemberId;
  if(!email||!/^\S+@\S+\.\S+$/.test(email)||!sourceMemberId)return NextResponse.json({error:"A valid email and member are required."},{status:400});
  const origin=new URL(request.url).origin; const token=randomBytes(24).toString("base64url");
  if(isDemoMode)return NextResponse.json({url:`${origin}/join/${token}`});
  const supabase=await createClient(); const{data:{user}}=await supabase.auth.getUser(); if(!user)return NextResponse.json({error:"Sign in required."},{status:401});
  const{data:membership}=await supabase.from("memberships").select("group_id, role").eq("user_id",user.id).eq("status","active").in("role",["owner","admin"]).limit(1).maybeSingle(); if(!membership)return NextResponse.json({error:"Admin access required."},{status:403});
  const tokenHash=createHash("sha256").update(token).digest("hex"); const{error}=await supabase.from("group_invites").insert({group_id:membership.group_id,email,source_member_id:sourceMemberId,token_hash:tokenHash,created_by:user.id,expires_at:new Date(Date.now()+7*86400000).toISOString()}); if(error)return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({url:`${origin}/join/${token}`});
}
