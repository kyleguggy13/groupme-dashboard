"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function MemberFilter({members}:{members:Array<{id:string;name:string}>}){const router=useRouter();const pathname=usePathname();const search=useSearchParams();const value=search.get("member")??"all";return <label className="member-filter"><span>Showing</span><select value={value} onChange={(event)=>{const next=new URLSearchParams(search.toString());if(event.target.value==="all")next.delete("member");else next.set("member",event.target.value);router.push(`${pathname}?${next.toString()}`);}}><option value="all">Everyone</option>{members.map((member)=><option value={member.id} key={member.id}>{member.name}</option>)}</select></label>}
