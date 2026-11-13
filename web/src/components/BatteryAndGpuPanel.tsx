"use client";

import {
  BatteryCharging,
  Clock,
  Cpu,
  Loader2,
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
  const statusNorm = (bat?.status ?? "").toLowerCase();
  const isCharging = statusNorm === "charging";
  const isDischarging = statusNorm === "discharging";

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Battery Care Panel */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-colors duration-200 dark:border-slate-800/90 dark:bg-[#0d121c]/90 dark:shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-50 p-2 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
              <BatteryCharging className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Battery Care & Charge Limit
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Driver <code>acer_wmi_battery</code> — proteksi baterai cut-off 80%
              </p>
            </div>
          </div>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${healthActive
              ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300"
              }`}
          >
            {healthActive ? "80% LIMIT ON" : "100% FULL"}
          </span>
        </div>

        {/* Battery Visual Gauge */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/70">
          <div className="mb-2 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {bat?.capacity !== null && bat?.capacity !== undefined
                  ? `${bat.capacity}%`
                  : "--"}
              </span>
              <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                {bat?.status ?? "Unknown"}
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Suhu Baterai:{" "}
              <strong className="text-cyan-700 dark:text-cyan-300">
                {bat?.temperature !== null && bat?.temperature !== undefined
                  ? `${bat.temperature}°C`
                  : "N/A"}
              </strong>
            </div>
          </div>

          <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-200 ring-1 ring-slate-300 dark:bg-slate-900 dark:ring-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${healthActive
                ? "bg-gradient-to-r from-emerald-500 to-cyan-500"
                : "bg-gradient-to-r from-amber-500 to-emerald-500"
                }`}
              style={{ width: `${Math.max(4, Math.min(100, capacity))}%` }}
            />
            {/* 80% limit marker */}
            <div
              title="Batas Cut-Off 80%"
              className="absolute inset-y-0 left-[80%] w-0.5 bg-slate-900/60 dark:bg-white/70"
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-500">
            <span>0%</span>
            <span className="font-medium text-emerald-700 dark:text-emerald-400">80% Cut-Off</span>
            <span>100%</span>
          </div>

          {/* Real-time Charging / Discharging Estimation Card */}
          <div className="mt-3.5 rounded-xl border border-slate-200/80 bg-slate-100/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-900/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {isCharging ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                    <Zap className="h-4 w-4 animate-pulse" />
                  </div>
                ) : isDischarging ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                    <Clock className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                )}
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {isCharging
                      ? `Estimasi Pengisian (Target ${bat?.targetPercent ?? (healthActive ? 80 : 100)}%)`
                      : isDischarging
                        ? "Estimasi Penggunaan Baterai"
                        : "Status Daya AC"}
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {bat?.estimateFormatted ??
                      (isCharging
                        ? "Menghitung pengisian..."
                        : isDischarging
                          ? "Menghitung sisa waktu..."
                          : bat?.status ?? "--")}
                  </div>
                </div>
              </div>

              {/* Power Rate Badge */}
              {bat?.powerWatts !== null && bat?.powerWatts !== undefined && (
                <div className="text-right">
                  <span className="text-[10px] text-slate-400">Laju Daya</span>
                  <div
                    className={`font-mono text-xs font-bold ${isDischarging
                      ? "text-amber-600 dark:text-amber-400"
                      : isCharging
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-cyan-600 dark:text-cyan-400"
                      }`}
                  >
                    {isDischarging ? "-" : "+"}
                    {bat.powerWatts} W
                  </div>
                </div>
              )}
            </div>

            {/* Secondary Estimations breakdown saat Charging */}
            {isCharging && (
              <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-slate-200/80 pt-2.5 text-xs dark:border-slate-800/60">
                <div className="flex items-center justify-between rounded-lg bg-white/80 px-2.5 py-1.5 shadow-2xs dark:bg-slate-950/60">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Batas 80% (Cut-Off):
                  </span>
                  <span
                    className={`text-[11px] font-semibold ${capacity >= 80
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-800 dark:text-slate-200"
                      }`}
                  >
                    {capacity >= 80
                      ? "Tercapai ✓"
                      : bat?.timeTo80Minutes !== null && bat?.timeTo80Minutes !== undefined
                        ? `~${bat.timeTo80Minutes} mnt`
                        : "--"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white/80 px-2.5 py-1.5 shadow-2xs dark:bg-slate-950/60">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Penuh 100%:
                  </span>
                  <span
                    className={`text-[11px] font-semibold ${capacity >= 100
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-300"
                      }`}
                  >
                    {capacity >= 100
                      ? "Penuh ✓"
                      : bat?.timeToFullMinutes !== null && bat?.timeToFullMinutes !== undefined
                        ? `~${bat.timeToFullMinutes} mnt`
                        : "--"}
                  </span>
                </div>
              </div>
            )}

            {/* Sisa Waktu Breakdown saat Discharging */}
            {isDischarging &&
              bat?.timeToEmptyMinutes !== null &&
              bat?.timeToEmptyMinutes !== undefined && (
                <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/80 pt-2 text-xs dark:border-slate-800/60">
                  <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <Clock className="h-3 w-3 text-amber-500 dark:text-amber-400" /> Sisa Waktu Siap Pakai:
                  </span>
                  <span className="font-semibold text-amber-600 dark:text-amber-300">
                    {Math.floor(bat.timeToEmptyMinutes / 60)}j {bat.timeToEmptyMinutes % 60}m
                  </span>
                </div>
              )}
          </div>

          {/* Battery Mini Telemetry Metrics Grid */}
          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded-lg border border-slate-200 bg-white/70 p-2 shadow-2xs dark:border-slate-800/70 dark:bg-slate-950/60">
              <span className="block text-[10px] text-slate-400">Tegangan</span>
              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                {bat?.voltageVolts !== null && bat?.voltageVolts !== undefined
                  ? `${bat.voltageVolts} V`
                  : "--"}
              </span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white/70 p-2 shadow-2xs dark:border-slate-800/70 dark:bg-slate-950/60">
              <span className="block text-[10px] text-slate-400">Arus</span>
              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                {bat?.currentAmps !== null && bat?.currentAmps !== undefined
                  ? `${Math.round(bat.currentAmps * 1000)} mA`
                  : "--"}
              </span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white/70 p-2 shadow-2xs dark:border-slate-800/70 dark:bg-slate-950/60">
              <span className="block text-[10px] text-slate-400">Daya</span>
              <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                {bat?.powerWatts !== null && bat?.powerWatts !== undefined
                  ? `${bat.powerWatts} W`
                  : "--"}
              </span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white/70 p-2 shadow-2xs dark:border-slate-800/70 dark:bg-slate-950/60">
              <span className="block text-[10px] text-slate-400">Kesehatan</span>
              <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {bat?.healthPercent !== null && bat?.healthPercent !== undefined
                  ? `${bat.healthPercent}%`
                  : "--"}
              </span>
            </div>
          </div>
        </div>

        {/* Battery Controls */}
        <div className="mt-4 space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={batteryMutation.isPending}
              onClick={() => batteryMutation.mutate({ healthMode: true })}
              className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition shadow-2xs ${healthActive
                ? "border-emerald-400/80 bg-emerald-50 text-emerald-800 dark:border-emerald-400/70 dark:bg-emerald-500/20 dark:text-emerald-200"
                : "border-slate-200 bg-white text-slate-700 hover:border-emerald-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-500/50"
                }`}
            >
              <ShieldCheck className="h-4 w-4" /> Aktifkan Limit 80%
            </button>
            <button
              type="button"
              disabled={batteryMutation.isPending}
              onClick={() => batteryMutation.mutate({ healthMode: false })}
              className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition shadow-2xs ${bat?.healthMode === false
                ? "border-amber-400/80 bg-amber-50 text-amber-800 dark:border-amber-400/70 dark:bg-amber-500/20 dark:text-amber-200"
                : "border-slate-200 bg-white text-slate-700 hover:border-amber-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-amber-500/50"
                }`}
            >
              <Zap className="h-4 w-4" /> Cas Penuh 100%
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-950/60">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Simpan Permanen Saat Booting
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                <code>/etc/modprobe.d/acer-wmi-battery.conf</code>
              </div>
            </div>
            <button
              type="button"
              disabled={batteryMutation.isPending}
              onClick={() =>
                batteryMutation.mutate({ persistBoot: !(bat?.persistBoot ?? false) })
              }
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold shadow-2xs transition ${bat?.persistBoot
                ? "border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-500/20 dark:text-emerald-200"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600"
                }`}
            >
              {bat?.persistBoot ? "Boot Auto ON" : "Aktifkan Boot"}
            </button>
          </div>
        </div>
      </div>

      {/* GPU Switcher Panel */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-colors duration-200 dark:border-slate-800/90 dark:bg-[#0d121c]/90 dark:shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-rose-500/20 bg-rose-50 p-2 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                GPU Mode Switcher (EnvyControl)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Beralih antara AMD Radeon iGPU, Hybrid, atau NVIDIA RTX 3080 Mobile
              </p>
            </div>
          </div>
          <span className="rounded-full border border-cyan-500/30 bg-cyan-50 px-2.5 py-0.5 text-[11px] font-bold uppercase text-cyan-800 dark:border-cyan-500/40 dark:bg-cyan-500/10 dark:text-cyan-300">
            {gpu?.currentMode ?? "unknown"}
          </span>
        </div>

        {rebootBanner && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 shadow-xs dark:border-amber-500/50 dark:bg-amber-950/40 dark:text-amber-200">
            <RefreshCw className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              Mode GPU berhasil diubah! Silakan <strong>reboot laptop</strong> agar konfigurasi Xorg/Wayland & kernel aktif penuh.
            </span>
          </div>
        )}

        {gpuMutation.isPending && (
          <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-blue-300 bg-blue-50 px-3 py-2.5 text-xs text-blue-800 shadow-xs dark:border-blue-500/50 dark:bg-blue-950/40 dark:text-blue-200">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600 dark:text-blue-400" />
            <span>
              Mengganti mode GPU… Rebuilding initramfs, harap tunggu <strong>~30–60 detik</strong>. Jangan tutup halaman ini.
            </span>
          </div>
        )}

        <div className="mt-4 space-y-2.5">
          {GPU_MODES.map((item) => {
            const isActive = gpu?.currentMode?.toLowerCase() === item.mode;
            const isSwitching = gpuMutation.isPending && gpuMutation.variables?.mode === item.mode;
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
                className={`w-full rounded-xl border p-3 text-left transition ${isActive
                  ? "border-cyan-500 bg-cyan-50/80 shadow-xs ring-1 ring-cyan-500/40 dark:border-cyan-400/70 dark:bg-cyan-500/15 dark:shadow-cyan-500/10 dark:ring-0"
                  : "border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-100/60 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-slate-700"
                  } disabled:opacity-60`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                    {isSwitching && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500 dark:text-blue-400" />
                    )}
                    {item.title}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isSwitching
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-400/20 dark:text-blue-200"
                      : isActive
                        ? "bg-cyan-100 text-cyan-800 font-semibold dark:bg-cyan-400/20 dark:text-cyan-200"
                        : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                  >
                    {isSwitching ? "Mengganti…" : isActive ? "Aktif" : item.badge}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{item.subtitle}</p>
              </button>
            );
          })}
        </div>

        {/* Hardware GPU Inventory */}
        <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            <Cpu className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" /> Switcheroo & NVIDIA Telemetry
          </div>
          {(gpu?.devices ?? []).map((dev) => (
            <div
              key={dev.id}
              className="flex items-center justify-between gap-2 text-xs text-slate-800 dark:text-slate-300"
            >
              <span className="truncate">{dev.name}</span>
              <span className="shrink-0 rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-400">
                {dev.isDiscrete ? "dGPU" : "iGPU"}
                {dev.isDefault ? " • Default" : ""}
              </span>
            </div>
          ))}
          {gpu?.nvidiaStats && (
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-2 text-[11px] text-emerald-700 dark:border-slate-800/80 dark:text-emerald-300">
              <span className="font-medium">{gpu.nvidiaStats.name}</span>
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

