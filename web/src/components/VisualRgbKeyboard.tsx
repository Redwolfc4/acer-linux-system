"use client";

import { Keyboard, Palette, Power, Save, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useRgbMutation,
  useRgbProfileMutation,
  useRgbProfilesQuery,
} from "@/hooks/useAcerQueries";
import type { RgbMode } from "@/lib/schemas";
import { hexToRgb, rgbToHex, useAcerStore } from "@/store/useAcerStore";

interface KeyDef {
  label: string;
  zone: 1 | 2 | 3 | 4;
  span?: string;
  accent?: boolean;
}

const KEYBOARD_ROWS: KeyDef[][] = [
  [
    { label: "ESC", zone: 1 },
    { label: "F1", zone: 1 },
    { label: "F2", zone: 1 },
    { label: "F3", zone: 1 },
    { label: "F4", zone: 1 },
    { label: "F5", zone: 2 },
    { label: "F6", zone: 2 },
    { label: "F7", zone: 2 },
    { label: "F8", zone: 2 },
    { label: "F9", zone: 3 },
    { label: "F10", zone: 3 },
    { label: "F11", zone: 3 },
    { label: "F12", zone: 3 },
    { label: "DEL", zone: 3, span: "col-span-2" },
    { label: "N", zone: 4, accent: true },
    { label: "/", zone: 4 },
    { label: "*", zone: 4 },
    { label: "PWR", zone: 4 },
  ],
  [
    { label: "`", zone: 1 },
    { label: "1", zone: 1 },
    { label: "2", zone: 1 },
    { label: "3", zone: 1 },
    { label: "4", zone: 1 },
    { label: "5", zone: 1 },
    { label: "6", zone: 2 },
    { label: "7", zone: 2 },
    { label: "8", zone: 2 },
    { label: "9", zone: 2 },
    { label: "0", zone: 2 },
    { label: "-", zone: 3 },
    { label: "=", zone: 3 },
    { label: "BKSP", zone: 3, span: "col-span-2" },
    { label: "7", zone: 4 },
    { label: "8", zone: 4 },
    { label: "9", zone: 4 },
    { label: "-", zone: 4 },
  ],
  [
    { label: "TAB", zone: 1, span: "col-span-2" },
    { label: "Q", zone: 1 },
    { label: "W", zone: 1, accent: true },
    { label: "E", zone: 1 },
    { label: "R", zone: 1 },
    { label: "T", zone: 1 },
    { label: "Y", zone: 2 },
    { label: "U", zone: 2 },
    { label: "I", zone: 2 },
    { label: "O", zone: 2 },
    { label: "P", zone: 2 },
    { label: "[", zone: 3 },
    { label: "]", zone: 3 },
    { label: "\\", zone: 3 },
    { label: "4", zone: 4 },
    { label: "5", zone: 4 },
    { label: "6", zone: 4 },
    { label: "+", zone: 4 },
  ],
  [
    { label: "CAPS", zone: 1, span: "col-span-2" },
    { label: "A", zone: 1, accent: true },
    { label: "S", zone: 1, accent: true },
    { label: "D", zone: 1, accent: true },
    { label: "F", zone: 1 },
    { label: "G", zone: 2 },
    { label: "H", zone: 2 },
    { label: "J", zone: 2 },
    { label: "K", zone: 2 },
    { label: "L", zone: 2 },
    { label: ";", zone: 3 },
    { label: "'", zone: 3 },
    { label: "ENTER", zone: 3, span: "col-span-2" },
    { label: "1", zone: 4 },
    { label: "2", zone: 4 },
    { label: "3", zone: 4 },
    { label: "ENT", zone: 4 },
  ],
  [
    { label: "SHIFT", zone: 1, span: "col-span-2" },
    { label: "Z", zone: 1 },
    { label: "X", zone: 1 },
    { label: "C", zone: 1 },
    { label: "V", zone: 1 },
    { label: "B", zone: 2 },
    { label: "N", zone: 2 },
    { label: "M", zone: 2 },
    { label: ",", zone: 2 },
    { label: ".", zone: 3 },
    { label: "/", zone: 3 },
    { label: "SHIFT", zone: 3, span: "col-span-2" },
    { label: "▲", zone: 3, accent: true },
    { label: "0", zone: 4, span: "col-span-2" },
    { label: ".", zone: 4 },
    { label: "FN", zone: 4 },
  ],
  [
    { label: "CTRL", zone: 1 },
    { label: "FN", zone: 1 },
    { label: "WIN", zone: 1 },
    { label: "ALT", zone: 1 },
    { label: "SPACE", zone: 2, span: "col-span-6" },
    { label: "ALT", zone: 3 },
    { label: "CTRL", zone: 3 },
    { label: "◄", zone: 3, accent: true },
    { label: "▼", zone: 3, accent: true },
    { label: "►", zone: 4, accent: true },
    { label: "NITRO", zone: 4, span: "col-span-4", accent: true },
  ],
];

