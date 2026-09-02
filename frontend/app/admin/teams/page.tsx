"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { apiGet, apiDelete, ApiError } from "@/lib/api";
import { AdminTeam } from "@/lib/types";
import TeamFormModal from "@/components/admin/TeamFormModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import LoadingState from "@/components/LoadingState";
import ErrorBanner from "@/components/ErrorBanner";

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<AdminTeam[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formTeam, setFormTeam] = useState<AdminTeam | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminTeam | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadTeams() {
    try {
      const data = await apiGet<AdminTeam[]>("/admin/teams");
      setTeams(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  useEffect(() => {
    loadTeams();
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await apiDelete<{ success: boolean; archived: boolean; message: string }>(
        `/admin/teams/${deleteTarget.id}`
      );
      setNotice(result.message);
      setDeleteTarget(null);
      await loadTeams();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-2xl uppercase tracking-wide text-navy-deep">Manage Teams</h1>
        <button
          onClick={() => setFormTeam("new")}
          className="rounded bg-navy-deep px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-gold transition hover:bg-navy"
        >
          + Add Team
        </button>
      </div>

      {notice && (
        <div className="mb-6 rounded border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-navy-deep">{notice}</div>
      )}
      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} />
        </div>
      )}
      {!teams && !error && <LoadingState message="Loading teams..." />}

      {teams && teams.length === 0 && (
        <p className="py-16 text-center text-sm text-navy-deep/50">
          No teams yet. Use the Add Team button above to create the first one.
        </p>
      )}

      {teams && teams.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <div key={team.id} className="overflow-hidden rounded-lg border border-navy-deep/10 bg-white shadow-sm">
              <div className="relative aspect-[4/3] w-full bg-navy-deep/5">
                {team.imageUrl && (
                  <Image src={team.imageUrl} alt={team.teamName} fill sizes="400px" className="object-cover" />
                )}
                {!team.isActive && (
                  <span className="absolute left-2 top-2 rounded bg-navy-deep/80 px-2 py-1 text-[10px] uppercase tracking-wide text-cream">
                    Archived
                  </span>
                )}
              </div>
              <div className="px-4 py-4">
                <p className="mb-1 font-serif text-base text-navy-deep">{team.teamName}</p>
                <p className="mb-4 text-xs text-navy-deep/50">{team.votes} votes</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFormTeam(team)}
                    className="flex-1 rounded border border-navy-deep/20 px-3 py-2 text-xs font-medium uppercase tracking-wide text-navy-deep transition hover:border-gold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(team)}
                    className="flex-1 rounded border border-rose/30 px-3 py-2 text-xs font-medium uppercase tracking-wide text-rose transition hover:bg-rose/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {formTeam && (
        <TeamFormModal
          team={formTeam === "new" ? null : formTeam}
          onClose={() => setFormTeam(null)}
          onSaved={() => {
            setFormTeam(null);
            loadTeams();
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Team?"
          message={`Are you sure you want to delete ${deleteTarget.teamName}?`}
          confirmLabel="Delete"
          danger
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
