"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { TeamDetail, MyVote, VotingStatus } from "@/lib/types";
import Header from "@/components/Header";
import VideoPlayer from "@/components/VideoPlayer";
import ConfirmVoteModal from "@/components/ConfirmVoteModal";
import LoadingState from "@/components/LoadingState";
import ErrorBanner from "@/components/ErrorBanner";

export default function ProductDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { status, fetchMe } = useAuthStore();

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [myVote, setMyVote] = useState<MyVote | null>(null);
  const [votingStatus, setVotingStatus] = useState<VotingStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
    }
    if (lightboxOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    async function load() {
      try {
        const [teamData, voteData, statusData] = await Promise.all([
          apiGet<TeamDetail>(`/teams/${id}`),
          apiGet<MyVote>("/votes/my-vote"),
          apiGet<VotingStatus>("/votes/status"),
        ]);
        if (cancelled) return;
        setTeam(teamData);
        setMyVote(voteData);
        setVotingStatus(statusData);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof ApiError ? err.message : "This product is currently unavailable.");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [status, id]);

  async function handleConfirmVote() {
    if (!team) return;
    setSubmitting(true);
    setVoteError(null);
    try {
      await apiPost("/votes", { teamId: team.id });
      router.push("/success");
    } catch (err) {
      if (err instanceof ApiError) {
        setVoteError(err.message);
        if (err.code === "already_voted") {
          setMyVote({ hasVoted: true, teamId: null });
        }
      } else {
        setVoteError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "idle" || status === "loading" || status === "unauthenticated") {
    return <LoadingState message="Loading product..." />;
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/gallery"
          className="mb-8 inline-flex items-center gap-2 text-sm text-navy-deep/60 transition hover:text-gold"
        >
          ← Back to Gallery
        </Link>

        {loadError && <ErrorBanner message={loadError} />}
        {!loadError && !team && <LoadingState message="Loading product..." />}

        {team && (
          <>
            <h1 className="mb-8 text-center font-serif text-3xl uppercase tracking-wide text-navy-deep sm:text-4xl">
              {team.teamName}
            </h1>

            <div
              className="group relative mb-10 aspect-[16/10] w-full overflow-hidden rounded-lg border border-navy-deep/10 bg-navy-deep/5 shadow-sm"
              style={team.imageUrl ? { cursor: "zoom-in" } : undefined}
              onClick={() => team.imageUrl && setLightboxOpen(true)}
            >
              {team.imageUrl && (
                <>
                  <Image
                    src={team.imageUrl}
                    alt={team.teamName}
                    fill
                    sizes="(min-width: 768px) 768px, 100vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    priority
                  />
                  {/* hover hint */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-100 sm:opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <span className="rounded-full bg-black/50 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
                      View Full Image
                    </span>
                  </div>
                </>
              )}
            </div>

            {team.videoUrl && (
              <div className="mb-10">
                <p className="mb-3 text-center text-xs uppercase tracking-[0.3em] text-gold">Product Video</p>
                <VideoPlayer src={team.videoUrl} teamName={team.teamName} />
              </div>
            )}

            <div className="flex flex-col items-center gap-3 pb-4 pt-2">
              {votingStatus?.votingOpen === false ? (
                <p className="rounded border border-rose/30 bg-rose/10 px-5 py-3 text-sm text-rose">
                  Voting has closed. No further votes can be submitted.
                </p>
              ) : myVote?.hasVoted ? (
                <p className="rounded border border-navy-deep/15 bg-navy-deep/5 px-5 py-3 text-sm text-navy-deep/70">
                  You have already cast your vote.
                </p>
              ) : (
                <button
                  onClick={() => setConfirmOpen(true)}
                  className="rounded-sm bg-navy-deep px-12 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-gold shadow-md transition hover:bg-navy"
                >
                  Make Your Vote
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {confirmOpen && team && (
        <ConfirmVoteModal
          teamName={team.teamName}
          winnersAnnounceAt={votingStatus?.winnersAnnounceAt ?? null}
          submitting={submitting}
          errorMessage={voteError}
          onConfirm={handleConfirmVote}
          onCancel={() => {
            if (!submitting) {
              setConfirmOpen(false);
              setVoteError(null);
            }
          }}
        />
      )}

      {/* ── Lightbox ── */}
      {lightboxOpen && team?.imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          {/* close button */}
          <button
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
            aria-label="Close"
          >
            ✕
          </button>

          {/* full image */}
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={team.imageUrl}
              alt={team.teamName}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
