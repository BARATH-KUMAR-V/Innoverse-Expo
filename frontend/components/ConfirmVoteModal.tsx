"use client";

import { formatEventDateTime } from "@/lib/format-datetime";

interface ConfirmVoteModalProps {
  teamName: string;
  winnersAnnounceAt: string | null;
  submitting: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmVoteModal({
  teamName,
  winnersAnnounceAt,
  submitting,
  errorMessage,
  onConfirm,
  onCancel,
}: ConfirmVoteModalProps) {
  const announceLabel = formatEventDateTime(winnersAnnounceAt);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/70 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-vote-title"
    >
      <div className="w-full max-w-md rounded-lg border border-gold/30 bg-cream px-8 py-9 text-center shadow-2xl">
        <p className="mb-1 text-gold" aria-hidden="true">
          ✨
        </p>
        <h2 id="confirm-vote-title" className="mb-1 font-serif text-xl uppercase tracking-wide text-navy-deep">
          Cast Your Vote
        </h2>
        <p className="mb-5 font-serif text-2xl text-navy">{teamName}</p>

        <p className="mb-4 text-sm leading-relaxed text-navy-deep/70">
          Are you sure you want to vote for this team?
          <br />
          <span className="font-medium text-navy-deep">Your vote cannot be changed.</span>
        </p>

        <ul className="mb-6 space-y-1 text-left text-xs text-navy-deep/60">
          <li>• One vote per student</li>
          <li>• Vote is anonymous</li>
          <li>• Results announced {announceLabel || "after voting closes"}</li>
        </ul>

        {errorMessage && (
          <p role="alert" className="mb-4 rounded border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">
            {errorMessage}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 rounded bg-navy-deep px-5 py-3 text-sm font-medium uppercase tracking-wide text-gold transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Recording your vote..." : "Confirm Vote"}
          </button>
          <button
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 rounded border border-navy-deep/20 px-5 py-3 text-sm font-medium uppercase tracking-wide text-navy-deep transition hover:border-navy-deep/40 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
