import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request:Request,{params}:{params:Promise<{token:string}>}){const{token}=await params;const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.redirect(new URL(`/join/${encodeURIComponent(token)}`,request.url));const{error}=await supabase.rpc("claim_group_invite",{p_token:token});if(error)return NextResponse.redirect(new URL(`/unauthorized?reason=${encodeURIComponent(error.message)}`,request.url));return NextResponse.redirect(new URL("/",request.url));}
