import { randomUUID } from "crypto";
import path from "path";
import { supabaseAdmin } from "../supabase";

// Enforced up front in /api/admin/uploads/sign (defense in depth) and, as
// the real backstop, as a per-bucket file size limit configured in the
// Supabase Storage dashboard - see README §3.4.
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_VIDEO_BYTES = 150 * 1024 * 1024; // 150 MB

/** Best-effort delete - failures are logged but never block the calling request. */
export async function deleteFromStorageByUrl(bucket: string, publicUrl: string | null | undefined): Promise<void> {
  if (!publicUrl) return;
  try {
    const fileName = publicUrl.split("/").pop();
    if (!fileName) return;
    await supabaseAdmin.storage.from(bucket).remove([fileName]);
  } catch (err) {
    console.error("Best-effort storage cleanup failed:", err);
  }
}

/** Generates a random, collision-free storage path preserving the original file extension. */
export function randomStoragePath(originalName: string): string {
  const ext = path.extname(originalName || "").toLowerCase();
  return `${randomUUID()}${ext}`;
}
