import { NextRequest, NextResponse } from "next/server";
import { handleRoute, requireAdmin } from "@/lib/api-handler";
import { supabaseAdmin } from "@/lib/supabase";
import { randomStoragePath, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from "@/lib/services/storage";
import { env } from "@/lib/env";
import { HttpError } from "@/lib/http-error";

/**
 * Vercel Route Handlers cap request bodies at ~4.5MB, far below the 150MB
 * video limit this app supports, so admin uploads can no longer be proxied
 * through the API the way the old multer-based Express route did them.
 * Instead: the browser asks here for a short-lived signed Storage upload
 * URL, uploads the file bytes straight to Supabase Storage with it, then
 * submits the resulting public URL to POST/PUT /api/admin/teams as plain
 * JSON (see TeamFormModal.tsx).
 */
export const POST = handleRoute(async (req: NextRequest) => {
  await requireAdmin(req);
  const body = await req.json().catch(() => ({}));

  const kind = body?.kind;
  const fileName = typeof body?.fileName === "string" ? body.fileName : "";
  const contentType = typeof body?.contentType === "string" ? body.contentType : "";
  const fileSize = typeof body?.fileSize === "number" ? body.fileSize : 0;

  if (kind !== "image" && kind !== "video") {
    throw new HttpError(400, "validation_error", "kind must be 'image' or 'video'.");
  }
  if (kind === "image" && !contentType.startsWith("image/")) {
    throw new HttpError(400, "invalid_file", "Product image must be an image file.");
  }
  if (kind === "video" && !contentType.startsWith("video/")) {
    throw new HttpError(400, "invalid_file", "Product video must be a video file.");
  }

  const maxBytes = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (fileSize > maxBytes) {
    const label = kind === "image" ? "8 MB" : "150 MB";
    throw new HttpError(400, "file_too_large", `Product ${kind} must be smaller than ${label}.`);
  }

  const bucket = kind === "image" ? env.supabaseImageBucket : env.supabaseVideoBucket;
  const path = randomStoragePath(fileName);

  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) {
    console.error(`Supabase signed upload URL failed (bucket=${bucket}):`, error);
    throw new HttpError(502, "storage_error", "Could not prepare the upload. Please try again.");
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);

  return NextResponse.json({
    bucket,
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path,
    publicUrl: publicUrlData.publicUrl,
  });
});
