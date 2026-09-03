"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { apiGet } from "@/lib/api";
import { EventSettings } from "@/lib/types";
import { formatEventDateTime } from "@/lib/format-datetime";
import LoginModal from "@/components/LoginModal";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  domain: "Only @nec.edu.in college accounts are eligible for voting.",
  server: "Unable to sign in. Please try again.",
};

const VOTING_STATE_LABELS: Record<EventSettings["votingState"], string> = {
  NOT_STARTED: "Voting Not Started",
  LIVE: "Voting Is Live",
  CLOSED: "Voting Closed",
  RESULTS_PUBLISHED: "Results Published",
};

function LandingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, fetchMe } = useAuthStore();
  const { openLoginModal } = useUIStore();
  const [event, setEvent] = useState<EventSettings | null>(null);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    apiGet<EventSettings>("/event-settings")
      .then(setEvent)
      .catch(() => setEvent(null));
  }, []);

  const authError = searchParams.get("authError");

  function handleCastVote() {
    if (status === "authenticated") {
      router.push("/gallery");
    } else {
      openLoginModal();
    }
  }

  return (
    <main className="min-h-screen bg-navy-deep text-cream">
      <LoginModal />

      <section className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
        <p className="mb-6 text-xs uppercase tracking-[0.4em] text-gold">Prompt to Product Expo</p>
        <h1 className="mb-6 font-serif text-5xl leading-tight sm:text-6xl">INNOVERSE</h1>
        <div className="mb-10 h-px w-16 bg-gold/50" />
        <p className="mb-8 max-w-xl text-base leading-relaxed text-cream/70 sm:text-lg">
          Witness the creative genius of student designers who transformed AI-generated ideas into stunning 3D
          products.
        </p>

        {event && (
          <span className="mb-10 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs uppercase tracking-wide text-gold">
            {VOTING_STATE_LABELS[event.votingState]}
          </span>
        )}

        {authError && (
          <p role="alert" className="mb-8 rounded border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-cream">
            {AUTH_ERROR_MESSAGES[authError] ?? AUTH_ERROR_MESSAGES.server}
          </p>
        )}

        <button
          onClick={handleCastVote}
          className="rounded-sm border border-gold bg-gold px-10 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-navy-deep transition hover:bg-transparent hover:text-gold"
        >
          Cast Your Vote Now
        </button>
      </section>

      <div className="mx-auto max-w-2xl border-t border-gold/20" />

      <section className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="mb-8 text-sm uppercase tracking-[0.3em] text-gold">✨ See the Physical Exhibition ✨</p>
        <dl className="grid grid-cols-1 gap-6 text-sm text-cream/80 sm:grid-cols-2">
          <div>
            <dt className="mb-1 text-xs uppercase tracking-wide text-cream/50">Location</dt>
            <dd>{event?.expoVenue || "To be announced"}</dd>
          </div>
          <div>
            <dt className="mb-1 text-xs uppercase tracking-wide text-cream/50">Hours</dt>
            <dd>{event?.expoDate || "To be announced"}</dd>
          </div>
          <div>
            <dt className="mb-1 text-xs uppercase tracking-wide text-cream/50">Voting Closes</dt>
            <dd>{formatEventDateTime(event?.votingEndsAt) || "To be announced"}</dd>
          </div>
          <div>
            <dt className="mb-1 text-xs uppercase tracking-wide text-cream/50">Winners Announced</dt>
            <dd>{formatEventDateTime(event?.winnersAnnounceAt) || "To be announced"}</dd>
          </div>
        </dl>
      </section>

      <div className="mx-auto max-w-2xl border-t border-gold/20" />

      <section className="mx-auto max-w-xl px-6 py-16">
        <ul className="space-y-3 text-center text-sm text-cream/80">
          <li>✓ Only @nec.edu.in emails</li>
          <li>✓ One vote per student</li>
          <li>✓ Votes are anonymous</li>
          <li>✓ Based on creativity &amp; innovation</li>
        </ul>
      </section>
    </main>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={null}>
      <LandingContent />
    </Suspense>
  );
}
