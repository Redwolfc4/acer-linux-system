"use client";

import { create } from "zustand";
import type { FanTarget, RgbMode, TelemetryResponse } from "@/lib/schemas";

export interface TelemetrySample {
  timestamp: number;
  cpuTemp: number;
  gpuTemp: number;
  nvidiaTemp: number | null;
  cpuFanSpeed: number;
  gpuFanSpeed: number;
  cpuRpm: number;
  gpuRpm: number;
  cpuLoad: number;
  memPercent: number;
  batteryTemp: number | null;
}

export type DashboardTab = "all" | "fans" | "rgb" | "power" | "git";
export type ThemeMode = "dark" | "light";

export interface ToastMessage {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

interface AcerStoreState {
  history: TelemetrySample[];
  pushTelemetrySample: (t: TelemetryResponse) => void;

  fanTarget: FanTarget;
  setFanTarget: (target: FanTarget) => void;
  draftFanSpeed: number;
  setDraftFanSpeed: (speed: number) => void;

  rgbMode: RgbMode;
  setRgbMode: (mode: RgbMode) => void;
  selectedZone: "all" | 1 | 2 | 3 | 4;
  setSelectedZone: (zone: "all" | 1 | 2 | 3 | 4) => void;
  zoneColors: Record<1 | 2 | 3 | 4, string>;
  setZoneColor: (zone: "all" | 1 | 2 | 3 | 4, hex: string) => void;
  rgbBrightness: number;
  setRgbBrightness: (b: number) => void;
  rgbSpeed: number;
  setRgbSpeed: (s: number) => void;
  rgbDirection: 1 | 2;
  setRgbDirection: (d: 1 | 2) => void;

  lastActiveRgb: {
    mode: Exclude<RgbMode, "off">;
    brightness: number;
    speed: number;
    direction: 1 | 2;
    selectedZone: "all" | 1 | 2 | 3 | 4;
    zoneColors: Record<1 | 2 | 3 | 4, string>;
  };
  setLastActiveRgb: (config: Partial<AcerStoreState["lastActiveRgb"]>) => void;
  applyLoadedRgbConfig: (cfg: {
    mode: RgbMode;
    brightness?: number;
    speed?: number;
    direction?: 1 | 2;
    zone?: "all" | 1 | 2 | 3 | 4;
    color?: { r: number; g: number; b: number };
    zoneColors?: Array<{ zone: 1 | 2 | 3 | 4; r: number; g: number; b: number }>;
  }) => void;

  pollingMs: 1500 | 3000 | 5000 | 0;
  setPollingMs: (ms: 1500 | 3000 | 5000 | 0) => void;

  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;

  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;