const MODE_OPTIONS: Array<{ id: RgbMode; label: string }> = [
  { id: "static", label: "Static 4-Zone" },
  { id: "breath", label: "Breathing" },
  { id: "neon", label: "Neon" },
  { id: "wave", label: "Wave" },
  { id: "shifting", label: "Shifting" },
  { id: "zoom", label: "Zoom" },
];

const COLOR_SWATCHES = [
  { name: "Cyber Cyan", hex: "#00f0ff" },
  { name: "Nitro Red", hex: "#ff1e42" },
  { name: "Electric Blue", hex: "#2563eb" },
  { name: "Neon Green", hex: "#10b981" },
  { name: "Violet Pulse", hex: "#a855f7" },
  { name: "Amber Gold", hex: "#f59e0b" },
  { name: "Hot Pink", hex: "#ec4899" },
  { name: "Pure White", hex: "#ffffff" },
];

export function VisualRgbKeyboard() {
  const rgbMode = useAcerStore((s) => s.rgbMode);
  const setRgbMode = useAcerStore((s) => s.setRgbMode);
  const selectedZone = useAcerStore((s) => s.selectedZone);
  const setSelectedZone = useAcerStore((s) => s.setSelectedZone);
  const zoneColors = useAcerStore((s) => s.zoneColors);
  const setZoneColor = useAcerStore((s) => s.setZoneColor);
  const rgbBrightness = useAcerStore((s) => s.rgbBrightness);
  const setRgbBrightness = useAcerStore((s) => s.setRgbBrightness);
  const rgbSpeed = useAcerStore((s) => s.rgbSpeed);
  const setRgbSpeed = useAcerStore((s) => s.setRgbSpeed);
  const rgbDirection = useAcerStore((s) => s.rgbDirection);
  const setRgbDirection = useAcerStore((s) => s.setRgbDirection);
  const lastActiveRgb = useAcerStore((s) => s.lastActiveRgb);
  const setLastActiveRgb = useAcerStore((s) => s.setLastActiveRgb);
  const applyLoadedRgbConfig = useAcerStore((s) => s.applyLoadedRgbConfig);
  const showToast = useAcerStore((s) => s.showToast);
  const theme = useAcerStore((s) => s.theme);
  const isLight = theme === "light";

  const [profileName, setProfileName] = useState("");
  const [hasHydratedRgb, setHasHydratedRgb] = useState(false);
  const rgbMutation = useRgbMutation();
  const profilesQuery = useRgbProfilesQuery();
  const profileMutation = useRgbProfileMutation();

  // Membaca pengaturan RGB yang tersimpan sebelumnya saat aplikasi pertama kali dimuat
  useEffect(() => {
    if (hasHydratedRgb || !profilesQuery.data) return;
    const current = profilesQuery.data.currentState;
    if (current) {
      applyLoadedRgbConfig({
        mode: current.mode,
        brightness: current.brightness,
        speed: current.speed,
        direction: current.direction,
        zone: current.zone,
        color: current.color,
        zoneColors: current.zoneColors,
      });

      const lastActive = current.lastActiveConfig || profilesQuery.data.lastActiveConfig;
      if (lastActive) {
        setLastActiveRgb({
          mode: (lastActive.mode === "off" ? "wave" : lastActive.mode) as Exclude<RgbMode, "off">,
          brightness: lastActive.brightness > 0 ? lastActive.brightness : 100,
          speed: lastActive.speed ?? 4,
          direction: lastActive.direction ?? 2,
          selectedZone: lastActive.zone ?? "all",
          zoneColors: lastActive.zoneColors
            ? (Object.fromEntries(
                lastActive.zoneColors.map((zc) => [zc.zone, rgbToHex(zc.r, zc.g, zc.b)])
              ) as Record<1 | 2 | 3 | 4, string>)
            : undefined,
        });
      }
      setHasHydratedRgb(true);
    }
  }, [profilesQuery.data, hasHydratedRgb, applyLoadedRgbConfig, setLastActiveRgb]);

  const activeHex =
    selectedZone === "all" ? zoneColors[1] : zoneColors[selectedZone];

  const isOff = rgbMode === "off" || rgbBrightness === 0;
  const animSeconds = Math.max(0.6, 5.2 - rgbSpeed * 0.5).toFixed(2);

  const applyToHardware = (overrideMode?: RgbMode, overrideBrightness?: number) => {
    const modeToUse = overrideMode ?? rgbMode;
    const brightnessToUse =
      overrideBrightness !== undefined
        ? overrideBrightness
        : modeToUse === "off"
          ? 0
          : rgbBrightness;
    const primaryColor = hexToRgb(activeHex);

    rgbMutation.mutate({
      mode: modeToUse,
      zone: selectedZone,
      speed: rgbSpeed,
      brightness: brightnessToUse,
      direction: rgbDirection,
      color: primaryColor,
      zoneColors:
        modeToUse === "static"
          ? ([1, 2, 3, 4] as const).map((z) => ({
              zone: z,
              ...hexToRgb(zoneColors[z]),
            }))
          : undefined,
    });
  };

  const handleTogglePower = () => {
    if (!isOff) {
      // Matikan lampu: simpan konfigurasi aktif terakhir terlebih dahulu
      setLastActiveRgb({
        mode: rgbMode,
        brightness: rgbBrightness > 0 ? rgbBrightness : 100,
        speed: rgbSpeed,
        direction: rgbDirection,
        selectedZone,
        zoneColors,
      });
      setRgbMode("off");
      setRgbBrightness(0);
      applyToHardware("off", 0);
    } else {
      // Nyalakan lampu: baca dan pulihkan pengaturan sebelumnya!
      const targetMode = lastActiveRgb?.mode ?? "wave";
      const targetBrightness =
        lastActiveRgb?.brightness && lastActiveRgb.brightness > 0
          ? lastActiveRgb.brightness
          : 100;
      const targetSpeed = lastActiveRgb?.speed ?? 4;
      const targetDirection = lastActiveRgb?.direction ?? 2;
      const targetColors = lastActiveRgb?.zoneColors ?? zoneColors;
      const targetZone = lastActiveRgb?.selectedZone ?? selectedZone;

      setRgbMode(targetMode);
      setRgbBrightness(targetBrightness);
      setRgbSpeed(targetSpeed);
      setRgbDirection(targetDirection);
      if (targetZone) setSelectedZone(targetZone);

      const primaryColor = hexToRgb(
        targetZone === "all" ? targetColors[1] : targetColors[targetZone]
      );

      rgbMutation.mutate(
        {
          mode: targetMode,
          zone: targetZone,
          speed: targetSpeed,
          brightness: targetBrightness,
          direction: targetDirection,
          color: primaryColor,
          zoneColors:
            targetMode === "static"
              ? ([1, 2, 3, 4] as const).map((z) => ({
                  zone: z,
                  ...hexToRgb(targetColors[z]),
                }))
              : undefined,
        },
        {
          onSuccess: () => {
            showToast(
              "success",
              `Lampu keyboard dinyalakan (Mode ${targetMode.toUpperCase()}, ${targetBrightness}%)`
            );
          },
        }
      );
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-colors duration-200 dark:border-slate-800/90 dark:bg-[#0d121c]/90 dark:shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl border border-purple-500/20 bg-purple-50 p-2 text-purple-600 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-400">
            <Keyboard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Visual 4-Zone RGB Keyboard Studio
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Klik zona pada keyboard untuk memilih pewarnaan per zona atau seluruh keyboard via <code>facer_rgb.py</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
              profilesQuery.data?.devicePresent
                ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300"
            }`}
          >
            {profilesQuery.data?.devicePresent
              ? "/dev/acer-gkbbl-0 Aktif"
              : "Preview Mode"}
          </span>

          <button
            type="button"
            disabled={rgbMutation.isPending}
            onClick={handleTogglePower}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs transition disabled:opacity-50 ${
              isOff
                ? "border-emerald-400 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 ring-1 ring-emerald-300/60 dark:border-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/25 dark:ring-emerald-400/40 dark:shadow-emerald-500/10"
                : "border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20"
            }`}
            title={
              isOff
                ? "Nyalakan lampu dan kembalikan pengaturan sebelumnya"
                : "Matikan lampu backlight keyboard"
            }
          >
            <Power
              className={`h-3.5 w-3.5 ${
                isOff ? "text-emerald-600 dark:text-emerald-400 animate-pulse" : "text-rose-600 dark:text-rose-300"
              }`}
            />
            {isOff ? "Nyalakan Lampu" : "Matikan Lampu"}
          </button>
        </div>
      </div>

      {/* Interactive Keyboard Preview */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-100/90 p-4 shadow-inner transition-colors duration-200 dark:border-slate-800 dark:bg-[#06080d]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Zona Target:</span>
            <button
              type="button"
              onClick={() => setSelectedZone("all")}
              className={`rounded-md px-2.5 py-1 font-semibold transition shadow-2xs ${
                selectedZone === "all"
                  ? "bg-purple-100 text-purple-900 ring-1 ring-purple-400 dark:bg-purple-500/25 dark:text-purple-200 dark:ring-purple-400/60"
                  : "border border-slate-200 bg-white text-slate-600 hover:text-slate-900 dark:border-transparent dark:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Semua Zona
            </button>
            {([1, 2, 3, 4] as const).map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setSelectedZone(z)}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold transition shadow-2xs ${
                  selectedZone === z
                    ? "bg-white text-slate-900 ring-1 ring-slate-400 dark:bg-slate-800 dark:text-white dark:ring-white/50"
                    : "border border-slate-200 bg-white text-slate-600 hover:text-slate-900 dark:border-transparent dark:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: zoneColors[z] }}
                />
                Zone {z}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-slate-500 dark:text-slate-500">
            Brightness {isOff ? 0 : rgbBrightness}% • Mode {rgbMode.toUpperCase()}
            {isOff && (
              <span className="ml-1.5 font-medium text-slate-600 dark:text-slate-400">
                (Sebelumnya: {lastActiveRgb.mode.toUpperCase()})
              </span>
            )}
          </span>
        </div>

        {/* Keycap Chassis */}
        <div
          className={`overflow-x-auto rounded-xl border border-slate-300/90 bg-slate-200/90 p-3 shadow-inner dark:border-slate-800/90 dark:bg-slate-950/90 ${
            !isOff && rgbMode === "neon" ? "animate-rgb-neon" : ""
          } ${!isOff && rgbMode === "breath" ? "animate-rgb-breath" : ""}`}
          style={{
            animationDuration:
              rgbMode === "neon" || rgbMode === "breath"
                ? `${animSeconds}s`
                : undefined,
          }}
        >
          <div className="min-w-[700px] space-y-1.5">
            {KEYBOARD_ROWS.map((row, rIdx) => (
              <div key={rIdx} className="grid grid-cols-19 gap-1.5">
                {row.map((keyDef, kIdx) => {
                  const zoneHex = isOff ? "#1e293b" : zoneColors[keyDef.zone];
                  const isZoneSelected =
                    selectedZone === "all" || selectedZone === keyDef.zone;
                  const opacityFactor = isOff
                    ? 0.35
                    : Math.max(0.25, rgbBrightness / 100);

                  const keyBg = isLight
                    ? (isOff ? "#f1f5f9" : "#ffffff")
                    : "#0c111b";
                  const keyTextColor = isLight
                    ? (isOff ? "#94a3b8" : (keyDef.accent ? "#0f172a" : "#1e293b"))
                    : (isOff ? "#64748b" : zoneHex);
                  const keyBorder = isLight
                    ? (isOff ? "#cbd5e1" : (keyDef.accent ? zoneHex : `${zoneHex}88`))
                    : (isOff ? "#1e293b" : (keyDef.accent ? zoneHex : `${zoneHex}55`));
                  const keyShadow = isOff
                    ? "none"
                    : isLight
                      ? `0 0 ${Math.round(8 * opacityFactor)}px ${zoneHex}66, inset 0 -2px 0 ${zoneHex}99`
                      : `0 0 ${Math.round(8 * opacityFactor)}px ${zoneHex}55, inset 0 -2px 0 ${zoneHex}88`;

                  return (
                    <button
                      key={`${rIdx}-${kIdx}`}
                      type="button"
                      onClick={() => setSelectedZone(keyDef.zone)}
                      title={`Zone ${keyDef.zone}: ${zoneColors[keyDef.zone]}`}
                      className={`${keyDef.span ?? "col-span-1"} flex h-8 items-center justify-center rounded-md border text-[10px] font-bold tracking-tight transition hover:scale-[1.03] ${
                        isZoneSelected
                          ? "border-slate-500 shadow-2xs dark:border-slate-600/80"
                          : "border-slate-300 opacity-70 dark:border-slate-800/70 dark:opacity-60"
                      }`}
                      style={{
                        backgroundColor: keyBg,
                        color: keyTextColor,
                        borderColor: keyBorder,
                        boxShadow: keyShadow,
                        opacity: isOff ? 0.5 : 0.5 + 0.5 * (rgbBrightness / 100),
                      }}
                    >
                      {keyDef.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls Grid */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Effect Modes */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3 dark:border-slate-800/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /> Efek Animasi
          </div>
          <div className="grid grid-cols-2 gap-2">
            {MODE_OPTIONS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setRgbMode(m.id);
                  if (isOff) {
                    setRgbBrightness(
                      lastActiveRgb.brightness > 0 ? lastActiveRgb.brightness : 100
                    );
                  }
                }}
                className={`rounded-lg border px-2.5 py-2 text-xs font-semibold shadow-2xs transition ${
                  rgbMode === m.id
                    ? "border-purple-400 bg-purple-100 text-purple-900 font-bold dark:border-purple-400/70 dark:bg-purple-500/20 dark:text-purple-200"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="pt-1">
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Brightness</span>
              <span className="font-mono font-bold text-purple-700 dark:text-purple-300">
                {rgbBrightness}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={rgbBrightness}
              onChange={(e) => {
                const val = Number(e.target.value);
                setRgbBrightness(val);
                if (val > 0 && rgbMode === "off") {
                  setRgbMode(lastActiveRgb.mode || "wave");
                }
              }}
              className="w-full accent-purple-600 dark:accent-purple-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Speed</span>
                <span className="font-mono font-bold text-purple-700 dark:text-purple-300">
                  {rgbSpeed}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={9}
                value={rgbSpeed}
                onChange={(e) => setRgbSpeed(Number(e.target.value))}
                className="w-full accent-purple-600 dark:accent-purple-400"
              />
            </div>

            <div>
              <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">Arah Wave</div>
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-white p-0.5 text-[11px] shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setRgbDirection(2)}
                  className={`rounded py-1 font-semibold transition ${
                    rgbDirection === 2
                      ? "bg-purple-100 text-purple-900 dark:bg-purple-500/25 dark:text-purple-200"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  L → R
                </button>
                <button
                  type="button"
                  onClick={() => setRgbDirection(1)}
                  className={`rounded py-1 font-semibold transition ${
                    rgbDirection === 1
                      ? "bg-purple-100 text-purple-900 dark:bg-purple-500/25 dark:text-purple-200"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  R → L
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Color Picker & Swatches */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3 dark:border-slate-800/80 dark:bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
              <Palette className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /> Pilihan Warna
            </div>
            <span className="rounded bg-slate-200 px-2 py-0.5 font-mono text-[11px] text-slate-800 dark:bg-slate-900 dark:text-cyan-300">
              {selectedZone === "all" ? "ALL ZONES" : `ZONE ${selectedZone}`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="color"
              value={activeHex}
              onChange={(e) => setZoneColor(selectedZone, e.target.value)}
              className="h-11 w-16 cursor-pointer rounded-lg border border-slate-300 bg-white p-0.5 dark:border-slate-700 dark:bg-transparent"
            />
            <div className="flex-1">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Hex Warna Aktif</div>
              <input
                type="text"
                value={activeHex}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                    setZoneColor(selectedZone, val);
                  }
                }}
                className="mt-0.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1">
            {COLOR_SWATCHES.map((sw) => (
              <button
                key={sw.hex}
                type="button"
                onClick={() => setZoneColor(selectedZone, sw.hex)}
                title={sw.name}
                className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 bg-white p-1.5 text-[10px] text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:border-slate-600"
              >
                <span
                  className="h-4 w-full rounded"
                  style={{
                    backgroundColor: sw.hex,
                    boxShadow: `0 0 8px ${sw.hex}66`,
                  }}
                />
                <span className="truncate w-full text-center font-medium">
                  {sw.name.split(" ")[1] ?? sw.name}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={rgbMutation.isPending}
            onClick={() => {
              if (isOff) {
                const targetMode =
                  rgbMode === "off" ? (lastActiveRgb.mode || "wave") : rgbMode;
                const targetBrightness =
                  rgbBrightness > 0
                    ? rgbBrightness
                    : (lastActiveRgb.brightness || 100);
                setRgbMode(targetMode);
                setRgbBrightness(targetBrightness);
                applyToHardware(targetMode, targetBrightness);
              } else {
                applyToHardware();
              }
            }}
            className="w-full rounded-lg bg-gradient-to-r from-cyan-600 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 transition hover:brightness-110 disabled:opacity-50 dark:from-cyan-500 dark:to-purple-500 dark:text-slate-950"
          >
            {rgbMutation.isPending
              ? "Mengirim ke Facer WMI..."
              : isOff
                ? "Nyalakan & Terapkan Efek ke Keyboard"
                : "Terapkan Warna & Efek ke Keyboard"}
          </button>
        </div>

        {/* Saved Profiles */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3 dark:border-slate-800/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
            <Save className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Saved Profiles
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Simpan atau muat profil RGB di <code>~/.config/predator/saved profiles</code>
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nama profil (cth: coding_cyan)"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
            />
            <button
              type="button"
              disabled={!profileName.trim() || profileMutation.isPending}
              onClick={() => {
                const rgb = hexToRgb(activeHex);
                profileMutation.mutate(
                  {
                    action: "save",
                    name: profileName.trim(),
                    config: {
                      mode: rgbMode,
                      zone: selectedZone,
                      speed: rgbSpeed,
                      brightness: rgbBrightness,
                      direction: rgbDirection,
                      color: rgb,
                    },
                  },
                  { onSuccess: () => setProfileName("") }
                );
              }}
              className="rounded-lg border border-emerald-400 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-2xs transition hover:bg-emerald-100 disabled:opacity-40 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/25"
            >
              Simpan
            </button>
          </div>

          <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
            {(profilesQuery.data?.profiles ?? []).length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white/60 p-3 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-transparent dark:text-slate-500">
                Belum ada profil tersimpan.
              </div>
            ) : (
              profilesQuery.data?.profiles.map((prof) => (
                <div
                  key={prof}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-2xs dark:border-slate-800 dark:bg-slate-900/80"
                >
                  <span className="font-mono text-slate-800 dark:text-slate-200">{prof}</span>
                  <button
                    type="button"
                    disabled={profileMutation.isPending}
                    onClick={() =>
                      profileMutation.mutate({ action: "load", name: prof })
                    }
                    className="rounded border border-cyan-300 bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-800 hover:bg-cyan-100 dark:border-transparent dark:bg-cyan-500/15 dark:text-cyan-300 dark:hover:bg-cyan-500/25"
                  >
                    Load
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
