"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import LoginModal from "@/components/LoginModal";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  domain: "Only @nec.edu.in college accounts are eligible for voting.",
  server: "Unable to sign in. Please try again.",
};

function LandingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, fetchMe } = useAuthStore();
  const { openLoginModal } = useUIStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

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
        <p className="mb-12 max-w-xl text-base leading-relaxed text-cream/70 sm:text-lg">
          Witness the creative genius of student designers who transformed AI-generated ideas into stunning 3D
          products.
        </p>

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
            <dd>Ground Floor, NewGen IEDC, Tech Park, National Engineering College</dd>
          </div>
          <div>
            <dt className="mb-1 text-xs uppercase tracking-wide text-cream/50">Hours</dt>
            <dd>Thursday – Saturday, 10:00 AM – 5:00 PM</dd>
          </div>
          <div>
            <dt className="mb-1 text-xs uppercase tracking-wide text-cream/50">Voting Closes</dt>
            <dd>Saturday, 1:30 PM</dd>
          </div>
          <div>
            <dt className="mb-1 text-xs uppercase tracking-wide text-cream/50">Winners Announced</dt>
            <dd>Saturday, 2:00 PM</dd>
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
