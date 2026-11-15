"use client";

import { AlertTriangle, Check, Cpu, Fan, Gauge, Thermometer, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useFanControlMutation,
  useFanSensorMutation,
  useFanSensorsQuery,
} from "@/hooks/useAcerQueries";
import type { FanTelemetry, SensorAlgorithm, TelemetryResponse } from "@/lib/schemas";
import { useAcerStore } from "@/store/useAcerStore";
import { MiniSparklineChart } from "./MiniSparklineChart";

interface FanControlStudioProps {
  telemetry?: TelemetryResponse;
}

function getSpinDuration(speedPct: number, rpm = 0): string {
  if (rpm > 50) {
    // RPM-based duration: 1500 RPM -> ~1.4s, 3000 RPM -> ~0.7s, 5000+ RPM -> ~0.35s
    const sec = Math.max(0.3, Math.min(2.2, (3600 / Math.max(1200, rpm)) * 0.65));
    return `${sec.toFixed(2)}s`;
  }
  if (speedPct <= 1) return "0s";
  const clamped = Math.max(5, Math.min(100, speedPct));
  const seconds = 2.2 - (clamped / 100) * 1.85;
  return `${seconds.toFixed(2)}s`;
}

function getTempAccent(temp: number, isLight = false): {
  ring: string;
  text: string;
  glow: string;
  blade: string;
  badge: string;
} {
  if (temp >= 80) {
    return {
      ring: isLight ? "border-rose-400/90" : "border-rose-500/70",
      text: isLight ? "text-rose-600" : "text-rose-400",
      glow: isLight ? "shadow-[0_0_24px_rgba(244,63,94,0.22)]" : "shadow-[0_0_32px_rgba(244,63,94,0.32)] ring-1 ring-rose-500/40",
      blade: isLight ? "#e11d48" : "#fb7185",
      badge: "border-rose-500/40 bg-rose-500/15 text-rose-300",
    };
  }
  if (temp >= 62) {
    return {
      ring: isLight ? "border-amber-400/90" : "border-amber-500/70",
      text: isLight ? "text-amber-700" : "text-amber-300",
      glow: isLight ? "shadow-[0_0_22px_rgba(245,158,11,0.2)]" : "shadow-[0_0_28px_rgba(245,158,11,0.26)] ring-1 ring-amber-500/40",
      blade: isLight ? "#d97706" : "#fbbf24",
      badge: "border-amber-500/40 bg-amber-500/15 text-amber-300",
    };
  }
  return {
    ring: isLight ? "border-cyan-400/90" : "border-cyan-500/60",
    text: isLight ? "text-cyan-700" : "text-cyan-300",
    glow: isLight ? "shadow-[0_0_22px_rgba(14,165,233,0.2)]" : "shadow-[0_0_28px_rgba(34,211,238,0.25)] ring-1 ring-cyan-500/40",
    blade: isLight ? "#0891b2" : "#22d3ee",
    badge: "border-cyan-500/40 bg-cyan-500/15 text-cyan-300",
  };
}

/**
 * 3D AeroBlade Gaming Turbine SVG
 * Bilah aerodinamis futuristik khas Acer Predator/Nitro dengan center hub berventilasi
 */
