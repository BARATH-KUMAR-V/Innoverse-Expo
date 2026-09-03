import { NextRequest, NextResponse } from "next/server";
import { handleRoute, requireAdmin } from "@/lib/api-handler";
import { listAllTeamsWithVoteCounts, createTeam } from "@/lib/services/teams";
import { HttpError } from "@/lib/http-error";

export const GET = handleRoute(async (req: NextRequest) => {
  await requireAdmin(req);
  const teams = await listAllTeamsWithVoteCounts();
  return NextResponse.json(
    teams.map((t) => ({
      id: t.id,
      teamName: t.team_name,
      imageUrl: t.image_url,
      videoUrl: t.video_url,
      isActive: t.is_active,
      votes: t.votes,
      createdAt: t.created_at,
    }))
  );
});

/**
 * Body is JSON, not multipart: the browser has already uploaded the image
 * and/or video straight to Supabase Storage via a signed URL from
 * `/api/admin/uploads/sign` (Vercel Route Handlers cap request bodies at
 * ~4.5MB, far below the 150MB video limit), and just submits the resulting
 * public URLs here.
 */
export const POST = handleRoute(async (req: NextRequest) => {
  await requireAdmin(req);
  const body = await req.json().catch(() => ({}));

  const teamName = typeof body?.teamName === "string" ? body.teamName.trim() : "";
  if (!teamName) {
    throw new HttpError(400, "validation_error", "Team name is required.");
  }

  const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl : null;
  const videoUrl = typeof body?.videoUrl === "string" ? body.videoUrl : null;

  const team = await createTeam({ teamName, imageUrl, videoUrl });
  return NextResponse.json(
    {
      id: team.id,
      teamName: team.team_name,
      imageUrl: team.image_url,
      videoUrl: team.video_url,
      isActive: team.is_active,
    },
    { status: 201 }
  );
});
