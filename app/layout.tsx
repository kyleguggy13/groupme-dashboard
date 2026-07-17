import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/inter";
import "./globals.css";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { RegisterServiceWorker } from "@/components/register-service-worker";
import { Analytics } from "@/components/analytics";

export const metadata: Metadata = {
  title: { default: "GroupMe DataBoard", template: "%s · DataBoard" },
  description: "A private, playful recap of your GroupMe history.",
  applicationName: "GroupMe DataBoard",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "DataBoard" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#f8f4ea",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <RegisterServiceWorker />
        <Analytics measurementId={process.env.NEXT_PUBLIC_GA_ID} />
        <VercelAnalytics />
      </body>
    </html>
  );
}
