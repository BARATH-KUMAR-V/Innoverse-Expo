"use client";

import { useEffect, useState } from "react";

/**
 * The "Make Your Vote Count" guidance message shown once whenever the
 * gallery mounts. Auto-dismisses after ~5s, can be closed manually, and
 * never blocks interaction with the gallery underneath it.
 */
export default function FlashToast() {
  const [visible, setVisible] = useState(true);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const hideTimer = setTimeout(() => setClosing(true), 5000);
    const removeTimer = setTimeout(() => setVisible(false), 5350);
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
    <div
      role="status"
      className={`fixed left-1/2 top-6 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-md border border-gold/30 bg-navy-deep px-5 py-4 text-cream shadow-xl transition-all duration-300 ${
        closing ? "-translate-y-3 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-gold" aria-hidden="true">
          ✨
        </span>
        <div className="flex-1">
          <p className="font-serif text-sm tracking-wide text-gold">MAKE YOUR VOTE COUNT</p>
          <p className="mt-1 text-xs leading-relaxed text-cream/80">
            Vote based on the creativity and innovation of the students. Your thoughtful choice will help us select the true winners.
          </p>
        </div>
        <button onClick={handleClose} aria-label="Dismiss" className="text-lg leading-none text-cream/50 transition hover:text-cream">
          ×
        </button>
      </div>
    </div>
  );
}
