import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import passport from "./config/passport";
import { env } from "./config/env";
import { pool } from "./db/pool";
import authRoutes from "./routes/auth.routes";
import teamsRoutes from "./routes/teams.routes";
import votesRoutes from "./routes/votes.routes";
import adminRoutes from "./routes/admin.routes";
import resultsRoutes from "./routes/results.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();

// Render (and most PaaS providers) terminate TLS at a reverse proxy in front
// of the app - this is required for secure cookies and correct client IPs.
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);
app.use(express.json());

const PgSession = connectPgSimple(session);

app.use(
  session({
    store: new PgSession({ pool, tableName: "session", createTableIfMissing: true }),
    name: "innoverse.sid",
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // Cross-site cookies (Vercel <-> Render are different sites) require
      // SameSite=None + Secure, which in turn requires HTTPS - true for both
      // platforms in production. Locally, both apps run on http://localhost
      // so Lax + non-secure is used instead.
      secure: env.isProduction,
      sameSite: env.isProduction ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/auth", authRoutes);
app.use("/teams", teamsRoutes);
app.use("/votes", votesRoutes);
app.use("/admin", adminRoutes);
app.use("/results", resultsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
