import { Request, Response, NextFunction } from "express";
import { toPublicUser } from "../services/users.service";

export function getMe(req: Request, res: Response) {
  if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
    return res.json({ authenticated: false, user: null });
  }
  return res.json({ authenticated: true, user: toPublicUser(req.user) });
}

export function logout(req: Request, res: Response, next: NextFunction) {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie("innoverse.sid");
      res.json({ success: true });
    });
  });
}
