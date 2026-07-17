"use client";

import { AlertTriangle } from "lucide-react";
export default function DashboardError({ reset }: { error: Error; reset: () => void }) { return <div className="page-wrap"><div className="empty-state card"><span className="empty-state-icon" style={{color:"#a92d39",background:"var(--coral-soft)"}}><AlertTriangle size={29}/></span><h2>The recap hit a snag</h2><p>Your data is still safe. Check the connection and try loading this view again.</p><button className="button button-primary" onClick={reset}>Try again</button></div></div>; }
