"use client";

import {
  BatteryCharging,
  Cpu,
  Monitor,
  RefreshCw,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useBatteryMutation, useGpuMutation } from "@/hooks/useAcerQueries";
import type { GpuMode, TelemetryResponse } from "@/lib/schemas";

interface BatteryAndGpuPanelProps {
  telemetry?: TelemetryResponse;
}

const GPU_MODES: Array<{
  mode: GpuMode;
  title: string;
  subtitle: string;
  badge: string;
}> = [
  {
    mode: "hybrid",
    title: "Hybrid Mode",
    subtitle: "iGPU AMD hemat daya + NVIDIA RTX 3080 On-Demand (Prime Offload)",
    badge: "Recommended",
  },
  {
    mode: "integrated",
    title: "Integrated (iGPU)",
    subtitle: "Hanya AMD Radeon Vega — matikan dGPU untuk baterai maksimal",
    badge: "Eco / Battery",
  },
  {
    mode: "nvidia",
    title: "NVIDIA Dedicated",
    subtitle: "Full 100% RTX 3080 Mobile — performa maksimal & external display",
    badge: "Max Perf",
  },
];

export function BatteryAndGpuPanel({ telemetry }: BatteryAndGpuPanelProps) {
  const batteryMutation = useBatteryMutation();
  const gpuMutation = useGpuMutation();
  const [rebootBanner, setRebootBanner] = useState(false);

  const bat = telemetry?.battery;
  const gpu = telemetry?.gpu;
  const capacity = bat?.capacity ?? 0;
  const healthActive = bat?.healthMode === true;

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Battery Care Panel */}
      <div className="rounded-2xl border border-slate-800/90 bg-[#0d121c]/90 p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2">
              <BatteryCharging className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Battery Care & Charge Limit
              </h2>
              <p className="text-xs text-slate-400">
                Driver <code>acer_wmi_battery</code> — proteksi baterai cut-off 80%
              </p>
            </div>
          </div>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
              healthActive
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/40 bg-amber-500/10 text-amber-300"
            }`}
          >
            {healthActive ? "80% LIMIT ON" : "100% FULL"}
          </span>
        </div>

        {/* Battery Visual Gauge */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-extrabold text-white">
                {bat?.capacity !== null && bat?.capacity !== undefined
                  ? `${bat.capacity}%`
                  : "--"}
              </span>
              <span className="ml-2 text-xs text-slate-400">
                {bat?.status ?? "Unknown"}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Suhu Baterai:{" "}
              <strong className="text-cyan-300">
                {bat?.temperature !== null && bat?.temperature !== undefined
                  ? `${bat.temperature}°C`
                  : "N/A"}
              </strong>
            </div>
          </div>

          <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-900 ring-1 ring-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                healthActive
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-400"
                  : "bg-gradient-to-r from-amber-500 to-emerald-400"
              }`}
              style={{ width: `${Math.max(4, Math.min(100, capacity))}%` }}
            />
            {/* 80% limit marker */}
            <div
              title="Batas Cut-Off 80%"
              className="absolute inset-y-0 left-[80%] w-0.5 bg-white/70"
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-500">
            <span>0%</span>
            <span className="text-emerald-400">80% Cut-Off</span>
            <span>100%</span>
          </div>
        </div>

        {/* Battery Controls */}
        <div className="mt-4 space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={batteryMutation.isPending}
              onClick={() => batteryMutation.mutate({ healthMode: true })}
              className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                healthActive
                  ? "border-emerald-400/70 bg-emerald-500/20 text-emerald-200"
                  : "border-slate-700 bg-slate-900 text-slate-200 hover:border-emerald-500/50"
              }`}
            >
              <ShieldCheck className="h-4 w-4" /> Aktifkan Limit 80%
            </button>
            <button
              type="button"
              disabled={batteryMutation.isPending}
              onClick={() => batteryMutation.mutate({ healthMode: false })}
              className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                bat?.healthMode === false
                  ? "border-amber-400/70 bg-amber-500/20 text-amber-200"
                  : "border-slate-700 bg-slate-900 text-slate-200 hover:border-amber-500/50"
              }`}
            >
              <Zap className="h-4 w-4" /> Cas Penuh 100%
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs">
            <div>
              <div className="font-semibold text-slate-200">
                Simpan Permanen Saat Booting
              </div>
              <div className="text-[11px] text-slate-400">
                <code>/etc/modprobe.d/acer-wmi-battery.conf</code>
              </div>
            </div>
            <button
              type="button"
              disabled={batteryMutation.isPending}
              onClick={() =>
                batteryMutation.mutate({ persistBoot: !(bat?.persistBoot ?? false) })
              }
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                bat?.persistBoot
                  ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-200"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600"
              }`}
            >
              {bat?.persistBoot ? "Boot Auto ON" : "Aktifkan Boot"}
            </button>
          </div>
        </div>
      </div>

      {/* GPU Switcher Panel */}
      <div className="rounded-2xl border border-slate-800/90 bg-[#0d121c]/90 p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2">
              <Monitor className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                GPU Mode Switcher (EnvyControl)
              </h2>
              <p className="text-xs text-slate-400">
                Beralih antara AMD Radeon iGPU, Hybrid, atau NVIDIA RTX 3080 Mobile
              </p>
            </div>
          </div>
          <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase text-cyan-300">
            {gpu?.currentMode ?? "unknown"}
          </span>
        </div>

        {rebootBanner && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-500/50 bg-amber-950/40 px-3 py-2 text-xs text-amber-200">
            <RefreshCw className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              Mode GPU berhasil diubah! Silakan <strong>reboot laptop</strong> agar konfigurasi Xorg/Wayland & kernel aktif penuh.
            </span>
          </div>
        )}

        <div className="mt-4 space-y-2.5">
          {GPU_MODES.map((item) => {
            const isActive = gpu?.currentMode?.toLowerCase() === item.mode;
            return (
              <button
                key={item.mode}
                type="button"
                disabled={gpuMutation.isPending}
                onClick={() =>
                  gpuMutation.mutate(
                    { mode: item.mode },
                    { onSuccess: () => setRebootBanner(true) }
                  )
                }
                className={`w-full rounded-xl border p-3 text-left transition ${
                  isActive
                    ? "border-cyan-400/70 bg-cyan-500/15 shadow-sm shadow-cyan-500/10"
                    : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                } disabled:opacity-60`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{item.title}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isActive
                        ? "bg-cyan-400/20 text-cyan-200"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {isActive ? "Aktif" : item.badge}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{item.subtitle}</p>
              </button>
            );
          })}
        </div>

        {/* Hardware GPU Inventory */}
        <div className="mt-4 space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Cpu className="h-3.5 w-3.5 text-rose-400" /> Switcheroo & NVIDIA Telemetry
          </div>
          {(gpu?.devices ?? []).map((dev) => (
            <div
              key={dev.id}
              className="flex items-center justify-between gap-2 text-xs text-slate-300"
            >
              <span className="truncate">{dev.name}</span>
              <span className="shrink-0 rounded bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                {dev.isDiscrete ? "dGPU" : "iGPU"}
                {dev.isDefault ? " • Default" : ""}
              </span>
            </div>
          ))}
          {gpu?.nvidiaStats && (
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-2 text-[11px] text-emerald-300">
              <span>{gpu.nvidiaStats.name}</span>
              <span className="font-mono">
                {gpu.nvidiaStats.temperature}°C • Util {gpu.nvidiaStats.utilization}% • VRAM{" "}
                {gpu.nvidiaStats.memoryUsedMb}/{gpu.nvidiaStats.memoryTotalMb} MiB
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

