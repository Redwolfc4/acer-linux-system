"use client";

import { Keyboard, Palette, Power, Save, Sparkles } from "lucide-react";
import { useState } from "react";
import {
  useRgbMutation,
  useRgbProfileMutation,
  useRgbProfilesQuery,
} from "@/hooks/useAcerQueries";
import type { RgbMode } from "@/lib/schemas";
import { hexToRgb, useAcerStore } from "@/store/useAcerStore";

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

  const [profileName, setProfileName] = useState("");
  const rgbMutation = useRgbMutation();
  const profilesQuery = useRgbProfilesQuery();
  const profileMutation = useRgbProfileMutation();

  const activeHex =
    selectedZone === "all" ? zoneColors[1] : zoneColors[selectedZone];

  const isOff = rgbMode === "off" || rgbBrightness === 0;
  const animSeconds = Math.max(0.6, 5.2 - rgbSpeed * 0.5).toFixed(2);

  const applyToHardware = (overrideMode?: RgbMode) => {
    const modeToUse = overrideMode ?? rgbMode;
    const primaryColor = hexToRgb(activeHex);

    rgbMutation.mutate({
      mode: modeToUse,
      zone: selectedZone,
      speed: rgbSpeed,
      brightness: modeToUse === "off" ? 0 : rgbBrightness,
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

  return (
    <section className="rounded-2xl border border-slate-800/90 bg-[#0d121c]/90 p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-2">
            <Keyboard className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Visual 4-Zone RGB Keyboard Studio
            </h2>
            <p className="text-xs text-slate-400">
              Klik zona pada keyboard untuk memilih pewarnaan per zona atau seluruh keyboard via <code>facer_rgb.py</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
              profilesQuery.data?.devicePresent
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/40 bg-amber-500/10 text-amber-300"
            }`}
          >
            {profilesQuery.data?.devicePresent
              ? "/dev/acer-gkbbl-0 Aktif"
              : "Preview Mode"}
          </span>

          <button
            type="button"
            disabled={rgbMutation.isPending}
            onClick={() => {
              setRgbMode("off");
              applyToHardware("off");
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50"
          >
            <Power className="h-3.5 w-3.5" /> Matikan Lampu
          </button>
        </div>
      </div>

      {/* Interactive Keyboard Preview */}
      <div className="mt-4 rounded-2xl border border-slate-800 bg-[#06080d] p-4 shadow-inner">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400">Zona Target:</span>
            <button
              type="button"
              onClick={() => setSelectedZone("all")}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                selectedZone === "all"
                  ? "bg-purple-500/25 text-purple-200 ring-1 ring-purple-400/60"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200"
              }`}
            >
              Semua Zona
            </button>
            {([1, 2, 3, 4] as const).map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setSelectedZone(z)}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold transition ${
                  selectedZone === z
                    ? "bg-slate-800 text-white ring-1 ring-white/50"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200"
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

          <span className="text-[11px] text-slate-500">
            Brightness {isOff ? 0 : rgbBrightness}% • Mode {rgbMode.toUpperCase()}
          </span>
        </div>

        {/* Keycap Chassis */}
        <div
          className={`overflow-x-auto rounded-xl border border-slate-800/90 bg-slate-950/90 p-3 ${
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

                  return (
                    <button
                      key={`${rIdx}-${kIdx}`}
                      type="button"
                      onClick={() => setSelectedZone(keyDef.zone)}
                      title={`Zone ${keyDef.zone}: ${zoneColors[keyDef.zone]}`}
                      className={`${keyDef.span ?? "col-span-1"} flex h-8 items-center justify-center rounded-md border text-[10px] font-bold tracking-tight transition hover:scale-[1.03] ${
                        isZoneSelected
                          ? "border-slate-600/80"
                          : "border-slate-800/70 opacity-60"
                      }`}
                      style={{
                        backgroundColor: "#0c111b",
                        color: isOff ? "#64748b" : zoneHex,
                        borderColor: isOff
                          ? "#1e293b"
                          : keyDef.accent
                            ? zoneHex
                            : `${zoneHex}55`,
                        boxShadow: isOff
                          ? "none"
                          : `0 0 ${Math.round(8 * opacityFactor)}px ${zoneHex}55, inset 0 -2px 0 ${zoneHex}88`,
                        opacity: isOff ? 0.5 : 0.4 + 0.6 * (rgbBrightness / 100),
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
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" /> Efek Animasi
          </div>
          <div className="grid grid-cols-2 gap-2">
            {MODE_OPTIONS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setRgbMode(m.id)}
                className={`rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${
                  rgbMode === m.id
                    ? "border-purple-400/70 bg-purple-500/20 text-purple-200"
                    : "border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="pt-1">
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-slate-400">Brightness</span>
              <span className="font-mono font-bold text-purple-300">
                {rgbBrightness}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={rgbBrightness}
              onChange={(e) => setRgbBrightness(Number(e.target.value))}
              className="w-full accent-purple-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-400">Speed</span>
                <span className="font-mono font-bold text-purple-300">
                  {rgbSpeed}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={9}
                value={rgbSpeed}
                onChange={(e) => setRgbSpeed(Number(e.target.value))}
                className="w-full accent-purple-400"
              />
            </div>

            <div>
              <div className="mb-1 text-xs text-slate-400">Arah Wave</div>
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setRgbDirection(2)}
                  className={`rounded py-1 font-semibold ${
                    rgbDirection === 2
                      ? "bg-purple-500/25 text-purple-200"
                      : "text-slate-400"
                  }`}
                >
                  L → R
                </button>
                <button
                  type="button"
                  onClick={() => setRgbDirection(1)}
                  className={`rounded py-1 font-semibold ${
                    rgbDirection === 1
                      ? "bg-purple-500/25 text-purple-200"
                      : "text-slate-400"
                  }`}
                >
                  R → L
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Color Picker & Swatches */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Palette className="h-3.5 w-3.5 text-cyan-400" /> Pilihan Warna
            </div>
            <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[11px] text-cyan-300">
              {selectedZone === "all" ? "ALL ZONES" : `ZONE ${selectedZone}`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="color"
              value={activeHex}
              onChange={(e) => setZoneColor(selectedZone, e.target.value)}
              className="h-11 w-16 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-0.5"
            />
            <div className="flex-1">
              <div className="text-[11px] text-slate-400">Hex Warna Aktif</div>
              <input
                type="text"
                value={activeHex}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                    setZoneColor(selectedZone, val);
                  }
                }}
                className="mt-0.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
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
                className="flex flex-col items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/90 p-1.5 text-[10px] text-slate-300 transition hover:border-slate-600"
              >
                <span
                  className="h-4 w-full rounded"
                  style={{
                    backgroundColor: sw.hex,
                    boxShadow: `0 0 8px ${sw.hex}66`,
                  }}
                />
                <span className="truncate w-full text-center">
                  {sw.name.split(" ")[1] ?? sw.name}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={rgbMutation.isPending}
            onClick={() => applyToHardware()}
            className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-purple-500/20 transition hover:brightness-110 disabled:opacity-50"
          >
            {rgbMutation.isPending
              ? "Mengirim ke Facer WMI..."
              : "Terapkan Warna & Efek ke Keyboard"}
          </button>
        </div>

        {/* Saved Profiles */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Save className="h-3.5 w-3.5 text-emerald-400" /> Saved Profiles
          </div>
          <p className="text-[11px] text-slate-400">
            Simpan atau muat profil RGB di <code>~/.config/predator/saved profiles</code>
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nama profil (cth: coding_cyan)"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
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
              className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/25 disabled:opacity-40"
            >
              Simpan
            </button>
          </div>

          <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
            {(profilesQuery.data?.profiles ?? []).length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-800 p-3 text-center text-xs text-slate-500">
                Belum ada profil tersimpan.
              </div>
            ) : (
              profilesQuery.data?.profiles.map((prof) => (
                <div
                  key={prof}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs"
                >
                  <span className="font-mono text-slate-200">{prof}</span>
                  <button
                    type="button"
                    disabled={profileMutation.isPending}
                    onClick={() =>
                      profileMutation.mutate({ action: "load", name: prof })
                    }
                    className="rounded bg-cyan-500/15 px-2 py-0.5 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/25"
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
