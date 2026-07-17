import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request:Request,{params}:{params:Promise<{membershipId:string}>}){const{membershipId}=await params;const body=await request.json().catch(()=>null) as {role?:string}|null;if(!body?.role||!["owner","admin","member"].includes(body.role))return NextResponse.json({error:"Choose a valid role."},{status:400});if(isDemoMode)return NextResponse.json({ok:true});const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Sign in required."},{status:401});const{error}=await supabase.rpc("set_member_role",{p_membership_id:membershipId,p_role:body.role});if(error)return NextResponse.json({error:error.message},{status:403});return NextResponse.json({ok:true});}
