"use client";

import { useState, FormEvent } from "react";
import { AdminTeam } from "@/lib/types";
import { apiPost, apiPut, ApiError } from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";

interface SignedUpload {
  bucket: string;
  path: string;
  token: string;
  publicUrl: string;
}

/**
 * Vercel Route Handlers cap request bodies at ~4.5MB, far below the 150MB
 * video limit this app supports, so the file goes straight from the browser
 * to Supabase Storage via a signed URL instead of through the API - see
 * /api/admin/uploads/sign.
 */
async function uploadDirectToStorage(file: File, kind: "image" | "video"): Promise<string> {
  const signed = await apiPost<SignedUpload>("/admin/uploads/sign", {
    kind,
    fileName: file.name,
    contentType: file.type,
    fileSize: file.size,
  });

  const { error } = await supabaseBrowser.storage.from(signed.bucket).uploadToSignedUrl(signed.path, signed.token, file);
  if (error) {
    throw new ApiError(502, "storage_error", "Could not upload the file. Please try again.");
  }

  return signed.publicUrl;
}

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

    try {
      const [imageUrl, videoUrl] = await Promise.all([
        imageFile ? uploadDirectToStorage(imageFile, "image") : Promise.resolve(undefined),
        videoFile ? uploadDirectToStorage(videoFile, "video") : Promise.resolve(undefined),
      ]);

      const body = { teamName: teamName.trim(), imageUrl, videoUrl };
      if (team) {
        await apiPut(`/admin/teams/${team.id}`, body);
      } else {
        await apiPost("/admin/teams", body);
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
