"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  FanSensorsResponseSchema,
  GitOverviewResponseSchema,
  RgbProfilesResponseSchema,
  TelemetryResponseSchema,
  type BatteryControlRequest,
  type FanControlRequest,
  type FanSensorUpdateRequest,
  type GpuControlRequest,
  type RgbControlRequest,
  type RgbProfileAction,
} from "@/lib/schemas";
import { useAcerStore } from "@/store/useAcerStore";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const payload = await res.json();
  if (!res.ok || !payload?.ok) {
    throw new Error(payload?.error || `Request failed (${res.status})`);
  }
  return payload.data as T;
}

export function useTelemetryQuery() {
  const pollingMs = useAcerStore((s) => s.pollingMs);
  const pushTelemetrySample = useAcerStore((s) => s.pushTelemetrySample);

  const query = useQuery({
    queryKey: ["telemetry"],
    queryFn: async () => {
      const data = await fetchJson<unknown>("/api/system/telemetry");
      return TelemetryResponseSchema.parse(data);
    },
    refetchInterval: pollingMs === 0 ? false : pollingMs,
  });

  useEffect(() => {
    if (query.data) {
      pushTelemetrySample(query.data);
    }
  }, [query.data, pushTelemetrySample]);

  return query;
}

export function useFanSensorsQuery() {
  return useQuery({
    queryKey: ["fan-sensors"],
    queryFn: async () => {
      const data = await fetchJson<unknown>("/api/fan/sensors");
      return FanSensorsResponseSchema.parse(data);
    },
  });
}

export function useRgbProfilesQuery() {
  return useQuery({
    queryKey: ["rgb-profiles"],
    queryFn: async () => {
      const data = await fetchJson<unknown>("/api/rgb");
      return RgbProfilesResponseSchema.parse(data);
    },
  });
}

export function useGitOverviewQuery() {
  return useQuery({
    queryKey: ["git-overview"],
    queryFn: async () => {
      const data = await fetchJson<unknown>("/api/git");
      return GitOverviewResponseSchema.parse(data);
    },
  });
}

export function useFanControlMutation() {
  const qc = useQueryClient();
  const showToast = useAcerStore((s) => s.showToast);

  return useMutation({
    mutationFn: (body: FanControlRequest) =>
      fetchJson("/api/fan", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["telemetry"] });
      const targetLabel =
        vars.target === "cpu"
          ? "Kipas Kiri (CPU)"
          : vars.target === "gpu"
            ? "Kipas Kanan (GPU)"
            : "Kedua Kipas";
      const modeLabel =
        vars.mode === "auto"
          ? "AUTO"
          : vars.mode === "max"
            ? "TURBO 100%"
            : `${vars.speed}%`;
      showToast("success", `${targetLabel} diatur ke ${modeLabel}`);
    },
    onError: (err) => {
      showToast("error", err instanceof Error ? err.message : "Gagal mengatur kipas");
    },
  });
}

export function useFanSensorMutation() {
  const qc = useQueryClient();
  const showToast = useAcerStore((s) => s.showToast);

  return useMutation({
    mutationFn: (body: FanSensorUpdateRequest) =>
      fetchJson("/api/fan/sensors", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["fan-sensors"] });
      qc.invalidateQueries({ queryKey: ["telemetry"] });
      const fanLabel = vars.fanIndex === 0 ? "Kipas Kiri (CPU #0)" : "Kipas Kanan (GPU #1)";
      showToast(
        "success",
        `Sensor ${fanLabel} diubah ke ${vars.sensors.join(", ")} (${vars.algorithm})`
      );
    },
    onError: (err) => {
      showToast("error", err instanceof Error ? err.message : "Gagal mengubah sensor kipas");
    },
  });
}

export function useRgbMutation() {
  const showToast = useAcerStore((s) => s.showToast);

  return useMutation({
    mutationFn: (body: RgbControlRequest) =>
      fetchJson("/api/rgb", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, vars) => {
      showToast(
        "success",
        vars.mode === "off"
          ? "Backlight keyboard dimatikan"
          : `RGB mode ${vars.mode.toUpperCase()} diterapkan`
      );
    },
    onError: (err) => {
      showToast("error", err instanceof Error ? err.message : "Gagal mengatur RGB keyboard");
    },
  });
}

export function useRgbProfileMutation() {
  const qc = useQueryClient();
  const showToast = useAcerStore((s) => s.showToast);

  return useMutation({
    mutationFn: (body: RgbProfileAction) =>
      fetchJson("/api/rgb/profiles", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["rgb-profiles"] });
      showToast(
        "success",
        vars.action === "save"
          ? `Profil RGB "${vars.name}" tersimpan`
          : `Profil RGB "${vars.name}" dimuat`
      );
    },
    onError: (err) => {
      showToast("error", err instanceof Error ? err.message : "Gagal memproses profil RGB");
    },
  });
}

export function useBatteryMutation() {
  const qc = useQueryClient();
  const showToast = useAcerStore((s) => s.showToast);

  return useMutation({
    mutationFn: (body: BatteryControlRequest) =>
      fetchJson("/api/battery", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["telemetry"] });
      if (vars.healthMode !== undefined) {
        showToast(
          "success",
          vars.healthMode
            ? "Battery Care 80% Cut-Off DIAKTIFKAN"
            : "Batas cas dimatikan (Full Charge 100%)"
        );
      } else if (vars.persistBoot !== undefined) {
        showToast(
          "success",
          vars.persistBoot
            ? "Pengaturan 80% disimpan permanen saat boot"
            : "Auto-limit boot dihapus"
        );
      }
    },
    onError: (err) => {
      showToast("error", err instanceof Error ? err.message : "Gagal mengatur baterai");
    },
  });
}

export function useGpuMutation() {
  const qc = useQueryClient();
  const showToast = useAcerStore((s) => s.showToast);

  return useMutation({
    mutationFn: (body: GpuControlRequest) =>
      fetchJson<{ rebootRequired?: boolean }>("/api/gpu", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["telemetry"] });
      showToast(
        "info",
        `Mode GPU diset ke ${vars.mode.toUpperCase()}. Reboot laptop untuk aktivasi penuh!`
      );
    },
    onError: (err) => {
      showToast("error", err instanceof Error ? err.message : "Gagal mengganti mode GPU");
    },
  });
}

