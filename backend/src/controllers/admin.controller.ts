import { Request, Response } from "express";
import { env } from "../config/env";
import { HttpError } from "../utils/httpError";
import {
  listAllTeamsWithVoteCounts,
  createTeam,
  updateTeam,
  countVotesForTeam,
  archiveTeam,
  hardDeleteTeam,
  getTeamById,
} from "../services/teams.service";
import { totalVoteCount, rankingsWithVotes } from "../services/votes.service";
import { countUsers } from "../services/users.service";
import { getVotingConfig, setVotingOpen, setWinnersPublished } from "../services/votingConfig.service";
import { uploadProductImage, uploadProductVideo, deleteFromStorageByUrl } from "../services/storage.service";
import { buildRankingsCsv } from "../utils/csv";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_VIDEO_BYTES = 150 * 1024 * 1024; // 150 MB

type UploadedFiles = { [fieldname: string]: Express.Multer.File[] };

export async function getStats(_req: Request, res: Response) {
  const [config, votes, eligibleVoters] = await Promise.all([getVotingConfig(), totalVoteCount(), countUsers()]);
  const participation = eligibleVoters > 0 ? (votes / eligibleVoters) * 100 : 0;
  res.json({
    votingOpen: config.voting_open,
    winnersPublished: config.winners_published,
    totalVotes: votes,
    // "Eligible voters" here means students who have signed in with a valid
    // @nec.edu.in account - there is no separate roster upload feature, so
    // this is the most accurate figure the system can derive on its own.
    eligibleVoters,
    participation: Math.round(participation * 10) / 10,
  });
}

export async function getRankings(_req: Request, res: Response) {
  const rankings = await rankingsWithVotes();
  res.json(rankings);
}

export async function listTeamsForAdmin(_req: Request, res: Response) {
  const teams = await listAllTeamsWithVoteCounts();
  res.json(
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
}

export async function createTeamHandler(req: Request, res: Response) {
  const teamName = typeof req.body?.teamName === "string" ? req.body.teamName.trim() : "";
  if (!teamName) {
    throw new HttpError(400, "validation_error", "Team name is required.");
  }

  const files = (req.files as UploadedFiles) || {};
  const imageFile = files.image?.[0];
  const videoFile = files.video?.[0];

  if (imageFile && imageFile.size > MAX_IMAGE_BYTES) {
    throw new HttpError(400, "file_too_large", "Product image must be smaller than 8 MB.");
  }
  if (videoFile && videoFile.size > MAX_VIDEO_BYTES) {
    throw new HttpError(400, "file_too_large", "Product video must be smaller than 150 MB.");
  }

  const imageUrl = imageFile
    ? await uploadProductImage(env.supabaseImageBucket, imageFile.buffer, imageFile.originalname, imageFile.mimetype)
    : null;
  const videoUrl = videoFile
    ? await uploadProductVideo(env.supabaseVideoBucket, videoFile.buffer, videoFile.originalname, videoFile.mimetype)
    : null;

  const team = await createTeam({ teamName, imageUrl, videoUrl });
  res.status(201).json({
    id: team.id,
    teamName: team.team_name,
    imageUrl: team.image_url,
    videoUrl: team.video_url,
    isActive: team.is_active,
  });
}

export async function updateTeamHandler(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await getTeamById(id);
  if (!existing) {
    throw new HttpError(404, "team_not_found", "This product is currently unavailable.");
  }

  const teamName =
    typeof req.body?.teamName === "string" && req.body.teamName.trim() ? req.body.teamName.trim() : undefined;

  const files = (req.files as UploadedFiles) || {};
  const imageFile = files.image?.[0];
  const videoFile = files.video?.[0];

  if (imageFile && imageFile.size > MAX_IMAGE_BYTES) {
    throw new HttpError(400, "file_too_large", "Product image must be smaller than 8 MB.");
  }
  if (videoFile && videoFile.size > MAX_VIDEO_BYTES) {
    throw new HttpError(400, "file_too_large", "Product video must be smaller than 150 MB.");
  }

  let imageUrl: string | undefined;
  let videoUrl: string | undefined;

  if (imageFile) {
    imageUrl = await uploadProductImage(env.supabaseImageBucket, imageFile.buffer, imageFile.originalname, imageFile.mimetype);
  }
  if (videoFile) {
    videoUrl = await uploadProductVideo(env.supabaseVideoBucket, videoFile.buffer, videoFile.originalname, videoFile.mimetype);
  }

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

  res.json({
    id: updated.id,
    teamName: updated.team_name,
    imageUrl: updated.image_url,
    videoUrl: updated.video_url,
    isActive: updated.is_active,
  });
}

export async function deleteTeamHandler(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await getTeamById(id);
  if (!existing) {
    throw new HttpError(404, "team_not_found", "This product is currently unavailable.");
  }

  const voteCount = await countVotesForTeam(id);
  if (voteCount > 0) {
    // Preserve voting integrity: never silently destroy a team that already
    // has recorded votes. Archive it (hide from the gallery) instead.
    await archiveTeam(id);
    return res.json({
      success: true,
      archived: true,
      message:
        "This team already has recorded votes, so it was archived (hidden from the gallery) instead of deleted, to preserve voting integrity.",
    });
  }

  await hardDeleteTeam(id);
  res.json({ success: true, archived: false, message: "Team deleted." });
}

export async function startVoting(_req: Request, res: Response) {
  const config = await setVotingOpen(true);
  res.json({ votingOpen: config.voting_open });
}

export async function stopVoting(_req: Request, res: Response) {
  const config = await setVotingOpen(false);
  res.json({ votingOpen: config.voting_open });
}

export async function publishResults(_req: Request, res: Response) {
  const config = await setWinnersPublished(true);
  res.json({ winnersPublished: config.winners_published });
}

export async function unpublishResults(_req: Request, res: Response) {
  const config = await setWinnersPublished(false);
  res.json({ winnersPublished: config.winners_published });
}

export async function exportCsv(_req: Request, res: Response) {
  const rankings = await rankingsWithVotes();
  const total = rankings.reduce((sum, r) => sum + r.votes, 0);
  const csv = buildRankingsCsv(
    rankings.map((r) => ({
      teamName: r.teamName,
      votes: r.votes,
      percentage: total > 0 ? (r.votes / total) * 100 : 0,
    }))
  );
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="votes.csv"');
  res.send(csv);
}
