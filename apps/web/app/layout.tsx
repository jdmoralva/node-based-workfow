import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import "@/app/globals.css";

const barlow = localFont({
  src: [
    { path: "../public/fonts/barlow-400-latin.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/barlow-500-latin.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/barlow-600-latin.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/barlow-700-latin.woff2", weight: "700", style: "normal" }
  ],
  display: "swap",
  variable: "--font-barlow"
});

export const metadata: Metadata = {
  title: "Risk Viewer",
  description: "Standalone migration shell for the legacy Risk Viewer frontend."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={barlow.variable}>{children}</body>
    </html>
  );
}
