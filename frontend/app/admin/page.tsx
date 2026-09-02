"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, ApiError } from "@/lib/api";
import { AdminStats } from "@/lib/types";
import StatsCard from "@/components/admin/StatsCard";
import LoadingState from "@/components/LoadingState";
import ErrorBanner from "@/components/ErrorBanner";

const POLL_INTERVAL_MS = 30_000;

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await apiGet<AdminStats>("/admin/stats");
        if (!cancelled) {
          setStats(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Loading voting statistics failed.");
      }
    }
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl uppercase tracking-wide text-navy-deep">Innoverse Admin</h1>
      <p className="mb-8 text-xs text-navy-deep/50">Near-real-time voting statistics · refreshes every 30 seconds</p>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} />
        </div>
      )}
      {!stats && !error && <LoadingState message="Loading voting statistics..." />}

      {stats && (
        <>
          <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard label="Voting Status" value={stats.votingOpen ? "🟢 Open" : "🔴 Closed"} />
            <StatsCard label="Total Votes" value={String(stats.totalVotes)} />
            <StatsCard label="Eligible Voters" value={String(stats.eligibleVoters)} />
            <StatsCard label="Participation" value={`${stats.participation}%`} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminLinkCard href="/admin/teams" label="Manage Teams" />
            <AdminLinkCard href="/admin/voting" label="Voting Control" />
            <AdminLinkCard href="/admin/rankings" label="View Rankings" />
            <AdminLinkCard href="/admin/rankings" label="Export CSV" />
          </div>
        </>
      )}
    </div>
  );
}

function AdminLinkCard({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-navy-deep/10 bg-navy-deep px-5 py-5 text-center text-sm font-medium uppercase tracking-wide text-gold shadow-sm transition hover:bg-navy"
    >
      {label}
    </Link>
  );
}
