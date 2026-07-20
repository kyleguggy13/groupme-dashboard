import Link from "next/link";
import { MessageCircleHeart } from "lucide-react";

export function Brand({ compact = false, href = "/" }: { compact?: boolean; href?: string }) {
  return (
    <Link className="brand" href={href} aria-label="GroupMe DataBoard home">
      <span className="brand-mark"><MessageCircleHeart aria-hidden="true" /></span>
      {!compact && <span>DataBoard</span>}
    </Link>
  );
}
