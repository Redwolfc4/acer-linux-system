"use client";

import {
  Activity,
  BatteryCharging,
  Cpu,
  Fan,
  GitBranch,
  Keyboard,
  Laptop,
  Moon,
  RefreshCw,
  Sun,
  Terminal,
  X,
} from "lucide-react";
import { useEffect } from "react";
import type { TelemetryResponse } from "@/lib/schemas";
import { useAcerStore, type DashboardTab } from "@/store/useAcerStore";

interface TopTelemetryBarProps {
  telemetry?: TelemetryResponse;
  isFetching: boolean;
  onRefresh: () => void;
}

const TABS: Array<{ id: DashboardTab; label: string; icon: typeof Activity }> = [
  { id: "all", label: "Dashboard", icon: Activity },
  { id: "fans", label: "Kipas & Sensor", icon: Fan },
  { id: "rgb", label: "RGB Keyboard", icon: Keyboard },
  { id: "power", label: "Baterai & GPU", icon: BatteryCharging },
  { id: "git", label: "Git Suite", icon: GitBranch },
];

export function TopTelemetryBar({
  telemetry,
  isFetching,
  onRefresh,
}: TopTelemetryBarProps) {
  const pollingMs = useAcerStore((s) => s.pollingMs);
  const setPollingMs = useAcerStore((s) => s.setPollingMs);
  const activeTab = useAcerStore((s) => s.activeTab);
  const setActiveTab = useAcerStore((s) => s.setActiveTab);
  const theme = useAcerStore((s) => s.theme);
  const toggleTheme = useAcerStore((s) => s.toggleTheme);
  const toast = useAcerStore((s) => s.toast);
  const clearToast = useAcerStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => clearToast(), 4500);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-xl transition-colors duration-200 shadow-xs dark:border-slate-800/80 dark:bg-[#07090f]/90 dark:shadow-none">
      <div className="mx-auto px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-slate-100 to-rose-500/10 shadow-sm shadow-cyan-500/5 dark:border-cyan-500/40 dark:from-cyan-500/20 dark:via-slate-900 dark:to-rose-500/20 dark:shadow-cyan-500/10">
              <Laptop className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg dark:text-white">
                  ACER CONTROL & DEV SUITE
                </h1>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-700 dark:border-cyan-500/40 dark:bg-cyan-500/10 dark:text-cyan-300">
                  Web GUI
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                <span>{telemetry?.system.model ?? "Acer Nitro AN517-41"}</span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span>{telemetry?.system.distro ?? "CachyOS Linux"}</span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  {telemetry?.system.kernel ?? "kernel"}
                </span>
                <span className="hidden items-center gap-1 text-slate-500 md:inline-flex dark:text-slate-400">
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <Cpu className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                  {telemetry?.system.cpuModel ?? "AMD Ryzen 7 5800H"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100/90 px-2.5 py-1.5 text-xs text-slate-600 shadow-2xs dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-400">
              <Terminal className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-slate-500 dark:text-slate-400">CLI:</span>
              <code className="font-mono font-medium text-emerald-700 dark:text-emerald-300">acer</code>
            </div>

            <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100/90 p-1 text-xs shadow-2xs dark:border-slate-800 dark:bg-slate-900/90">
              <span className="px-1.5 text-[11px] text-slate-500 dark:text-slate-400">Poll:</span>
              {([
                [1500, "1.5s"],
                [3000, "3s"],
                [5000, "5s"],
                [0, "Pause"],
              ] as const).map(([ms, label]) => (
                <button
                  key={ms}
                  type="button"
                  onClick={() => setPollingMs(ms)}
                  className={`rounded-md px-2 py-0.5 font-medium transition ${pollingMs === ms
                      ? "bg-white text-cyan-800 font-semibold shadow-xs ring-1 ring-cyan-500/40 dark:bg-cyan-500/20 dark:text-cyan-300 dark:ring-cyan-500/40"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onRefresh}
              title="Refresh telemetry"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:border-cyan-500 hover:text-cyan-700 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-500/50 dark:hover:text-cyan-300"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-cyan-600 dark:text-cyan-400" : ""}`}
              />
              Sync
            </button>

            {/* Dark & Light Theme Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === "dark" ? "Beralih ke Light Mode" : "Beralih ke Dark Mode"}
              aria-label="Toggle theme mode"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:border-amber-400 hover:text-amber-700 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-500/50 dark:hover:text-cyan-300"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400 transition-transform duration-200 hover:rotate-45" />
                  <span className="font-semibold">Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-indigo-600 transition-transform duration-200" />
                  <span className="font-semibold">Dark</span>
                </>
              )}
            </button>
          </div>
        </div>

        <nav className="mt-3 flex flex-wrap items-center gap-1.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${active
                    ? "bg-cyan-50 text-cyan-800 ring-1 ring-cyan-500/40 shadow-xs dark:bg-gradient-to-r dark:from-cyan-500/20 dark:to-blue-500/20 dark:text-cyan-200 dark:ring-cyan-500/50 dark:shadow-cyan-500/10"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
                  }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {toast && (
          <div
            className={`mt-2.5 flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium shadow-xs ${toast.type === "error"
                ? "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/50 dark:bg-rose-950/60 dark:text-rose-200"
                : toast.type === "info"
                  ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/50 dark:bg-amber-950/50 dark:text-amber-200"
                  : "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-950/50 dark:text-emerald-200"
              }`}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={clearToast}
              className="ml-3 rounded p-0.5 opacity-70 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

