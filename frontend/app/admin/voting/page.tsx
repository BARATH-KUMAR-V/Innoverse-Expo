"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete, ApiError } from "@/lib/api";
import { AdminStats } from "@/lib/types";
import ConfirmDialog from "@/components/ConfirmDialog";
import LoadingState from "@/components/LoadingState";
import ErrorBanner from "@/components/ErrorBanner";

export default function AdminVotingPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"start" | "stop" | "clear" | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const data = await apiGet<AdminStats>("/admin/stats");
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleConfirm() {
    if (!confirmAction) return;
    setBusy(true);
    try {
      if (confirmAction === "clear") {
        await apiDelete("/admin/votes/clear");
      } else {
        await apiPost(`/admin/voting/${confirmAction}`);
      }
      setConfirmAction(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="mb-8 font-serif text-2xl uppercase tracking-wide text-navy-deep">Voting Control</h1>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} />
        </div>
      )}
      {!stats && !error && <LoadingState message="Loading voting statistics..." />}

      {stats && (
        <div className="mx-auto max-w-md rounded-lg border border-navy-deep/10 bg-white px-8 py-10 text-center shadow-sm">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-navy-deep/50">Current Status</p>
          <p className="mb-8 font-serif text-3xl text-navy-deep">{stats.votingOpen ? "🟢 OPEN" : "🔴 CLOSED"}</p>

          {stats.votingOpen ? (
            <button
              onClick={() => setConfirmAction("stop")}
              className="w-full rounded bg-rose px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-rose/90"
            >
              Stop Voting
            </button>
          ) : (
            <button
              onClick={() => setConfirmAction("start")}
              className="w-full rounded bg-navy-deep px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-gold transition hover:bg-navy"
            >
              Start Voting
            </button>
          )}

          {/* ── Danger Zone ── */}
          <div className="mt-6 border-t border-navy-deep/10 pt-6">
            <p className="mb-3 text-xs uppercase tracking-widest text-navy-deep/40">Danger Zone</p>
            <button
              onClick={() => setConfirmAction("clear")}
              className="w-full rounded border border-rose/50 bg-rose/5 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-rose transition hover:bg-rose hover:text-white"
            >
              🗑 Clear All Votes
            </button>
          </div>
        </div>
      )}

      {confirmAction && (
        <ConfirmDialog
          title={
            confirmAction === "start"
              ? "Start Voting?"
              : confirmAction === "stop"
              ? "Stop Voting?"
              : "Clear All Votes?"
          }
          message={
            confirmAction === "start"
              ? "Students will be able to sign in and cast their votes immediately."
              : confirmAction === "stop"
              ? "Voting will immediately close and no further votes can be submitted."
              : "This will permanently delete every vote that has been cast. This action cannot be undone."
          }
          confirmLabel={
            confirmAction === "start"
              ? "Start Voting"
              : confirmAction === "stop"
              ? "Stop Voting"
              : "Yes, Clear All Votes"
          }
          danger={confirmAction === "stop" || confirmAction === "clear"}
          busy={busy}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
