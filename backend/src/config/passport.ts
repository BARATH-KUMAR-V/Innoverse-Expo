import passport from "passport";
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import { env } from "./env";
import { upsertUserFromGoogle, findUserById } from "../services/users.service";

passport.use(
  new GoogleStrategy(
    {
      clientID: env.googleClientId,
      clientSecret: env.googleClientSecret,
      callbackURL: env.googleCallbackUrl,
    },
    async (_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) {
          return done(null, false, { message: "no_email" });
        }

        // The backend is the source of truth for the domain check - the
        // frontend never decides who is allowed in.
        const domain = email.split("@")[1];
        if (domain !== env.allowedEmailDomain) {
          return done(null, false, { message: "invalid_domain" });
        }

        const user = await upsertUserFromGoogle({
          googleId: profile.id,
          name: profile.displayName || email,
          email,
          picture: profile.photos?.[0]?.value ?? null,
        });

        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await findUserById(id);
    done(null, user ?? false);
  } catch (err) {
    done(err as Error);
  }
});

export default passport;
