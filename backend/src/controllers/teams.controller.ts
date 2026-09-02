import { Request, Response } from "express";
import { listActiveTeams, getTeamById } from "../services/teams.service";
import { HttpError } from "../utils/httpError";

export async function getGalleryTeams(_req: Request, res: Response) {
  const teams = await listActiveTeams();
  res.json(
    teams.map((t) => ({
      id: t.id,
      teamName: t.team_name,
      imageUrl: t.image_url,
    }))
  );
}

export async function getTeamDetail(req: Request, res: Response) {
  const team = await getTeamById(req.params.id);
  if (!team || !team.is_active) {
    throw new HttpError(404, "team_not_found", "This product is currently unavailable.");
  }
  res.json({
    id: team.id,
    teamName: team.team_name,
    imageUrl: team.image_url,
    videoUrl: team.video_url,
  });
}
