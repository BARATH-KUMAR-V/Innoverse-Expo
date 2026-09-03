import { NextRequest, NextResponse } from "next/server";
import { handleRoute, requireAdmin } from "@/lib/api-handler";
import { getTeamById, updateTeam, countVotesForTeam, archiveTeam, hardDeleteTeam } from "@/lib/services/teams";
import { deleteFromStorageByUrl } from "@/lib/services/storage";
import { env } from "@/lib/env";
import { HttpError } from "@/lib/http-error";

/** Same two-step upload note as POST /api/admin/teams - body is JSON with the new URL(s), if any. */
export const PUT = handleRoute(async (req: NextRequest, { params }) => {
  await requireAdmin(req);
  const { id } = await params;

  const existing = await getTeamById(id);
  if (!existing) {
    throw new HttpError(404, "team_not_found", "This product is currently unavailable.");
  }

  const body = await req.json().catch(() => ({}));
  const teamName = typeof body?.teamName === "string" && body.teamName.trim() ? body.teamName.trim() : undefined;
  const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl : undefined;
  const videoUrl = typeof body?.videoUrl === "string" ? body.videoUrl : undefined;

  const updated = await updateTeam(id, { teamName, imageUrl, videoUrl });
  if (!updated) {
    throw new HttpError(404, "team_not_found", "This product is currently unavailable.");
  }

  // Best-effort cleanup of the files that were just replaced - never blocks the response.
  if (imageUrl && existing.image_url) {
    void deleteFromStorageByUrl(env.supabaseImageBucket, existing.image_url);
  }
  if (videoUrl && existing.video_url) {
    void deleteFromStorageByUrl(env.supabaseVideoBucket, existing.video_url);
  }

  return NextResponse.json({
    id: updated.id,
    teamName: updated.team_name,
    imageUrl: updated.image_url,
    videoUrl: updated.video_url,
    isActive: updated.is_active,
  });
});

export const DELETE = handleRoute(async (req: NextRequest, { params }) => {
  await requireAdmin(req);
  const { id } = await params;

  const existing = await getTeamById(id);
  if (!existing) {
    throw new HttpError(404, "team_not_found", "This product is currently unavailable.");
  }

  const voteCount = await countVotesForTeam(id);
  if (voteCount > 0) {
    // Preserve voting integrity: never silently destroy a team that already
    // has recorded votes. Archive it (hide from the gallery) instead.
    await archiveTeam(id);
    return NextResponse.json({
      success: true,
      archived: true,
      message:
        "This team already has recorded votes, so it was archived (hidden from the gallery) instead of deleted, to preserve voting integrity.",
    });
  }

  await hardDeleteTeam(id);
  return NextResponse.json({ success: true, archived: false, message: "Team deleted." });
});
