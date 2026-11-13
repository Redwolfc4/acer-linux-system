"use client";

import { BatteryAndGpuPanel } from "@/components/BatteryAndGpuPanel";
import { FanControlStudio } from "@/components/FanControlStudio";
import { GitAccountsPanel } from "@/components/GitAccountsPanel";
import { KpiMetricsGrid } from "@/components/KpiMetricsGrid";
import { TopTelemetryBar } from "@/components/TopTelemetryBar";
import { VisualRgbKeyboard } from "@/components/VisualRgbKeyboard";
import { useTelemetryQuery } from "@/hooks/useAcerQueries";
import { useAcerStore } from "@/store/useAcerStore";

export default function DashboardPage() {
  const activeTab = useAcerStore((s) => s.activeTab);
  const telemetryQuery = useTelemetryQuery();

  const showAll = activeTab === "all";

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(14,165,233,0.08),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(244,63,94,0.05),_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.08),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(244,63,94,0.06),_transparent_50%)]">
      <TopTelemetryBar
        telemetry={telemetryQuery.data}
        isFetching={telemetryQuery.isFetching}
        onRefresh={() => telemetryQuery.refetch()}
      />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {telemetryQuery.isError && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-800 shadow-xs dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-200">
            Gagal membaca telemetry hardware:{" "}
            {telemetryQuery.error instanceof Error
              ? telemetryQuery.error.message
              : "Unknown error"}
          </div>
        )}

        {(showAll || activeTab === "fans" || activeTab === "power") && (
          <KpiMetricsGrid telemetry={telemetryQuery.data} />
        )}

        {(showAll || activeTab === "fans") && (
          <FanControlStudio telemetry={telemetryQuery.data} />
        )}

        {(showAll || activeTab === "rgb") && <VisualRgbKeyboard />}

        {(showAll || activeTab === "power") && (
          <BatteryAndGpuPanel telemetry={telemetryQuery.data} />
        )}

        {(showAll || activeTab === "git") && <GitAccountsPanel />}
      </main>
    </div>
  );
}

