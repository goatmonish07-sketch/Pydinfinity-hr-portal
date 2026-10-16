import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/lora/500.css";
import "@fontsource/lora/600.css";
import "./globals.css";
import { themeBootScript } from "@/lib/theme";
import { AppShell } from "@/components/shell";

export const metadata: Metadata = {
  title: { default: "Pydinfinity HR · Live Demo", template: "%s · Pydinfinity HR" },
  description: "People, IDs, KYC, interns, freelancers, attendance, letters and payroll — one HR workspace for Pydinfinity Solutions.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, title: "Pydinfinity HR", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#eef0eb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script id="theme-boot" strategy="beforeInteractive">
          {themeBootScript}
        </Script>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
