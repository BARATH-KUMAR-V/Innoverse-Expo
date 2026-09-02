import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { HttpError } from "../utils/httpError";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "not_found", message: "Not found." });
}

// Express identifies error-handling middleware purely by its 4-argument
// arity, so all four parameters must stay even though `next` is unused.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({ error: err.code, message: err.message });
  }

  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "The uploaded file is too large." : "File upload failed.";
    return res.status(400).json({ error: "upload_error", message });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({ error: "server_error", message: "Something went wrong. Please try again." });
}
