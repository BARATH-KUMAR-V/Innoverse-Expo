"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store/uiStore";
import { googleLoginUrl } from "@/lib/api";

export default function LoginModal() {
  const { loginModalOpen, closeLoginModal } = useUIStore();

  useEffect(() => {
    if (!loginModalOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeLoginModal();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [loginModalOpen, closeLoginModal]);

  if (!loginModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-slide-in items-center justify-center bg-navy-deep/70 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      onClick={closeLoginModal}
    >
      <div
        className="relative w-full max-w-sm rounded-lg border border-gold/30 bg-cream px-8 py-10 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeLoginModal}
          aria-label="Close"
          className="absolute right-4 top-4 text-lg text-navy-deep/40 transition hover:text-navy-deep"
        >
          ×
        </button>

        <p className="font-serif text-xs uppercase tracking-[0.25em] text-navy">Innoverse</p>
        <p className="mb-6 text-[11px] uppercase tracking-[0.2em] text-navy/50">Prompt to Product Expo</p>

        <h2 id="login-modal-title" className="mb-3 font-serif text-2xl text-navy-deep">
          Ready to vote?
        </h2>
        <p className="mb-8 text-sm leading-relaxed text-navy-deep/70">
          Sign in using your college Google account to continue.
        </p>

        <a
          href={googleLoginUrl()}
          className="flex w-full items-center justify-center gap-3 rounded border border-navy-deep/10 bg-white px-5 py-3 text-sm font-medium text-navy-deep shadow-sm transition hover:border-gold hover:shadow-md"
        >
          <GoogleIcon />
          Continue with Google
        </a>

        <p className="mt-6 text-xs text-navy-deep/50">Only @nec.edu.in accounts are eligible for voting.</p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 009 18z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 013.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.05l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}
