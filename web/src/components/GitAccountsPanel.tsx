"use client";

import { CheckCircle2, GitBranch, Terminal, UserCheck } from "lucide-react";
import { useGitOverviewQuery } from "@/hooks/useAcerQueries";

export function GitAccountsPanel() {
  const { data, isLoading } = useGitOverviewQuery();

  return (
    <section className="rounded-2xl border border-slate-800/90 bg-[#0d121c]/90 p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2">
            <GitBranch className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Git & GitHub Multi-Account Suite
            </h2>
            <p className="text-xs text-slate-400">
              Sinkron dengan <code>gh auth</code> & <code>~/.config/acer/accounts.conf</code> untuk quick-switch per repository
            </p>
          </div>
        </div>
        {data?.globalAuthor.name && (
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-1.5 text-xs text-slate-300">
            Global Author:{" "}
            <strong className="text-cyan-300">{data.globalAuthor.name}</strong>{" "}
            <span className="text-slate-500">&lt;{data.globalAuthor.email}&gt;</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-6 text-center text-xs text-slate-400">
          Memuat status Git & GitHub CLI...
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Active gh auth accounts */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
              <UserCheck className="h-3.5 w-3.5 text-cyan-400" /> Akun GitHub CLI (gh)
            </div>
            {(data?.ghAccounts ?? []).length === 0 ? (
              <div className="text-xs text-slate-500">
                Belum ada akun terautentikasi di GitHub CLI.
              </div>
            ) : (
              data?.ghAccounts.map((acc) => (
                <div
                  key={acc.username}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#0b1019] px-3 py-2 text-xs"
                >
                  <span className="font-mono font-bold text-white">
                    {acc.username}
                  </span>
                  {acc.active ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" /> Active Global
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] text-slate-400">
                      Tersimpan
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Configured Local Switch Presets */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Terminal className="h-3.5 w-3.5 text-emerald-400" /> Quick Switch Presets (CLI)
            </div>
            {(data?.presets ?? []).length === 0 ? (
              <div className="text-xs text-slate-500">
                Belum ada preset di <code>~/.config/acer/accounts.conf</code>.
              </div>
            ) : (
              data?.presets.map((p) => (
                <div
                  key={p.alias}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#0b1019] px-3 py-2 text-xs"
                >
                  <div>
                    <div className="font-semibold text-white">
                      {p.githubUsername}{" "}
                      <span className="font-normal text-slate-400">
                        ({p.gitEmail || p.gitName})
                      </span>
                    </div>
                  </div>
                  <code className="rounded bg-slate-900 px-2 py-1 font-mono text-[11px] text-emerald-300">
                    acer switch {p.alias}
                  </code>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}

