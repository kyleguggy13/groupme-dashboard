"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

declare global { interface Window { dataLayer: unknown[]; gtag: (...args: unknown[]) => void; } }

export function Analytics({ measurementId }: { measurementId?: string }) {
  const pathname = usePathname();
  useEffect(() => { if (measurementId && window.gtag) window.gtag("event", "page_view", { page_path: pathname }); }, [measurementId, pathname]);
  if (!measurementId) return null;
  return <><Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`} strategy="afterInteractive"/><Script id="ga-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${measurementId}',{send_page_view:false});`}</Script></>;
}
