"use client";

import {
  CheckCircle2,
  FolderGit2,
  GitBranch,
  Globe,
  Plus,
  RefreshCw,
  Sparkles,
  Terminal,
  Trash2,
  Undo2,
  UserCheck,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useGitActionMutation, useGitOverviewQuery } from "@/hooks/useAcerQueries";

export function GitAccountsPanel() {
  const { data, isLoading } = useGitOverviewQuery();
  const gitMutation = useGitActionMutation();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAlias, setNewAlias] = useState("");
  const [newGhUser, setNewGhUser] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlias.trim() || !newGhUser.trim() || !newEmail.trim()) return;

    gitMutation.mutate(
      {
        action: "savePreset",
        preset: {
          alias: newAlias.trim().toLowerCase(),
          githubUsername: newGhUser.trim(),
          gitName: newName.trim() || newGhUser.trim(),
          gitEmail: newEmail.trim(),
        },
      },
      {
        onSuccess: () => {
          setNewAlias("");
          setNewGhUser("");
          setNewName("");
          setNewEmail("");
          setShowAddForm(false);
        },
      }
    );
  };

  const local = data?.localAuthor;

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-colors duration-200 dark:border-slate-800/90 dark:bg-[#0d121c]/90 dark:shadow-xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-50 p-2 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
            <GitBranch className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Git &amp; GitHub Multi-Account Suite
              </h2>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Interactive GUI
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sinkron dengan <code>gh auth</code> &amp; <code>configs/accounts.conf</code> untuk quick-switch per repository
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-2xs transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25"
        >
          <Plus className="h-3.5 w-3.5" />
          {showAddForm ? "Tutup Form" : "Tambah Preset"}
        </button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-400">
          <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-emerald-500" />
          Memuat status Git &amp; GitHub CLI...
        </div>
      ) : (
        <div className="space-y-4 pt-4">
          {/* Dual Status Bar: Global Author vs Local Repo Author */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* Global Author Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-950/70">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Globe className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /> Global Git Author
                </span>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  git config --global
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  {data?.globalAuthor.name || "(Belum diatur)"}
                </span>
                {data?.globalAuthor.email && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    &lt;{data.globalAuthor.email}&gt;
                  </span>
                )}
              </div>
            </div>

            {/* Local Repo Author Card */}
            <div
              className={`rounded-xl border p-3.5 transition ${
                local?.isOverridden
                  ? "border-cyan-500/50 bg-cyan-50/40 ring-1 ring-cyan-500/30 dark:border-cyan-500/40 dark:bg-cyan-950/20"
                  : "border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/70"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <FolderGit2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Author Repo Ini (Local)
                </span>
                {local?.isOverridden ? (
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full border border-cyan-400/50 bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-800 dark:border-cyan-500/40 dark:bg-cyan-500/20 dark:text-cyan-200">
                      Overridden
                    </span>
                    <button
                      type="button"
                      disabled={gitMutation.isPending}
                      onClick={() => gitMutation.mutate({ action: "resetLocalAccount" })}
                      title="Kembalikan author repo ini ke pengaturan Global"
                      className="inline-flex items-center gap-1 rounded border border-rose-300 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-300"
                    >
                      <Undo2 className="h-2.5 w-2.5" /> Reset
                    </button>
                  </div>
                ) : (
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    Ikut Global
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  {local?.name || data?.globalAuthor.name || "(Default)"}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  &lt;{local?.email || data?.globalAuthor.email || ""}&gt;
                </span>
                {local?.githubUser && (
                  <span className="rounded bg-slate-200/80 px-1.5 py-0.2 text-[10px] font-mono text-emerald-700 dark:bg-slate-800 dark:text-emerald-300">
                    GH: @{local.githubUser}
                  </span>
                )}
              </div>
              {local?.remoteUrl && (
                <div className="mt-1 truncate font-mono text-[10px] text-slate-400 dark:text-slate-500">
                  Remote: {local.remoteUrl}
                </div>
              )}
            </div>
          </div>

          {/* Collapsible Form Tambah Preset */}
          {showAddForm && (
            <form
              onSubmit={handleSavePreset}
              className="rounded-xl border border-emerald-400/40 bg-emerald-50/30 p-4 space-y-3 dark:border-emerald-500/30 dark:bg-emerald-950/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Tambah Preset Akun Baru (Disimpan ke configs/accounts.conf)
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Batal
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Alias CLI (cth: work)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="alias"
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    GitHub Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="user_github"
                    value={newGhUser}
                    onChange={(e) => setNewGhUser(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Nama Commit Git
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Lengkap"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Email Commit Git
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={gitMutation.isPending}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-500 disabled:opacity-50 dark:bg-emerald-500 dark:text-slate-950"
                >
                  {gitMutation.isPending ? "Menyimpan..." : "Simpan Preset"}
                </button>
              </div>
            </form>
          )}

          {/* 2 Kolom Interaktif */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Kolom Kiri: Akun GitHub CLI (gh auth) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  <UserCheck className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /> Akun GitHub CLI (gh)
                </div>
                <span className="text-[11px] text-slate-500">
                  {data?.ghAccounts.length ?? 0} Akun Terdaftar
                </span>
              </div>

              {(data?.ghAccounts ?? []).length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400 dark:border-slate-800">
                  Belum ada akun di GitHub CLI. Jalankan <code>gh auth login</code> di terminal.
                </div>
              ) : (
                data?.ghAccounts.map((acc) => {
                  const isCurrentLocal = local?.githubUser === acc.username;
                  return (
                    <div
                      key={acc.username}
                      className="rounded-lg border border-slate-200 bg-white p-3 space-y-2 shadow-2xs dark:border-slate-800 dark:bg-[#0b1019]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                          @{acc.username}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {acc.active && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:border-transparent dark:bg-emerald-500/15 dark:text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" /> Global Active
                            </span>
                          )}
                          {isCurrentLocal && (
                            <span className="rounded-full border border-cyan-400 bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-800 dark:border-transparent dark:bg-cyan-500/15 dark:text-cyan-300">
                              Repo Ini
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tombol Aksi Cepat */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                        {!acc.active && (
                          <button
                            type="button"
                            disabled={gitMutation.isPending}
                            onClick={() =>
                              gitMutation.mutate({
                                action: "switchGlobalGh",
                                username: acc.username,
                              })
                            }
                            className="rounded-md border border-cyan-300 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-800 transition hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20"
                          >
                            Set Global
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={gitMutation.isPending}
                          onClick={() =>
                            gitMutation.mutate({
                              action: "applyLocalAccount",
                              username: acc.username,
                              name: acc.username,
                              email: `${acc.username}@users.noreply.github.com`,
                            })
                          }
                          className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          Pakai di Repo Ini
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Kolom Kanan: Quick Switch Presets (accounts.conf) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  <Terminal className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Quick Switch Presets (accounts.conf)
                </div>
                <span className="text-[11px] text-slate-500">
                  {data?.presets.length ?? 0} Preset
                </span>
              </div>

              {(data?.presets ?? []).length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400 dark:border-slate-800">
                  Belum ada preset akun. Klik tombol <strong>+ Tambah Preset</strong> di atas untuk membuat.
                </div>
              ) : (
                data?.presets.map((p) => {
                  const isCurrentLocal = local?.githubUser === p.githubUsername;
                  return (
                    <div
                      key={p.alias}
                      className="rounded-lg border border-slate-200 bg-white p-3 space-y-2 shadow-2xs dark:border-slate-800 dark:bg-[#0b1019]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                              {p.alias}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {p.githubUsername}
                            </span>
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {p.gitName} &lt;{p.gitEmail}&gt;
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <code className="hidden sm:inline rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                            acer switch {p.alias}
                          </code>
                          <button
                            type="button"
                            disabled={gitMutation.isPending}
                            onClick={() =>
                              gitMutation.mutate({
                                action: "deletePreset",
                                alias: p.alias,
                              })
                            }
                            title={`Hapus preset ${p.alias}`}
                            className="rounded p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Tombol Aksi GUI Cepat */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                        {/* 1-Click Apply Local */}
                        <button
                          type="button"
                          disabled={gitMutation.isPending}
                          onClick={() =>
                            gitMutation.mutate({
                              action: "applyLocalPreset",
                              alias: p.alias,
                            })
                          }
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold shadow-2xs transition ${
                            isCurrentLocal
                              ? "bg-cyan-100 text-cyan-900 ring-1 ring-cyan-400 dark:bg-cyan-500/25 dark:text-cyan-200"
                              : "bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-slate-950"
                          }`}
                        >
                          <Zap className="h-3 w-3" />
                          {isCurrentLocal ? "Aktif di Repo Ini" : "⚡ Terapkan ke Repo Ini"}
                        </button>

                        {/* Set Global Author */}
                        <button
                          type="button"
                          disabled={gitMutation.isPending}
                          onClick={() =>
                            gitMutation.mutate({
                              action: "switchGlobalAuthor",
                              name: p.gitName,
                              email: p.gitEmail,
                            })
                          }
                          className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          Set Global Author
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
