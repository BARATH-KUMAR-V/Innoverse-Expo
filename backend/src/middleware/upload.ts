import multer from "multer";
import { HttpError } from "../utils/httpError";

// Files are buffered in memory then streamed straight to Supabase Storage -
// there is no local disk write, which keeps the deploy target (Render)
// stateless. The outer size cap here is generous (150MB, the video limit);
// the stricter 8MB image limit is enforced per-field in the admin controller
// since multer's built-in `limits.fileSize` applies uniformly to every file.
const MAX_UPLOAD_BYTES = 150 * 1024 * 1024;

const storage = multer.memoryStorage();

export const teamUpload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter(_req, file, cb) {
    if (file.fieldname === "image" && !file.mimetype.startsWith("image/")) {
      return cb(new HttpError(400, "invalid_file", "Product image must be an image file."));
    }
    if (file.fieldname === "video" && !file.mimetype.startsWith("video/")) {
      return cb(new HttpError(400, "invalid_file", "Product video must be a video file."));
    }
    cb(null, true);
  },
}).fields([
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 },
]);
