import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "./globals.css";
import { themeBootScript } from "@/lib/theme";
import { AppShell } from "@/components/shell";

export const metadata: Metadata = {
  title: { default: "Pydinfinity HR Portal", template: "%s · Pydinfinity HR" },
  description: "People, IDs, KYC, interns, freelancers, attendance, letters and payroll — one HR workspace for Pydinfinity Solutions.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, title: "Pydinfinity HR", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#e91e63",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
