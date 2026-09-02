import { NextFunction, Request, Response } from "express";
import { isAdminEmail } from "../config/env";
import { HttpError } from "../utils/httpError";

export function ensureAuthenticated(req: Request, _res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return next(new HttpError(401, "not_authenticated", "Please sign in to continue."));
}

export function ensureAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return next(new HttpError(401, "not_authenticated", "Please sign in to continue."));
  }
  if (!isAdminEmail(req.user?.email)) {
    return next(new HttpError(403, "forbidden", "Admin access required."));
  }
  return next();
}
