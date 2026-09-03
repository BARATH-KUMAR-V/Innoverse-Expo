/**
 * One-time bulk import: reads every team's image+video pair from a folder
 * (default: "flower vase image & video" at the repo root, one jpeg/jpg/png +
 * one MOV/mp4 per team, both named exactly as the team) and creates a team
 * row for each, uploading the media to Supabase Storage the same way the
 * admin dashboard does.
 *
 * Requires frontend/.env.local to already have real DATABASE_URL,
 * SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY values, and the schema
 * (frontend/db/schema.sql) already applied to that database.
 *
 * Usage (from frontend/):
 *   npm run import-teams [-- path-to-media-folder]
 *
 * Safe to re-run: a team name that already exists in the database is
 * skipped, not duplicated.
 */
import fs from "fs";
import path from "path";
import { pool } from "../lib/db";
import { env } from "../lib/env";
import { supabaseAdmin } from "../lib/supabase";
import { createTeam } from "../lib/services/teams";
import { randomStoragePath } from "../lib/services/storage";

const IMAGE_EXTENSIONS = [".jpeg", ".jpg", ".png", ".webp"];
const VIDEO_EXTENSIONS = [".mov", ".mp4", ".m4v"];

const MIME_TYPES: Record<string, string> = {
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
};

interface TeamFiles {
  teamName: string;
  imagePath: string | null;
  videoPath: string | null;
}

function discoverTeams(mediaDir: string): TeamFiles[] {
  const entries = fs.readdirSync(mediaDir, { withFileTypes: true }).filter((e) => e.isFile());
  const byTeam = new Map<string, TeamFiles>();

  for (const entry of entries) {
    const ext = path.extname(entry.name).toLowerCase();
    const baseName = entry.name.slice(0, entry.name.length - ext.length);
    const isImage = IMAGE_EXTENSIONS.includes(ext);
    const isVideo = VIDEO_EXTENSIONS.includes(ext);
    if (!isImage && !isVideo) continue;

    const existing = byTeam.get(baseName) ?? { teamName: baseName, imagePath: null, videoPath: null };
    const fullPath = path.join(mediaDir, entry.name);
    if (isImage) existing.imagePath = fullPath;
    if (isVideo) existing.videoPath = fullPath;
    byTeam.set(baseName, existing);
  }

  return Array.from(byTeam.values());
}

async function teamNameExists(teamName: string): Promise<boolean> {
  const result = await pool.query("select 1 from teams where lower(team_name) = lower($1) limit 1", [teamName]);
  return (result.rowCount ?? 0) > 0;
}

async function uploadFile(bucket: string, filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
  const storagePath = randomStoragePath(filePath);

  const { error } = await supabaseAdmin.storage.from(bucket).upload(storagePath, buffer, { contentType, upsert: false });
  if (error) {
    throw new Error(`Upload to ${bucket}/${storagePath} failed: ${error.message}`);
  }
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function main() {
  const mediaDir = path.resolve(process.argv[2] ?? path.join(__dirname, "..", "..", "flower vase image & video"));

  if (!fs.existsSync(mediaDir)) {
    console.error(`Media folder not found: ${mediaDir}`);
    process.exit(1);
  }

  console.log(`Scanning ${mediaDir} ...`);
  const teams = discoverTeams(mediaDir);
  console.log(`Found ${teams.length} team(s).\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const team of teams) {
    if (!team.imagePath && !team.videoPath) continue;

    if (!team.imagePath) {
      console.warn(`⚠ ${team.teamName}: no image file found, skipping.`);
      failed++;
      continue;
    }

    if (await teamNameExists(team.teamName)) {
      console.log(`- ${team.teamName}: already exists, skipping.`);
      skipped++;
      continue;
    }

    try {
      console.log(`→ ${team.teamName}: uploading image...`);
      const imageUrl = await uploadFile(env.supabaseImageBucket, team.imagePath);

      let videoUrl: string | null = null;
      if (team.videoPath) {
        console.log(`→ ${team.teamName}: uploading video...`);
        videoUrl = await uploadFile(env.supabaseVideoBucket, team.videoPath);
      } else {
        console.warn(`⚠ ${team.teamName}: no video file found, creating with image only.`);
      }

      await createTeam({ teamName: team.teamName, imageUrl, videoUrl });
      console.log(`✓ ${team.teamName}: created.\n`);
      created++;
    } catch (err) {
      console.error(`✗ ${team.teamName}: failed -`, err instanceof Error ? err.message : err, "\n");
      failed++;
    }
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped} (already existed), failed ${failed}.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
