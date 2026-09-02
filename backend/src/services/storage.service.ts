import { randomUUID } from "crypto";
import path from "path";
import { supabaseAdmin } from "../config/supabase";
import { HttpError } from "../utils/httpError";

async function uploadBuffer(bucket: string, buffer: Buffer, originalName: string, mimeType: string): Promise<string> {
  const ext = path.extname(originalName || "").toLowerCase();
  const fileName = `${randomUUID()}${ext}`;

  const { error } = await supabaseAdmin.storage.from(bucket).upload(fileName, buffer, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) {
    console.error(`Supabase Storage upload failed (bucket=${bucket}):`, error);
    throw new HttpError(502, "storage_error", "Could not upload the file. Please try again.");
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

export function uploadProductImage(bucket: string, buffer: Buffer, originalName: string, mimeType: string) {
  return uploadBuffer(bucket, buffer, originalName, mimeType);
}

export function uploadProductVideo(bucket: string, buffer: Buffer, originalName: string, mimeType: string) {
  return uploadBuffer(bucket, buffer, originalName, mimeType);
}

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