function AnimatedTurbineSvg({
  speed,
  rpm = 0,
  color,
  side = "left",
  isLight = false,
}: {
  speed: number;
  rpm?: number;
  color: string;
  side?: "left" | "right";
  isLight?: boolean;
}) {
  const duration = getSpinDuration(speed, rpm);
  const isSpinning = (rpm > 50) || speed > 1;
  const isHighSpeed = speed >= 75 || rpm >= 3500;
  // 11 bilah melengkung tajam (AeroBlade 3D styling)
  const blades = [0, 32.7, 65.4, 98.1, 130.8, 163.5, 196.2, 228.9, 261.6, 294.3, 327];

  return (
    <div
      className={`relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
        isLight
          ? "border-slate-300 bg-gradient-to-br from-slate-100 via-white to-slate-200 shadow-md"
          : "border-slate-700/80 bg-gradient-to-br from-slate-900 via-[#070b14] to-slate-950 shadow-2xl"
      }`}
      style={{
        boxShadow: isSpinning
          ? `0 0 20px ${color}33, inset 0 0 12px ${color}22`
          : undefined,
      }}
    >
      {/* Outer Glow Halo saat Turbo / High Speed */}
      {isHighSpeed && (
        <span
          className="pointer-events-none absolute -inset-1 rounded-full animate-fan-pulse"
          style={{
            boxShadow: `0 0 24px ${color}66`,
            border: `1px solid ${color}88`,
          }}
        />
      )}

      {/* Turbine Shroud Rim with Ticks */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full pointer-events-none"
      >
        <circle
          cx="50"
          cy="50"
          r="47.5"
          fill="none"
          stroke={isLight ? "rgba(100,116,139,0.25)" : "rgba(148,163,184,0.18)"}
          strokeWidth="1.5"
          strokeDasharray="2 3"
        />
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke={color}
          strokeWidth="1"
          strokeOpacity={isSpinning ? "0.45" : "0.2"}
        />
      </svg>

      {/* Spinning Blades Assembly */}
      <svg
        viewBox="0 0 100 100"
        className={`h-24 w-24 ${isSpinning ? "animate-fan-spin" : ""}`}
        style={{
          animationDuration: isSpinning ? duration : undefined,
          transformOrigin: "50% 50%",
        }}
      >
        <defs>
          <linearGradient id={`blade-grad-${side}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.95" />
            <stop offset="60%" stopColor={color} stopOpacity="0.75" />
            <stop offset="100%" stopColor={isLight ? "#475569" : "#0f172a"} stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* 11 AeroBlade curved wings */}
        {blades.map((angle) => (
          <path
            key={angle}
            d="M50,50 C55,32 66,16 78,11 C68,7 54,12 46,24 C41,33 46,43 50,50 Z"
            fill={`url(#blade-grad-${side})`}
            transform={`rotate(${angle} 50 50)`}
          />
        ))}

        {/* Outer Hub Ring */}
        <circle
          cx="50"
          cy="50"
          r="13"
          fill={isLight ? "#e2e8f0" : "#0a0f1d"}
          stroke={color}
          strokeWidth="2"
        />

        {/* Center Metal Cap */}
        <circle
          cx="50"
          cy="50"
          r="7"
          fill={isLight ? "#f8fafc" : "#1e293b"}
          stroke={isLight ? "#cbd5e1" : "#334155"}
          strokeWidth="1"
        />

        {/* Center LED Dot */}
        <circle
          cx="50"
          cy="50"
          r="3"
          fill={color}
          className={isSpinning ? "animate-pulse" : ""}
        />
      </svg>

      {/* RPM Status Tag Overlay di Sudut Kiri Bawah Turbin */}
      <div className="pointer-events-none absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-mono font-bold text-white/90 backdrop-blur-xs">
        {rpm > 0 ? `${rpm}` : "0"}
      </div>
    </div>
  );
}

const SENSOR_CHOICES = [
  { value: "@CPU", label: "Default (@CPU / Profile)" },
  { value: "k10temp", label: "CPU AMD (k10temp)" },
  { value: "amdgpu", label: "iGPU AMD Radeon (amdgpu)" },
  { value: "nvidia-ml", label: "dGPU NVIDIA RTX (nvidia-ml)" },
  { value: "acpitz", label: "ACPI Thermal Zone (acpitz)" },
  { value: "nvme", label: "NVMe SSD (nvme)" },
];

