"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, API_URL, ApiError } from "@/lib/api";
import { RankingRow, AdminStats } from "@/lib/types";
import ConfirmDialog from "@/components/ConfirmDialog";
import LoadingState from "@/components/LoadingState";
import ErrorBanner from "@/components/ErrorBanner";

export default function AdminRankingsPage() {
  const [rankings, setRankings] = useState<RankingRow[] | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function load() {
    try {
      const [rankingsData, statsData] = await Promise.all([
        apiGet<RankingRow[]>("/admin/rankings"),
        apiGet<AdminStats>("/admin/stats"),
      ]);
      setRankings(rankingsData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handlePublish() {
    setBusy(true);
    try {
      await apiPost("/admin/results/publish");
      setConfirmPublish(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/export`, { credentials: "include" });
      if (!res.ok) throw new Error("Export failed.");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "votes.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Could not export CSV. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  const totalVotes = rankings?.reduce((sum, r) => sum + r.votes, 0) ?? 0;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-2xl uppercase tracking-wide text-navy-deep">Rankings</h1>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="rounded border border-navy-deep/20 px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-navy-deep transition hover:border-gold disabled:opacity-60"
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
          <button
            onClick={() => setConfirmPublish(true)}
            disabled={stats?.winnersPublished}
            className="rounded bg-navy-deep px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-gold transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-50"
          >
            {stats?.winnersPublished ? "Winners Published" : "Display Winners"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} />
        </div>
      )}
      {!rankings && !error && <LoadingState message="Loading rankings..." />}

      {rankings && rankings.length === 0 && <p className="py-16 text-center text-sm text-navy-deep/50">No teams yet.</p>}

      {rankings && rankings.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-navy-deep/10 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy-deep text-cream">
              <tr>
                <th className="px-5 py-3 font-medium uppercase tracking-wide">Rank</th>
                <th className="px-5 py-3 font-medium uppercase tracking-wide">Team</th>
                <th className="px-5 py-3 text-right font-medium uppercase tracking-wide">Votes</th>
                <th className="px-5 py-3 text-right font-medium uppercase tracking-wide">Share</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((row, index) => (
                <tr key={row.teamId} className="border-t border-navy-deep/10">
                  <td className="px-5 py-3 text-navy-deep/70">{index + 1}</td>
                  <td className="px-5 py-3 font-medium text-navy-deep">{row.teamName}</td>
                  <td className="px-5 py-3 text-right text-navy-deep">{row.votes}</td>
                  <td className="px-5 py-3 text-right text-navy-deep/60">
                    {totalVotes > 0 ? `${((row.votes / totalVotes) * 100).toFixed(1)}%` : "0.0%"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmPublish && (
        <ConfirmDialog
          title="Display Winners?"
          message="The top 3 teams will become publicly visible to all students on the Results page. This is based on live vote counts."
          confirmLabel="Publish Winners"
          busy={busy}
          onConfirm={handlePublish}
          onCancel={() => setConfirmPublish(false)}
        />
      )}
    </div>
  );
}
