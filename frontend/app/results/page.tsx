"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { apiGet, ApiError } from "@/lib/api";
import { ResultsResponse } from "@/lib/types";
import Header from "@/components/Header";
import LoadingState from "@/components/LoadingState";

const MEDALS = ["🥇", "🥈", "🥉"];
const PLACE_LABELS = ["1st Place", "2nd Place", "3rd Place"];

export default function ResultsPage() {
  const { fetchMe } = useAuthStore();
  const [results, setResults] = useState<ResultsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    let cancelled = false;
    apiGet<ResultsResponse>("/results")
      .then((data) => !cancelled && setResults(data))
      .catch((err) => !cancelled && setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again."));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        {error && <p className="text-sm text-rose">{error}</p>}

        {!error && !results && <LoadingState message="Loading results..." />}

        {results && !results.published && (
          <>
            <p className="mb-4 text-3xl">🏆</p>
            <h1 className="mb-3 font-serif text-2xl uppercase tracking-wide text-navy-deep">Results</h1>
            <p className="text-sm text-navy-deep/60">Results will be announced after voting closes.</p>
          </>
        )}

        {results && results.published && (
          <>
            <p className="mb-4 text-3xl">🏆</p>
            <h1 className="mb-10 font-serif text-2xl uppercase tracking-wide text-navy-deep">Innoverse Winners</h1>
            <div className="space-y-6">
              {results.winners.map((winner) => (
                <div key={winner.teamId} className="rounded-lg border border-gold/30 bg-white px-6 py-6 shadow-sm">
                  <p className="mb-1 text-xs uppercase tracking-[0.25em] text-navy-deep/50">
                    {PLACE_LABELS[winner.rank - 1] ?? `Place ${winner.rank}`}
                  </p>
                  <p className="mb-2 text-3xl">{MEDALS[winner.rank - 1] ?? "🏅"}</p>
                  <p className="mb-1 font-serif text-xl text-navy-deep">{winner.teamName}</p>
                  <p className="text-sm text-navy-deep/50">{winner.votes} votes</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
