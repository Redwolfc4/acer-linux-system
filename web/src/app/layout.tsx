import type { Metadata } from "next";
import type { ReactNode } from "react";
import { QueryProvider } from "@/components/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Acer Control & Dev Suite — Web GUI",
  description:
    "Acer Nitro / Predator Linux Telemetry, Dual Fan & Sensor Control, 4-Zone RGB Keyboard, Battery Care, GPU Switcher & Git Suite",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("acer-ui-theme")||"dark";document.documentElement.classList.remove("dark","light");document.documentElement.classList.add(t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased transition-colors duration-200 selection:bg-cyan-500/30 selection:text-cyan-800 dark:bg-[#07090f] dark:text-slate-100 dark:selection:text-cyan-200">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

