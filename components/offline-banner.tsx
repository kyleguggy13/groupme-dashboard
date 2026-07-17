"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => { const update=()=>setOffline(!navigator.onLine); update(); window.addEventListener("online",update); window.addEventListener("offline",update); return()=>{window.removeEventListener("online",update);window.removeEventListener("offline",update);}; },[]);
  if (!offline) return null;
  return <div className="offline-banner" role="status"><WifiOff size={15}/>You&apos;re offline. Private stats are not cached.</div>;
}
