"use client";

import { Cpu, Flame, MemoryStick, Monitor } from "lucide-react";
import type { TelemetryResponse } from "@/lib/schemas";
import { useAcerStore } from "@/store/useAcerStore";
import { MiniSparklineChart } from "./MiniSparklineChart";

interface KpiMetricsGridProps {
  telemetry?: TelemetryResponse;
}

export function KpiMetricsGrid({ telemetry }: KpiMetricsGridProps) {
  const history = useAcerStore((s) => s.history);

  const cpuFan = telemetry?.nbfc.fans[0];
  const gpuFan = telemetry?.nbfc.fans[1];
  const nvidia = telemetry?.gpu.nvidiaStats;
  const amd = telemetry?.gpu.amdStats;
  const gpuMode = telemetry?.gpu.currentMode?.toLowerCase() ?? "hybrid";
  const isNvidiaActive = !!nvidia;

  // NVIDIA VRAM calculations
  const nvidiaMemUsedGb =
    nvidia ? Math.round((nvidia.memoryUsedMb / 1024) * 10) / 10 : null;
  const nvidiaMemTotalGb =
    nvidia ? Math.round(nvidia.memoryTotalMb / 1024) : null;
  const nvidiaMemPct =
    nvidia && nvidia.memoryTotalMb > 0
      ? Math.round((nvidia.memoryUsedMb / nvidia.memoryTotalMb) * 100)
      : null;

  // AMD VRAM calculations (VRAM = dedicated sysfs, GTT = system RAM shared)
  const amdVramUsedMb = amd?.vramUsedMb ?? null;
  const amdVramTotalMb = amd?.vramTotalMb ?? null;
  const amdGttUsedMb = amd?.gttUsedMb ?? null;
  const amdVramPct =
    amd && amd.vramTotalMb > 0
      ? Math.round((amd.vramUsedMb / amd.vramTotalMb) * 100)
      : null;
  const fmtMb = (mb: number | null) =>
    mb === null ? "--" : mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

      {/* ── 1. CPU Thermal & Load ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-colors duration-200 dark:border-slate-800/80 dark:bg-[#0d121c]/90 dark:shadow-lg">
        <div className="mb-3 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">CPU Thermal &amp; Load</p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                {cpuFan ? `${cpuFan.temperature.toFixed(1)}°C` : "--"}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Load {telemetry?.system.cpuLoadPercent ?? 0}%
              </span>
            </div>
          </div>
          <div className="shrink-0 rounded-lg border border-cyan-500/20 bg-cyan-50 p-2 text-cyan-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-400">
            <Cpu className="h-4 w-4" />
          </div>
        </div>
        <MiniSparklineChart
          values={history.map((h) => h.cpuTemp)}
          color="#22d3ee"
          lightColor="#0891b2"
          unit="°C"
          minFloor={30}
          maxCeil={95}
        />
      </div>

      {/* ── 2. AMD iGPU Thermal & VRAM ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-colors duration-200 dark:border-slate-800/80 dark:bg-[#0d121c]/90 dark:shadow-lg">
        <div className="mb-3 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              GPU Thermal
              <span className="ml-1 rounded bg-slate-100 px-1 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {gpuMode}
              </span>
            </p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {gpuFan ? `${gpuFan.temperature.toFixed(1)}°C` : "--"}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                AMD Radeon
              </span>
            </div>
            {/* AMD fan speed + VRAM pills */}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md border border-rose-200/70 bg-rose-50/60 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 backdrop-blur-sm dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                Fan {gpuFan ? `${gpuFan.currentSpeed}%` : "--"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-slate-200/70 bg-slate-50/60 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 backdrop-blur-sm dark:border-slate-700/40 dark:bg-slate-800/50 dark:text-slate-400">
                {gpuFan ? `${gpuFan.rpm} RPM` : "--"}
              </span>
              {amdVramUsedMb !== null && (
                <span className="inline-flex items-center gap-1 rounded-md border border-orange-200/70 bg-orange-50/60 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700 backdrop-blur-sm dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300">
                  VRAM {fmtMb(amdVramUsedMb)}/{fmtMb(amdVramTotalMb)}
                </span>
              )}
              {amdGttUsedMb !== null && (
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-200/70 bg-amber-50/60 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 backdrop-blur-sm dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                  GTT {fmtMb(amdGttUsedMb)}
                </span>
              )}
            </div>
            {/* AMD VRAM progress bar */}
            {amdVramPct !== null && (
              <div className="mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-rose-400 transition-all duration-500"
                    style={{ width: `${amdVramPct}%` }}
                  />
                </div>
                <div className="mt-0.5 flex justify-between text-[10px] text-slate-500 dark:text-slate-500">
                  <span>VRAM {amdVramPct}%</span>
                  <span>{fmtMb(amdVramTotalMb)}</span>
                </div>
              </div>
            )}
          </div>
          <div className="shrink-0 rounded-lg border border-rose-500/20 bg-rose-50 p-2 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
            <Flame className="h-4 w-4" />
          </div>
        </div>
        <MiniSparklineChart
          values={history.map((h) => h.gpuTemp)}
          color="#fb7185"
          lightColor="#e11d48"
          unit="°C"
          minFloor={30}
          maxCeil={95}
        />
      </div>

      {/* ── 3. NVIDIA dGPU Thermal & VRAM (Combined) ── */}
      <div className={`rounded-2xl border p-4 shadow-xs transition-colors duration-200 dark:shadow-lg ${
        isNvidiaActive
          ? "border-emerald-200/80 bg-white dark:border-emerald-500/20 dark:bg-[#0d121c]/90"
          : "border-slate-200/90 bg-white dark:border-slate-800/80 dark:bg-[#0d121c]/90"
      }`}>
        <div className="mb-3 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              NVIDIA RTX
              <span className={`ml-1 rounded px-1 py-0.5 text-[10px] font-bold uppercase ${
                isNvidiaActive
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500"
              }`}>
                {isNvidiaActive ? "Active" : "Offline"}
              </span>
            </p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {nvidia ? `${nvidia.temperature}°C` : "--"}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {nvidia ? `${nvidia.utilization}% util` : "RTX Offline"}
              </span>
            </div>
            {/* NVIDIA util + VRAM pills */}
            {isNvidiaActive ? (
              <>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200/70 bg-emerald-50/60 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 backdrop-blur-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                    GPU {nvidia.utilization}%
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-violet-200/70 bg-violet-50/60 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700 backdrop-blur-sm dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                    VRAM {nvidiaMemUsedGb}/{nvidiaMemTotalGb} GB
                  </span>
                </div>
                {/* NVIDIA VRAM progress bar */}
                {nvidiaMemPct !== null && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-violet-500 transition-all duration-500"
                        style={{ width: `${nvidiaMemPct}%` }}
                      />
                    </div>
                    <div className="mt-0.5 flex justify-between text-[10px] text-slate-500 dark:text-slate-500">
                      <span>VRAM {nvidiaMemPct}%</span>
                      <span>{nvidiaMemTotalGb} GB</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                dGPU dimatikan untuk hemat baterai
              </div>
            )}
          </div>
          <div className={`shrink-0 rounded-lg border p-2 ${
            isNvidiaActive
              ? "border-emerald-500/20 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
          }`}>
            <Monitor className="h-4 w-4" />
          </div>
        </div>
        <MiniSparklineChart
          values={history.map((h) => h.nvidiaTemp ?? 0)}
          color="#10b981"
          lightColor="#059669"
          unit="°C"
          minFloor={30}
          maxCeil={95}
        />
      </div>

      {/* ── 4. Memory & Battery ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-colors duration-200 dark:border-slate-800/80 dark:bg-[#0d121c]/90 dark:shadow-lg">
        <div className="mb-3 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Memory &amp; Battery</p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                {telemetry ? `${telemetry.system.memoryUsedGb} GB` : "--"}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                / {telemetry?.system.memoryTotalGb ?? "--"} GB • Bat{" "}
                {telemetry?.battery.capacity ?? "--"}%
              </span>
            </div>
          </div>
          <div className="shrink-0 rounded-lg border border-violet-500/20 bg-violet-50 p-2 text-violet-600 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-400">
            <MemoryStick className="h-4 w-4" />
          </div>
        </div>
        <MiniSparklineChart
          values={history.map((h) => h.memPercent)}
          color="#a78bfa"
          lightColor="#7c3aed"
          unit="%"
          minFloor={0}
          maxCeil={100}
        />
      </div>

    </section>
  );
}
