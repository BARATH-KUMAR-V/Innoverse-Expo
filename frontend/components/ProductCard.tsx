"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { GalleryTeam, MyVote, VotingStatus } from "@/lib/types";
import ConfirmVoteModal from "@/components/ConfirmVoteModal";
import { apiPost, ApiError } from "@/lib/api";
import { useRouter } from "next/navigation";

interface ProductCardProps {
  team: GalleryTeam;
  myVote: MyVote | null;
  votingStatus: VotingStatus | null;
  onVoteSuccess: (teamId: string) => void;
  priority?: boolean;
}

export default function ProductCard({
  team,
  myVote,
  votingStatus,
  onVoteSuccess,
  priority = false,
}: ProductCardProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [videoLoaded, setVideoLoaded] = useState(false);
  // isPlaying = video element has emitted the "playing" event (actually rendering frames)
  const [isPlaying, setIsPlaying] = useState(false);
  // isBuffering = play() called but "playing" not yet fired
  const [isBuffering, setIsBuffering] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const wantsToPlay = useRef(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  const hasVoted = myVote?.hasVoted ?? false;
  const votingOpen = votingStatus?.votingOpen ?? true;
  const hasVideo = Boolean(team.videoUrl);

  // ── Device detection ─────────────────────────────────────────────────────
  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  // ── Wire up video events once ────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // "playing" fires when frames are actually rendering — no more white flash
    const onPlaying = () => {
      if (wantsToPlay.current) {
        setIsPlaying(true);
        setIsBuffering(false);
      }
    };

    // Stall / wait events — show buffering ring if we're supposed to be playing
    const onWaiting = () => {
      if (wantsToPlay.current) setIsBuffering(true);
    };

    // If video errors, silently fall back to image
    const onError = () => {
      wantsToPlay.current = false;
      setIsPlaying(false);
      setIsBuffering(false);
    };

    video.addEventListener("playing", onPlaying);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("stalled", onWaiting);
    video.addEventListener("error", onError);
    return () => {
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("stalled", onWaiting);
      video.removeEventListener("error", onError);
    };
  }, []);

  // ── Lazy-load src on first interaction ───────────────────────────────────
  const loadVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video || videoLoaded || !team.videoUrl) return;
    video.src = team.videoUrl;
    video.load();
    setVideoLoaded(true);
  }, [videoLoaded, team.videoUrl]);

  const playVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    loadVideo();
    wantsToPlay.current = true;
    setIsBuffering(true); // show spinner immediately; "playing" event will clear it
    video.play().catch(() => {
      wantsToPlay.current = false;
      setIsBuffering(false);
    });
  }, [loadVideo]);

  const pauseVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    wantsToPlay.current = false;
    video.pause();
    video.currentTime = 0;
    setIsPlaying(false);
    setIsBuffering(false);
  }, []);

  // ── Desktop hover ────────────────────────────────────────────────────────
  const handleMouseEnter = useCallback(() => {
    if (isTouchDevice || !hasVideo) return;
    playVideo();
  }, [isTouchDevice, hasVideo, playVideo]);

  const handleMouseLeave = useCallback(() => {
    if (isTouchDevice || !hasVideo) return;
    pauseVideo();
  }, [isTouchDevice, hasVideo, pauseVideo]);

  // ── Mobile IntersectionObserver ──────────────────────────────────────────
  useEffect(() => {
    if (!isTouchDevice || !hasVideo) return;
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          playVideo();
        } else {
          pauseVideo();
        }
      },
      {
        // Remove top dead zone so it starts playing sooner as it scrolls up,
        // but keep a bottom margin so it doesn't play if barely peeking in.
        // Use a more forgiving threshold (0.6) so it plays even on small phones
        // where the card takes up most of the screen.
        rootMargin: "0px 0px -15% 0px",
        threshold: 0.6,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isTouchDevice, hasVideo, playVideo, pauseVideo]);

  // ── Vote submit ──────────────────────────────────────────────────────────
  async function handleConfirmVote() {
    setSubmitting(true);
    setVoteError(null);
    try {
      await apiPost("/votes", { teamId: team.id });
      setConfirmOpen(false);
      onVoteSuccess(team.id);
      router.push("/success");
    } catch (err) {
      if (err instanceof ApiError) {
        setVoteError(err.message);
        if (err.code === "already_voted") {
          onVoteSuccess(team.id);
        }
      } else {
        setVoteError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div
        ref={cardRef}
        className="group relative overflow-hidden rounded-xl border border-navy-deep/10 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* ── Media area ── */}
        {/*
          bg-black prevents any white flash — the image sits on top,
          the video cross-fades in only once the "playing" event fires.
        */}
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-black">

          {/* Static image — stays visible until video is ACTUALLY playing */}
          {team.imageUrl ? (
            <Image
              src={team.imageUrl}
              alt={team.teamName}
              fill
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
              className={`object-cover object-bottom transition-opacity duration-500 ${
                isPlaying ? "opacity-0" : "opacity-100"
              }`}
              priority={priority}
            />
          ) : (
            <div
              className={`absolute inset-0 flex items-center justify-center text-white/25 transition-opacity duration-500 ${
                isPlaying ? "opacity-0" : "opacity-100"
              }`}
            >
              <PlaceholderIcon />
            </div>
          )}

          {/* Video — lazy-loaded; opacity transitions only after "playing" fires */}
          {hasVideo && (
            <video
              ref={videoRef}
              muted
              playsInline
              loop
              preload="metadata"
              aria-label={`${team.teamName} product video`}
              className={`absolute inset-0 h-full w-full object-cover ${
                team.teamName.trim().toUpperCase() === "MYSTREY SOLVER"
                  ? "object-bottom"
                  : "object-[50%_65%]"
              } transition-opacity duration-500 ${
                isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            />
          )}

          {/* Buffering spinner — shown while video is loading but hasn't rendered yet */}
          {isBuffering && !isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </div>
          )}

          {/* Play hint — shown on desktop hover before playback starts */}
          {hasVideo && !isTouchDevice && !isPlaying && !isBuffering && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
                <PlayIcon />
              </span>
            </div>
          )}
        </div>

        {/* ── Card footer ── */}
        <div className="border-t border-gold/20 px-5 py-4 text-center">

          {votingOpen === false ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose/30 bg-rose/10 px-4 py-1.5 text-xs text-rose">
              🔴 Voting Closed
            </span>
          ) : hasVoted ? (
            myVote?.teamId === team.id ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-600/30 bg-emerald-50 px-4 py-1.5 text-xs text-emerald-700">
                ✓ Your Choice
              </span>
            ) : null
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmOpen(true);
              }}
              className="w-full rounded-sm bg-navy-deep px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold shadow-sm transition hover:bg-navy active:scale-95"
            >
              Cast Your Vote
            </button>
          )}
        </div>
      </div>

      {/* ── Confirm modal ── */}
      {confirmOpen && (
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
    </>
  );
}

function PlaceholderIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
