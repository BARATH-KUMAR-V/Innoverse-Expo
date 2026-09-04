"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { apiGet, ApiError } from "@/lib/api";
import { GalleryTeam, MyVote, VotingStatus } from "@/lib/types";
import { formatEventDateTime } from "@/lib/format-datetime";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import FlashToast from "@/components/FlashToast";
import LoadingState from "@/components/LoadingState";
import ErrorBanner from "@/components/ErrorBanner";

export default function GalleryPage() {
  const router = useRouter();
  const { status, fetchMe } = useAuthStore();
  const [teams, setTeams] = useState<GalleryTeam[] | null>(null);
  const [myVote, setMyVote] = useState<MyVote | null>(null);
  const [votingStatus, setVotingStatus] = useState<VotingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    async function load() {
      try {
        const [teamsData, voteData, statusData] = await Promise.all([
          apiGet<GalleryTeam[]>("/teams"),
          apiGet<MyVote>("/votes/my-vote"),
          apiGet<VotingStatus>("/votes/status"),
        ]);
        if (cancelled) return;
        setTeams(teamsData);
        setMyVote(voteData);
        setVotingStatus(statusData);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [status]);

  // Called by any card after a successful vote — mark vote as cast for all cards
  const handleVoteSuccess = useCallback(() => {
    setMyVote({ hasVoted: true, teamId: null });
  }, []);

  if (status === "idle" || status === "loading" || status === "unauthenticated") {
    return <LoadingState message="Loading products..." />;
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <FlashToast />

      <section className="mx-auto max-w-6xl px-6 pb-6 pt-12 text-center">
        <p className="mb-2 text-xs uppercase tracking-[0.35em] text-gold">Innoverse</p>
        <h1 className="mb-3 font-serif text-3xl text-navy-deep sm:text-4xl">Vote for Creative Excellence</h1>
        <p className="mb-6 text-sm text-navy-deep/60">Browse &amp; vote for your favorite product</p>

        <div className="mb-2 flex flex-wrap items-center justify-center gap-4 text-sm">
          {votingStatus?.votingOpen === true && (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-600/30 bg-emerald-50 px-4 py-1.5 text-emerald-700">
              🟢 Voting Open
            </span>
          )}
          {votingStatus?.votingOpen === false && (
            <span className="inline-flex items-center gap-2 rounded-full border border-rose/30 bg-rose/10 px-4 py-1.5 text-rose">
              🔴 Voting Closed
            </span>
          )}
          {votingStatus?.votingEndsAt && (
            <span className="text-navy-deep/50">⏰ Closes: {formatEventDateTime(votingStatus.votingEndsAt)}</span>
          )}
        </div>
        <p className="text-xs text-navy-deep/50">Vote based on the creativity and innovation of the students.</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        {error && <ErrorBanner message={error} />}
        {!error && teams === null && <LoadingState message="Loading products..." />}
        {!error && teams !== null && teams.length === 0 && (
          <p className="py-16 text-center text-sm text-navy-deep/50">
            Teams will appear here once the admin adds them.
          </p>
        )}
        {teams && teams.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team, index) => (
              <ProductCard
                key={team.id}
                team={team}
                myVote={myVote}
                votingStatus={votingStatus}
                onVoteSuccess={handleVoteSuccess}
                priority={index < 6}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
