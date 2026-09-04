import { NextRequest, NextResponse } from "next/server";
import { handleRoute, requireAuth } from "@/lib/api-handler";
import { listActiveTeams } from "@/lib/services/teams";

export const GET = handleRoute(async (req: NextRequest) => {
  await requireAuth(req);
  const teams = await listActiveTeams();
  return NextResponse.json(
    teams.map((t) => ({
      id: t.id,
      teamName: t.team_name,
      imageUrl: t.image_url,
      videoUrl: t.video_url,
    }))
  );
});
