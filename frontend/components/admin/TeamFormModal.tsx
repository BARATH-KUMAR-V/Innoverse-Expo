"use client";

import { useState, FormEvent } from "react";
import { AdminTeam } from "@/lib/types";
import { apiUpload, ApiError } from "@/lib/api";

interface TeamFormModalProps {
  team: AdminTeam | null; // null = create mode
  onClose: () => void;
  onSaved: () => void;
}

export default function TeamFormModal({ team, onClose, onSaved }: TeamFormModalProps) {
  const [teamName, setTeamName] = useState(team?.teamName ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) {
      setError("Team name is required.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("teamName", teamName.trim());
    if (imageFile) formData.append("image", imageFile);
    if (videoFile) formData.append("video", videoFile);

    try {
      if (team) {
        await apiUpload(`/admin/teams/${team.id}`, "PUT", formData);
      } else {
        await apiUpload("/admin/teams", "POST", formData);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/70 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-gold/30 bg-cream px-7 py-8 shadow-2xl">
        <h2 className="mb-6 text-center font-serif text-xl uppercase tracking-wide text-navy-deep">
          {team ? "Edit Team" : "Add Team"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="teamName" className="mb-1 block text-xs uppercase tracking-wide text-navy-deep/60">
              Team Name
            </label>
            <input
              id="teamName"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full rounded border border-navy-deep/20 bg-white px-3 py-2 text-sm text-navy-deep focus:border-gold focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="image" className="mb-1 block text-xs uppercase tracking-wide text-navy-deep/60">
              Product Image {team?.imageUrl ? "(leave blank to keep current)" : ""}
            </label>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-navy-deep/70"
            />
          </div>

          <div>
            <label htmlFor="video" className="mb-1 block text-xs uppercase tracking-wide text-navy-deep/60">
              Product Video {team?.videoUrl ? "(leave blank to keep current)" : ""}
            </label>
            <input
              id="video"
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-navy-deep/70"
            />
          </div>

          {error && (
            <p role="alert" className="rounded border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded bg-navy-deep px-5 py-3 text-sm font-medium uppercase tracking-wide text-gold transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save Team"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded border border-navy-deep/20 px-5 py-3 text-sm font-medium uppercase tracking-wide text-navy-deep transition hover:border-navy-deep/40 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
