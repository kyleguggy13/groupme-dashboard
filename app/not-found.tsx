import Link from "next/link";
import { SearchX } from "lucide-react";
export default function NotFound() { return <main className="auth-page"><div className="empty-state card" style={{width:"min(100%,480px)"}}><span className="empty-state-icon"><SearchX size={28}/></span><h2>That recap page wandered off</h2><p>The member or page may no longer be part of the active import.</p><Link className="button button-primary" href="/">Back home</Link></div></main>; }
