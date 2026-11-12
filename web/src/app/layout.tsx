import type { Metadata } from "next";
import type { ReactNode } from "react";
import { QueryProvider } from "@/components/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Acer Control & Dev Suite — Web GUI",
  description:
    "Acer Nitro / Predator Linux Telemetry, Dual Fan & Sensor Control, 4-Zone RGB Keyboard, Battery Care, GPU Switcher & Git Suite",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen bg-[#07090f] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

