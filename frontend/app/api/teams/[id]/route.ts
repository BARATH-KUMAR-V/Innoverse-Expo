import { NextRequest, NextResponse } from "next/server";
import { handleRoute, requireAuth } from "@/lib/api-handler";
import { getTeamById } from "@/lib/services/teams";
import { HttpError } from "@/lib/http-error";

export const GET = handleRoute(async (req: NextRequest, { params }) => {
  await requireAuth(req);
  const { id } = await params;
  const team = await getTeamById(id);
  if (!team || !team.is_active) {
    throw new HttpError(404, "team_not_found", "This product is currently unavailable.");
  }
  return NextResponse.json({
    id: team.id,
    teamName: team.team_name,
    imageUrl: team.image_url,
    videoUrl: team.video_url,
  });
});
