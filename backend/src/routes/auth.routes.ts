import { Router } from "express";
import passport from "../config/passport";
import { env } from "../config/env";
import { getMe, logout } from "../controllers/auth.controller";

const router = Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

// Custom callback (instead of a plain failureRedirect) so we can tell a
// rejected non-college domain apart from a genuine server/network error and
// send the frontend a useful ?authError= reason for its banner message.
router.get("/google/callback", (req, res, next) => {
  passport.authenticate(
    "google",
    (err: unknown, user: Express.User | false | null, info: { message?: string } | undefined) => {
      if (err) {
        console.error("Google OAuth error:", err);
        return res.redirect(`${env.frontendUrl}/?authError=server`);
      }
      if (!user) {
        const reason = info?.message === "invalid_domain" ? "domain" : "server";
        return res.redirect(`${env.frontendUrl}/?authError=${reason}`);
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error("Session login error:", loginErr);
          return res.redirect(`${env.frontendUrl}/?authError=server`);
        }
        return res.redirect(`${env.frontendUrl}/gallery`);
      });
    }
  )(req, res, next);
});

router.get("/me", getMe);
router.post("/logout", logout);

export default router;