export function FanControlStudio({ telemetry }: FanControlStudioProps) {
  const fanTarget = useAcerStore((s) => s.fanTarget);
  const setFanTarget = useAcerStore((s) => s.setFanTarget);
  const draftFanSpeed = useAcerStore((s) => s.draftFanSpeed);
  const setDraftFanSpeed = useAcerStore((s) => s.setDraftFanSpeed);
  const history = useAcerStore((s) => s.history);
  const theme = useAcerStore((s) => s.theme);
  const isLight = theme === "light";

  const fanMutation = useFanControlMutation();
  const sensorsQuery = useFanSensorsQuery();
  const sensorMutation = useFanSensorMutation();

  const [sensorDrafts, setSensorDrafts] = useState<
    Record<0 | 1, { sensor: string; algorithm: SensorAlgorithm }>
  >({
    0: { sensor: "k10temp", algorithm: "Average" },
    1: { sensor: "amdgpu", algorithm: "Average" },
  });

  useEffect(() => {
    if (!sensorsQuery.data?.mappings) return;
    setSensorDrafts((prev) => {
      const next = { ...prev };
      for (const m of sensorsQuery.data.mappings) {
        const idx = m.fanIndex;
        const firstSensor = m.sensors[0] || (idx === 0 ? "k10temp" : "amdgpu");
        const algo =
          m.algorithm === "Min" || m.algorithm === "Max" ? m.algorithm : "Average";
        next[idx] = {
          sensor: m.isDefaultSensors ? (idx === 0 ? "k10temp" : "amdgpu") : firstSensor,
          algorithm: algo,
        };
      }
      return next;
    });
  }, [sensorsQuery.data]);

  const fans: FanTelemetry[] = telemetry?.nbfc.fans ?? [];
  const leftFan = fans[0];
  const rightFan = fans[1];

  const availableMap = new Map(
    (sensorsQuery.data?.available ?? []).map((s) => [s.name, s])
  );

  const renderFanCard = (
    fan: FanTelemetry | undefined,
    index: 0 | 1,
    title: string,
    sideTag: string,
    targetKey: "cpu" | "gpu",
    seriesValues: number[],
    colorSide: "left" | "right"
  ) => {
    const temp = fan?.temperature ?? 0;
    const speed = fan?.currentSpeed ?? 0;
    const rpm = fan?.rpm ?? 0;
    const maxRpm = fan?.maxRpm ?? 6122;
    const rpmPct = Math.min(100, Math.round((rpm / maxRpm) * 100));
    const accent = getTempAccent(temp, isLight);
    const isSelected = fanTarget === targetKey || fanTarget === "both";
    const mapping = sensorsQuery.data?.mappings.find((m) => m.fanIndex === index);

    return (
      <div
        onClick={() => setFanTarget(targetKey)}
        className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-4.5 transition-all duration-300 shadow-xs ${
          isLight
            ? isSelected
              ? `bg-white ${accent.ring} ${accent.glow}`
              : "border-slate-200 bg-white hover:border-slate-300"
            : isSelected
              ? `bg-gradient-to-br from-[#0c1220] via-[#090d16] to-[#07090f] ${accent.ring} ${accent.glow}`
              : "border-slate-800/80 bg-[#0a0e17]/90 hover:border-slate-700/90"
        }`}
      >
        {/* Subtle Gaming Ambient Background Glow */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-35"
          style={{ backgroundColor: accent.blade }}
        />

        {/* Card Header */}
        <div className="relative flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-cyan-300">
                {sideTag}
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight dark:text-white">
                {title}
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Sensor aktif:{" "}
              <span className="font-mono font-medium text-cyan-700 dark:text-cyan-300">
                {mapping?.sensors.join(", ") ?? (index === 0 ? "k10temp" : "amdgpu")}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase ${
                fan?.autoControl
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300"
              }`}
            >
              {fan?.autoControl ? "AUTO CURVE" : "MANUAL"}
            </span>
          </div>
        </div>

        {/* Turbine and Stats Grid */}
        <div className="relative mt-4 flex items-center gap-4">
          <AnimatedTurbineSvg
            speed={speed}
            rpm={rpm}
            color={accent.blade}
            side={colorSide}
            isLight={isLight}
          />

          <div className="grid flex-1 grid-cols-2 gap-2 text-xs">
            {/* Suhu Gauge */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 dark:border-slate-800/80 dark:bg-slate-950/70">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <Thermometer className="h-3.5 w-3.5" /> Suhu
              </div>
              <div className={`mt-0.5 font-mono text-xl font-extrabold ${accent.text}`}>
                {fan ? `${fan.temperature.toFixed(1)}°C` : "--"}
              </div>
            </div>

            {/* RPM Gauge */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 dark:border-slate-800/80 dark:bg-slate-950/70">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <Gauge className="h-3.5 w-3.5" /> RPM
              </div>
              <div className="mt-0.5 font-mono text-xl font-extrabold text-slate-900 dark:text-white">
                {fan && fan.rpm > 0 ? fan.rpm : "--"}
              </div>
            </div>

            {/* Kecepatan Aktual */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 dark:border-slate-800/80 dark:bg-slate-950/70">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Kecepatan Aktual</div>
              <div className="mt-0.5 font-mono text-sm font-bold text-slate-800 dark:text-slate-100">
                {fan ? `${fan.currentSpeed.toFixed(1)}%` : "--"}
              </div>
            </div>

            {/* Target EC */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 dark:border-slate-800/80 dark:bg-slate-950/70">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Target EC</div>
              <div className="mt-0.5 font-mono text-sm font-bold text-cyan-700 dark:text-cyan-300">
                {fan ? `${fan.targetSpeed.toFixed(0)}%` : "--"}
              </div>
            </div>
          </div>
        </div>

        {/* RPM Speed Progress Bar (Gaming Meter) */}
        <div className="relative mt-3.5">
          <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-1">
            <span>Power Output ({rpmPct}%)</span>
            <span>{rpm} / {maxRpm} RPM</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800/80">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${rpmPct}%`,
                background: `linear-gradient(90deg, ${accent.blade}88, ${accent.blade})`,
              }}
            />
          </div>
        </div>

        {/* Mini Sparkline Chart */}
        <div className="relative mt-3">
          <MiniSparklineChart
            values={seriesValues}
            color={accent.blade}
            height={44}
            unit="%"
            minFloor={0}
            maxCeil={100}
          />
        </div>
      </div>
    );
  };

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-colors duration-200 dark:border-slate-800/90 dark:bg-[#0d121c]/90 dark:shadow-xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-50 p-2 text-cyan-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-400">
            <Fan className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Dual Fan Control &amp; Temperature Studio
              </h2>
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                AeroBlade 3D
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Atur kipas kiri (CPU), kipas kanan (GPU), atau keduanya secara independen beserta sumber sensor suhu NBFC
            </p>
          </div>
        </div>

        {/* Target Switcher: Left / Both / Right */}
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100/90 p-1 text-xs font-semibold shadow-2xs dark:border-slate-800 dark:bg-slate-950/80">
          {([
            ["cpu", "Kiri Saja (CPU #0)"],
            ["both", "Keduanya (Sync)"],
            ["gpu", "Kanan Saja (GPU #1)"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFanTarget(key)}
              className={`rounded-lg px-3 py-1.5 transition ${
                fanTarget === key
                  ? "bg-white text-cyan-800 font-semibold shadow-xs ring-1 ring-cyan-500/40 dark:bg-cyan-500/20 dark:text-cyan-200 dark:ring-cyan-500/50"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Animated Left & Right Turbine Cards */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {renderFanCard(
          leftFan,
          0,
          "CPU Cooling Fan",
          "KIRI / FAN #0",
          "cpu",
          history.map((h) => h.cpuFanSpeed),
          "left"
        )}
        {renderFanCard(
          rightFan,
          1,
          "GPU Cooling Fan",
          "KANAN / FAN #1",
          "gpu",
          history.map((h) => h.gpuFanSpeed),
          "right"
        )}
      </div>

      {/* Speed & Mode Controls (Gaming Cockpit Bar) */}
      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800/80 dark:bg-slate-950/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Auto Curve Preset */}
            <button
              type="button"
              disabled={fanMutation.isPending}
              onClick={() => fanMutation.mutate({ target: fanTarget, mode: "auto" })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-2xs transition hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/25"
            >
              <Check className="h-3.5 w-3.5" /> Auto Curve
            </button>

            {/* Stepped Presets */}
            {[
              { label: "Silent 35%", speed: 35 },
              { label: "Balanced 60%", speed: 60 },
              { label: "Gaming 85%", speed: 85 },
            ].map((preset) => (
              <button
                key={preset.speed}
                type="button"
                disabled={fanMutation.isPending}
                onClick={() => {
                  setDraftFanSpeed(preset.speed);
                  fanMutation.mutate({
                    target: fanTarget,
                    mode: "manual",
                    speed: preset.speed,
                  });
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:border-cyan-500 hover:text-cyan-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-500/50 dark:hover:text-cyan-200"
              >
                {preset.label}
              </button>
            ))}

            {/* Max Turbo Preset with Pulsing Crimson Glow */}
            <button
              type="button"
              disabled={fanMutation.isPending}
              onClick={() => {
                setDraftFanSpeed(100);
                fanMutation.mutate({ target: fanTarget, mode: "max" });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-800 shadow-sm transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-500/70 dark:bg-rose-500/20 dark:text-rose-200 dark:hover:bg-rose-500/30 ring-1 ring-rose-500/30"
            >
              <Zap className="h-3.5 w-3.5 animate-pulse text-rose-500 dark:text-rose-400" /> Max Turbo 100%
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Target Aktif:{" "}
              <strong className="text-cyan-700 dark:text-cyan-300">
                {fanTarget === "cpu"
                  ? "Kipas Kiri (CPU)"
                  : fanTarget === "gpu"
                    ? "Kipas Kanan (GPU)"
                    : "Keduanya (Sync)"}
              </strong>
            </span>
          </div>
        </div>

        {/* Custom Speed Slider */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[220px]">
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Kecepatan Manual Kustom</span>
              <span className="font-mono font-bold text-cyan-700 dark:text-cyan-300">{draftFanSpeed}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={draftFanSpeed}
              onChange={(e) => setDraftFanSpeed(Number(e.target.value))}
              className="w-full accent-cyan-600 dark:accent-cyan-400"
            />
          </div>
          <button
            type="button"
            disabled={fanMutation.isPending}
            onClick={() =>
              fanMutation.mutate({
                target: fanTarget,
                mode: "manual",
                speed: draftFanSpeed,
              })
            }
            className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-cyan-500 disabled:opacity-50 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
          >
            {fanMutation.isPending ? "Menerapkan..." : `Set ${draftFanSpeed}%`}
          </button>
        </div>
      </div>

      {/* Per-Fan Temperature Sensor Source Configurator */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800/80 dark:bg-slate-950/60">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Konfigurasi Sumber Sensor Suhu Kipas (NBFC Sensors)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Pilih acuan sensor: CPU (<code>k10temp</code>), AMD iGPU (<code>amdgpu</code>), NVIDIA (<code>nvidia-ml</code>), atau ACPI
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {([
            [0, "Fan #0 — Kiri (CPU Fan)"],
            [1, "Fan #1 — Kanan (GPU Fan)"],
          ] as const).map(([fanIdx, label]) => {
            const draft = sensorDrafts[fanIdx];
            const nvidiaEntry = availableMap.get("nvidia-ml");
            const nvidiaInactive =
              draft.sensor === "nvidia-ml" && (!nvidiaEntry || !nvidiaEntry.active);

            return (
              <div
                key={fanIdx}
                className="rounded-xl border border-slate-200 bg-white p-3 space-y-2.5 shadow-2xs dark:border-slate-800 dark:bg-[#0b1019]"
              >
                <div className="text-xs font-semibold text-slate-900 dark:text-white">{label}</div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <select
                    value={draft.sensor}
                    onChange={(e) =>
                      setSensorDrafts((prev) => ({
                        ...prev,
                        [fanIdx]: { ...prev[fanIdx], sensor: e.target.value },
                      }))
                    }
                    className="sm:col-span-2 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 focus:border-cyan-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {SENSOR_CHOICES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={draft.algorithm}
                    onChange={(e) =>
                      setSensorDrafts((prev) => ({
                        ...prev,
                        [fanIdx]: {
                          ...prev[fanIdx],
                          algorithm: e.target.value as SensorAlgorithm,
                        },
                      }))
                    }
                    className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 focus:border-cyan-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="Average">Average</option>
                    <option value="Min">Min</option>
                    <option value="Max">Max</option>
                  </select>
                </div>

                {nvidiaInactive && (
                  <div className="flex items-start gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>
                      <code>nvidia-ml</code> sedang <code>none</code> (dGPU sleep di mode Hybrid/Integrated).
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {availableMap.get(draft.sensor)?.active
                      ? `Sensor terdeteksi (${availableMap.get(draft.sensor)?.paths.length ?? 1} node)`
                      : draft.sensor === "@CPU" || draft.sensor === "k10temp"
                        ? "Sensor aktif (k10temp)"
                        : "Sensor custom / fallback"}
                  </span>
                  <button
                    type="button"
                    disabled={sensorMutation.isPending}
                    onClick={() =>
                      sensorMutation.mutate({
                        fanIndex: fanIdx,
                        sensors: [draft.sensor],
                        algorithm: draft.algorithm,
                        force: true,
                      })
                    }
                    className="rounded-lg border border-cyan-500/30 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800 shadow-2xs transition hover:bg-cyan-100 disabled:opacity-50 dark:border-cyan-500/40 dark:bg-cyan-500/15 dark:text-cyan-200 dark:hover:bg-cyan-500/25"
                  >
                    {sensorMutation.isPending ? "Menyimpan..." : "Terapkan Sensor"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
