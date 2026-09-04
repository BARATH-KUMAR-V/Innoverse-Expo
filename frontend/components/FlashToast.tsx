"use client";

import { useEffect, useState } from "react";

/**
 * Guidance modal shown once when the gallery mounts.
 * Positioned in the true centre of the screen.
 * Auto-dismisses after 7s, or can be closed manually.
 */
export default function FlashToast() {
  const [visible, setVisible] = useState(true);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const hideTimer = setTimeout(() => setClosing(true), 7000);
    const removeTimer = setTimeout(() => setVisible(false), 7350);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  function handleClose() {
    setClosing(true);
    setTimeout(() => setVisible(false), 350);
  }

  if (!visible) return null;

  return (
    /* Full-screen backdrop */
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-300 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
      style={{ backgroundColor: "rgba(10,14,40,0.55)", backdropFilter: "blur(2px)" }}
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
      aria-label="Voting guidance"
    >
      {/* Card — stop click from bubbling to backdrop */}
      <div
        className={`relative w-full max-w-sm rounded-xl border border-gold/30 bg-navy-deep px-7 py-8 text-cream shadow-2xl transition-all duration-300 ${
          closing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          aria-label="Dismiss"
          className="absolute right-4 top-4 text-xl leading-none text-cream/40 transition hover:text-cream"
        >
          ×
        </button>

        {/* Icon + title */}
        <div className="mb-4 flex flex-col items-center gap-2 text-center">
          <span className="text-3xl" aria-hidden="true">✨</span>
          <p className="font-serif text-lg uppercase tracking-widest text-gold">
            Make Your Vote Count
          </p>
        </div>

        {/* Divider */}
        <div className="mb-4 h-px w-full bg-gold/20" />

        {/* Bullet points */}
        <ul className="space-y-3 text-xs leading-relaxed text-cream/80">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-gold">🎨</span>
            <span>Vote based on the <strong className="text-cream">creativity and innovation</strong> of the students&apos; work.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-gold">🗳️</span>
            <span>You get <strong className="text-cream">one vote</strong> — choose thoughtfully to recognise the true winner.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-gold">🏛️</span>
            <span>
              To see the products <strong className="text-cream">in real life</strong>, visit the expo at{" "}
              <strong className="text-gold">NewGen IEDC, National Engineering College</strong>.
            </span>
          </li>
        </ul>

        {/* CTA */}
        <button
          onClick={handleClose}
          className="mt-6 w-full rounded-sm border border-gold bg-gold py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-navy-deep transition hover:bg-transparent hover:text-gold"
        >
          Got it — Let me vote!
        </button>
      </div>
    </div>
  );
}
