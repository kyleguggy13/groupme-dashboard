import Link from "next/link";
import { MessageCircleHeart } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" href="/" aria-label="GroupMe DataBoard home">
      <span className="brand-mark"><MessageCircleHeart aria-hidden="true" /></span>
      {!compact && <span>DataBoard</span>}
    </Link>
  );
}
