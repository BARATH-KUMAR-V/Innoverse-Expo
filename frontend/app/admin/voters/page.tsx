"use client";

import { useEffect, useState } from "react";
import { apiGet, ApiError } from "@/lib/api";
import LoadingState from "@/components/LoadingState";
import ErrorBanner from "@/components/ErrorBanner";

interface VoterRow {
  voterEmail: string;
  voterName: string;
  teamName: string;
  votedAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminVotersPage() {
  const [voters, setVoters] = useState<VoterRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiGet<VoterRow[]>("/admin/voters")
      .then(setVoters)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Something went wrong.")
      );
  }, []);

  const filtered = voters?.filter(
    (v) =>
      v.voterEmail.toLowerCase().includes(search.toLowerCase()) ||
      v.voterName.toLowerCase().includes(search.toLowerCase()) ||
      v.teamName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header row */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl uppercase tracking-wide text-navy-deep">
            Voter List
          </h1>
          <p className="mt-1 text-xs text-navy-deep/50">
            {voters ? `${voters.length} vote${voters.length !== 1 ? "s" : ""} cast` : "Loading…"}
          </p>
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="Search by name, email or team…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded border border-navy-deep/15 bg-white px-4 py-2 text-sm text-navy-deep placeholder-navy-deep/40 shadow-sm outline-none focus:border-gold sm:w-72"
        />
      </div>

      {error && <ErrorBanner message={error} />}
      {!voters && !error && <LoadingState message="Loading voters…" />}

      {filtered && filtered.length === 0 && (
        <p className="py-16 text-center text-sm text-navy-deep/50">
          {search ? "No voters match your search." : "No votes have been cast yet."}
        </p>
      )}

      {filtered && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-navy-deep/10 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy-deep text-cream">
              <tr>
                <th className="px-5 py-3 font-medium uppercase tracking-wide">#</th>
                <th className="px-5 py-3 font-medium uppercase tracking-wide">Name</th>
                <th className="px-5 py-3 font-medium uppercase tracking-wide">Email</th>
                <th className="px-5 py-3 font-medium uppercase tracking-wide">Voted For</th>
                <th className="px-5 py-3 font-medium uppercase tracking-wide">Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => (
                <tr
                  key={v.voterEmail}
                  className="border-t border-navy-deep/10 transition hover:bg-navy-deep/[0.03]"
                >
                  <td className="px-5 py-3 text-navy-deep/40">{i + 1}</td>
                  <td className="px-5 py-3 font-medium text-navy-deep">{v.voterName}</td>
                  <td className="px-5 py-3 text-navy-deep/70">
                    <a
                      href={`mailto:${v.voterEmail}`}
                      className="hover:text-gold hover:underline"
                    >
                      {v.voterEmail}
                    </a>
                  </td>
                  <td className="px-5 py-3 text-navy-deep">{v.teamName}</td>
                  <td className="px-5 py-3 text-navy-deep/50">{formatDate(v.votedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