  toast: ToastMessage | null;
  showToast: (type: ToastMessage["type"], message: string) => void;
  clearToast: () => void;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const num = Number.parseInt(clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean, 16);
  if (Number.isNaN(num)) return { r: 0, g: 255, b: 255 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(Number(n) || 0)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export const useAcerStore = create<AcerStoreState>((set) => ({
  history: [],
  pushTelemetrySample: (t) =>
    set((state) => {
      const cpuFan = t.nbfc.fans[0];
      const gpuFan = t.nbfc.fans[1];
      const next: TelemetrySample = {
        timestamp: t.timestamp,
        cpuTemp: cpuFan?.temperature ?? 0,
        gpuTemp: gpuFan?.temperature ?? 0,
        nvidiaTemp: t.gpu.nvidiaStats?.temperature ?? null,
        cpuFanSpeed: cpuFan?.currentSpeed ?? 0,
        gpuFanSpeed: gpuFan?.currentSpeed ?? 0,
        cpuRpm: cpuFan?.rpm ?? 0,
        gpuRpm: gpuFan?.rpm ?? 0,
        cpuLoad: t.system.cpuLoadPercent,
        memPercent: t.system.memoryPercent,
        batteryTemp: t.battery.temperature,
      };
      const prevLast = state.history[state.history.length - 1];
      if (prevLast && prevLast.timestamp === next.timestamp) {
        return state;
      }
      return {
        history: [...state.history.slice(-59), next],
      };
    }),

  fanTarget: "both",
  setFanTarget: (fanTarget) => set({ fanTarget }),
  draftFanSpeed: 65,
  setDraftFanSpeed: (draftFanSpeed) => set({ draftFanSpeed }),

  rgbMode: "wave",
  setRgbMode: (rgbMode) => set({ rgbMode }),
  selectedZone: "all",
  setSelectedZone: (selectedZone) => set({ selectedZone }),
  zoneColors: {
    1: "#00f0ff",
    2: "#00b8ff",
    3: "#a855f7",
    4: "#ff2e63",
  },
  setZoneColor: (zone, hex) =>
    set((state) => {
      if (zone === "all") {
        return {
          zoneColors: { 1: hex, 2: hex, 3: hex, 4: hex },
        };
      }
      return {
        zoneColors: {
          ...state.zoneColors,
          [zone]: hex,
        },
      };
    }),
  rgbBrightness: 100,
  setRgbBrightness: (rgbBrightness) => set({ rgbBrightness }),
  rgbSpeed: 4,
  setRgbSpeed: (rgbSpeed) => set({ rgbSpeed }),
  rgbDirection: 2,
  setRgbDirection: (rgbDirection) => set({ rgbDirection }),

  lastActiveRgb: {
    mode: "wave",
    brightness: 100,
    speed: 4,
    direction: 2,
    selectedZone: "all",
    zoneColors: {
      1: "#00f0ff",
      2: "#00b8ff",
      3: "#a855f7",
      4: "#ff2e63",
    },
  },
  setLastActiveRgb: (config) =>
    set((state) => ({
      lastActiveRgb: {
        ...state.lastActiveRgb,
        ...config,
        zoneColors: config.zoneColors
          ? { ...state.lastActiveRgb.zoneColors, ...config.zoneColors }
          : state.lastActiveRgb.zoneColors,
      },
    })),
  applyLoadedRgbConfig: (cfg) =>
    set((state) => {
      const isOff = cfg.mode === "off" || cfg.brightness === 0;
      let nextColors = { ...state.zoneColors };
      if (cfg.zoneColors && cfg.zoneColors.length > 0) {
        for (const zc of cfg.zoneColors) {
          nextColors[zc.zone] = rgbToHex(zc.r, zc.g, zc.b);
        }
      } else if (cfg.color) {
        const hex = rgbToHex(cfg.color.r, cfg.color.g, cfg.color.b);
        if (cfg.zone && cfg.zone !== "all") {
          nextColors[cfg.zone] = hex;
        } else {
          nextColors = { 1: hex, 2: hex, 3: hex, 4: hex };
        }
      }

      const nextMode = cfg.mode;
      const nextBrightness = cfg.brightness ?? (isOff ? 0 : state.rgbBrightness);
      const nextSpeed = cfg.speed ?? state.rgbSpeed;
      const nextDirection = cfg.direction ?? state.rgbDirection;
      const nextZone = cfg.zone ?? state.selectedZone;

      const nextLastActive = !isOff
        ? {
            mode: nextMode as Exclude<RgbMode, "off">,
            brightness: nextBrightness > 0 ? nextBrightness : (state.lastActiveRgb.brightness || 100),
            speed: nextSpeed,
            direction: nextDirection,
            selectedZone: nextZone,
            zoneColors: nextColors,
          }
        : state.lastActiveRgb;

      return {
        rgbMode: nextMode,
        rgbBrightness: nextBrightness,
        rgbSpeed: nextSpeed,
        rgbDirection: nextDirection,
        selectedZone: nextZone,
        zoneColors: nextColors,
        lastActiveRgb: nextLastActive,
      };
    }),

  pollingMs: 2000 as never, // normalized below
  setPollingMs: (pollingMs) => set({ pollingMs }),

  activeTab: "all",
  setActiveTab: (activeTab) => set({ activeTab }),

  theme: "dark",
  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("acer-ui-theme", theme);
        document.documentElement.classList.remove("dark", "light");
        document.documentElement.classList.add(theme);
      } catch {}
    }
    set({ theme });
  },
  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("acer-ui-theme", nextTheme);
          document.documentElement.classList.remove("dark", "light");
          document.documentElement.classList.add(nextTheme);
        } catch {}
      }
      return { theme: nextTheme };
    });
  },

  toast: null,
  showToast: (type, message) =>
    set({ toast: { id: Date.now(), type, message } }),
  clearToast: () => set({ toast: null }),
}));

// Initialize default pollingMs cleanly to 1500ms
useAcerStore.setState({ pollingMs: 1500 });

if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem("acer-ui-theme") as ThemeMode | null;
    const initialTheme: ThemeMode = saved === "light" ? "light" : "dark";
    useAcerStore.setState({ theme: initialTheme });
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(initialTheme);
  } catch {}
}

