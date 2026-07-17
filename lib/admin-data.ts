import { demoData, demoViewer } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { MemberRole, Viewer } from "@/lib/types";

export interface AccessMember { id: string; userId: string; name: string; email: string; role: MemberRole; sourceMemberId: string | null; }

export async function getAccessMembers(viewer: Viewer): Promise<AccessMember[]> {
  if (isDemoMode) return demoData.members.slice(0,4).map((member,index)=>({id:`demo-${member.id}`,userId:index===0?demoViewer.id:`user-${member.id}`,name:index===0?demoViewer.name:member.name,email:index===0?demoViewer.email:`${member.name.toLowerCase()}@example.com`,role:index===0?"owner":index===1?"admin":"member",sourceMemberId:member.id}));
  const supabase=await createClient();
  const{data,error}=await supabase.from("memberships").select("id,user_id,role,source_member_id").eq("group_id",viewer.groupId).eq("status","active");
  if(error||!data)return [];
  const userIds=data.map((row)=>row.user_id); const sourceIds=data.flatMap((row)=>row.source_member_id?[row.source_member_id]:[]);
  const[profilesResult,sourcesResult]=await Promise.all([supabase.from("profiles").select("id,display_name").in("id",userIds),sourceIds.length?supabase.from("source_members").select("source_user_id,latest_export_name,display_name_override").eq("group_id",viewer.groupId).in("source_user_id",sourceIds):Promise.resolve({data:[],error:null})]);
  const profiles=new Map((profilesResult.data??[]).map((row)=>[row.id,row.display_name])); const sources=new Map((sourcesResult.data??[]).map((row)=>[row.source_user_id,row.display_name_override??row.latest_export_name]));
  return data.map((row)=>({id:row.id,userId:row.user_id,name:profiles.get(row.user_id)??(row.source_member_id?sources.get(row.source_member_id):undefined)??"Member",email:"Google account connected",role:row.role as MemberRole,sourceMemberId:row.source_member_id}));
}

export async function getSourceMembers(viewer: Viewer): Promise<{ members: Array<{ id: string; name: string }>; excluded: string[] }> {
  if (isDemoMode) return { members: demoData.members.map((member)=>({id:member.id,name:member.name})), excluded: [] };
  const supabase=await createClient(); const{data}=await supabase.from("source_members").select("source_user_id,latest_export_name,display_name_override,is_excluded").eq("group_id",viewer.groupId).order("latest_export_name");
  return { members:(data??[]).map((row)=>({id:row.source_user_id,name:row.display_name_override??row.latest_export_name})), excluded:(data??[]).filter((row)=>row.is_excluded).map((row)=>row.source_user_id) };
}
