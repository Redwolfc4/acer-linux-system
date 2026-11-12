"use client";

import { useId } from "react";

interface MiniSparklineChartProps {
  values: number[];
  color?: string;
  height?: number;
  unit?: string;
  minFloor?: number;
  maxCeil?: number;
}

export function MiniSparklineChart({
  values,
  color = "#22d3ee",
  height = 56,
  unit = "",
  minFloor,
  maxCeil,
}: MiniSparklineChartProps) {
  const gradId = useId().replace(/:/g, "");
  const width = 220;

  if (values.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-slate-800/70 bg-slate-950/40 text-xs text-slate-500"
        style={{ height }}
      >
        Menunggu data telemetry...
      </div>
    );
  }

  const series = values.length === 1 ? [values[0], values[0]] : values;
  const rawMin = Math.min(...series);
  const rawMax = Math.max(...series);
  const min = minFloor !== undefined ? Math.min(minFloor, rawMin) : rawMin;
  const max = maxCeil !== undefined ? Math.max(maxCeil, rawMax) : rawMax;
  const span = max - min || 1;

  const padX = 4;
  const padY = 6;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const points = series.map((v, i) => {
    const x = padX + (i / (series.length - 1)) * innerW;
    const y = padY + innerH - ((v - min) / span) * innerH;
    return { x, y };
  });

  const linePath = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${height} L${points[0].x.toFixed(1)},${height} Z`;
  const lastPoint = points[points.length - 1];
  const latest = series[series.length - 1];

  return (
    <div className="space-y-1">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible rounded-lg border border-slate-800/60 bg-slate-950/50"
        style={{ height }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.38" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="3.2"
          fill={color}
          stroke="#07090f"
          strokeWidth="1.5"
        />
      </svg>
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>
          Min: <strong className="text-slate-300">{rawMin.toFixed(0)}{unit}</strong>
        </span>
        <span>
          Now: <strong style={{ color }}>{latest.toFixed(1)}{unit}</strong>
        </span>
        <span>
          Max: <strong className="text-slate-300">{rawMax.toFixed(0)}{unit}</strong>
        </span>
      </div>
    </div>
  );
}

