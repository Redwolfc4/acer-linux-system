"use client";

import { Cpu, Fan, Flame, MemoryStick } from "lucide-react";
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
  const nvidiaTemp = telemetry?.gpu.nvidiaStats?.temperature ?? null;

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* CPU Temp & Load */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-colors duration-200 dark:border-slate-800/80 dark:bg-[#0d121c]/90 dark:shadow-lg">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">CPU Thermal & Load</p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                {cpuFan ? `${cpuFan.temperature.toFixed(1)}°C` : "--"}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Load {telemetry?.system.cpuLoadPercent ?? 0}%
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-cyan-500/20 bg-cyan-50 p-2 text-cyan-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-400">
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

      {/* GPU Temp */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-colors duration-200 dark:border-slate-800/80 dark:bg-[#0d121c]/90 dark:shadow-lg">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              GPU Thermal ({telemetry?.gpu.currentMode.toUpperCase() ?? "HYBRID"})
            </p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {gpuFan ? `${gpuFan.temperature.toFixed(1)}°C` : "--"}
              </span>
              {nvidiaTemp !== null && (
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  RTX: {nvidiaTemp}°C
                </span>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-rose-500/20 bg-rose-50 p-2 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
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

      {/* Dual Fan RPM */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-colors duration-200 dark:border-slate-800/80 dark:bg-[#0d121c]/90 dark:shadow-lg">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Dual Fan Speed (L / R)</p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {cpuFan ? `${cpuFan.rpm}` : "--"}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                / {gpuFan ? `${gpuFan.rpm} RPM` : "--"}
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-50 p-2 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
            <Fan className="h-4 w-4" />
          </div>
        </div>
        <MiniSparklineChart
          values={history.map((h) => Math.max(h.cpuFanSpeed, h.gpuFanSpeed))}
          color="#fbbf24"
          lightColor="#d97706"
          unit="%"
          minFloor={0}
          maxCeil={100}
        />
      </div>

      {/* Memory & Battery */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-colors duration-200 dark:border-slate-800/80 dark:bg-[#0d121c]/90 dark:shadow-lg">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Memory & Battery</p>
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
          <div className="rounded-lg border border-violet-500/20 bg-violet-50 p-2 text-violet-600 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-400">
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

