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
      <div className="rounded-2xl border border-slate-800/80 bg-[#0d121c]/90 p-4 shadow-lg">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">CPU Thermal & Load</p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-cyan-300">
                {cpuFan ? `${cpuFan.temperature.toFixed(1)}°C` : "--"}
              </span>
              <span className="text-xs text-slate-400">
                Load {telemetry?.system.cpuLoadPercent ?? 0}%
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-2">
            <Cpu className="h-4 w-4 text-cyan-400" />
          </div>
        </div>
        <MiniSparklineChart
          values={history.map((h) => h.cpuTemp)}
          color="#22d3ee"
          unit="°C"
          minFloor={30}
          maxCeil={95}
        />
      </div>

      {/* GPU Temp */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#0d121c]/90 p-4 shadow-lg">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">
              GPU Thermal ({telemetry?.gpu.currentMode.toUpperCase() ?? "HYBRID"})
            </p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-400">
                {gpuFan ? `${gpuFan.temperature.toFixed(1)}°C` : "--"}
              </span>
              {nvidiaTemp !== null && (
                <span className="text-xs text-emerald-400">
                  RTX: {nvidiaTemp}°C
                </span>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2">
            <Flame className="h-4 w-4 text-rose-400" />
          </div>
        </div>
        <MiniSparklineChart
          values={history.map((h) => h.gpuTemp)}
          color="#fb7185"
          unit="°C"
          minFloor={30}
          maxCeil={95}
        />
      </div>

      {/* Dual Fan RPM */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#0d121c]/90 p-4 shadow-lg">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Dual Fan Speed (L / R)</p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-300">
                {cpuFan ? `${cpuFan.rpm}` : "--"}
              </span>
              <span className="text-xs text-slate-400">
                / {gpuFan ? `${gpuFan.rpm} RPM` : "--"}
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2">
            <Fan className="h-4 w-4 text-amber-400" />
          </div>
        </div>
        <MiniSparklineChart
          values={history.map((h) => Math.max(h.cpuFanSpeed, h.gpuFanSpeed))}
          color="#fbbf24"
          unit="%"
          minFloor={0}
          maxCeil={100}
        />
      </div>

      {/* Memory & Battery */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#0d121c]/90 p-4 shadow-lg">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Memory & Battery</p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-violet-300">
                {telemetry ? `${telemetry.system.memoryUsedGb} GB` : "--"}
              </span>
              <span className="text-xs text-slate-400">
                / {telemetry?.system.memoryTotalGb ?? "--"} GB • Bat{" "}
                {telemetry?.battery.capacity ?? "--"}%
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 p-2">
            <MemoryStick className="h-4 w-4 text-violet-400" />
          </div>
        </div>
        <MiniSparklineChart
          values={history.map((h) => h.memPercent)}
          color="#a78bfa"
          unit="%"
          minFloor={0}
          maxCeil={100}
        />
      </div>
    </section>
  );
}

