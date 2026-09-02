# INNOVERSE — Prompt to Product Expo

A real, production-ready full-stack voting platform: college students sign in with their `@nec.edu.in` Google account, browse exhibited products, and cast one vote each. Everything that matters — authentication, the one-vote rule, voting open/closed state, results — is enforced by the backend and the database, never by the browser.

This README is a complete, start-from-zero build guide: Supabase, Google Cloud, local development, GitHub, Render, and Vercel, in the order you actually need to do them. Follow it top to bottom the first time; after that, jump to whichever section you need.

**Nothing here needs you to write code.** Every step is a dashboard click, a copy-pasted value, or a terminal command given to you exactly as written.

---

## 1. What you're deploying

| Layer          | Technology                                                | Where it runs    |
| -------------- | --------------------------------------------------------- | ---------------- |
| Frontend       | Next.js 15 (App Router) + TypeScript + Tailwind + Zustand | Vercel           |
| Backend API    | Node.js + Express + TypeScript + Passport.js              | Render           |
| Database       | PostgreSQL                                                | Supabase         |
| File storage   | Product images & videos                                   | Supabase Storage |
| Authentication | Google OAuth 2.0, restricted to `@nec.edu.in`             | Google Cloud     |

```
Student's browser
      │
      ▼
Next.js frontend  (Vercel)
      │  HTTPS, credentials included
      ▼
Express backend   (Render)
      │
      ├──► PostgreSQL (Supabase)      users, teams, votes, voting_config
      └──► Supabase Storage           product images & videos
```

The frontend never talks to the database or to Supabase Storage directly, and it never decides who's an admin or whether someone has already voted — it only ever asks the backend, and the backend is the only thing with real credentials.

### Project structure

```
innoverse-voting/
├── backend/                 Express API (deploys to Render)
│   ├── src/
│   │   ├── config/          env, Passport (Google OAuth), Supabase client
│   │   ├── db/              schema.sql, seed.sql, connection pool
│   │   ├── middleware/      auth guards, file upload, error handler
│   │   ├── routes/          auth, teams, votes, admin, results
│   │   ├── controllers/     request handlers
│   │   ├── services/        database queries & Storage uploads
│   │   └── jobs/            optional auto-close-voting timer
│   └── .env.example
├── frontend/                 Next.js app (deploys to Vercel)
│   ├── app/                 pages (landing, gallery, product, admin, results...)
│   ├── components/          UI components
│   ├── store/                Zustand state (auth, UI)
│   ├── lib/                 API client
│   └── .env.local.example
└── README.md                 you are here
```

---

## 2. Prerequisites

- A free [Supabase](https://supabase.com) account.
- A [Google Cloud](https://console.cloud.google.com) account (a personal Google account is enough — you don't need an `@nec.edu.in` account to _build_ this, only students need one to _vote_).
- A free [Render](https://render.com) account.
- A free [Vercel](https://vercel.com) account.
- A [GitHub](https://github.com) account.
- [Node.js](https://nodejs.org) 18.18 or newer installed on your computer, for local testing before you deploy.

Do the sections in order: **Supabase → Google Cloud → local test → GitHub → Render → Vercel → connect the URLs together.**

---

## 3. Supabase: database + file storage

### 3.1 Create the project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and click **New project**.
2. Pick an organization (or create one), give the project a name (e.g. `innoverse`), generate/choose a strong **database password** — **save this password somewhere**, you'll need it in a minute — and pick a region close to your users (e.g. Mumbai/Singapore for India).
3. Click **Create new project** and wait a minute or two while it provisions.

### 3.2 Run the database schema

1. In the left sidebar, open the **SQL Editor**.
2. Click **New query**.
3. Open `backend/src/db/schema.sql` from this project, copy its entire contents, paste it into the SQL Editor, and click **Run**.
4. This creates five tables: `users`, `teams`, `votes`, `voting_config`, and `session` (used to store login sessions). It's safe to run more than once.

**Optional — sample data for testing:** if you want to click through the whole voting flow locally before you have real teams and images, also run `backend/src/db/seed.sql` the same way. It adds three sample teams with stock photos so the gallery isn't empty. Delete them later from the admin **Manage Teams** page once you add the real ones.

### 3.3 Get your database connection string

1. Click the **Connect** button near the top of the project dashboard.
2. Choose the **Direct connection** string (not a "pooler" one) — this backend is a normal, long-running Node server, which is exactly what a direct connection is meant for.
3. Copy it. It looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with the database password from step 3.1. This full string is your `DATABASE_URL`.

> **If the direct connection times out later (from Render):** Supabase's direct connection is IPv6 by default, and some hosts only support IPv4 outbound. If that happens, go back to **Connect** and use the **Shared pooler → Session mode** string instead — it's IPv4-compatible and works the same way for a persistent server like this one. (Avoid "Transaction mode" poolers for this project — they don't support the kind of connections this backend keeps open.)

### 3.4 Create the storage buckets

1. In the left sidebar, open **Storage**.
2. Click **New bucket**, name it exactly `product-images`, and toggle it **Public**. Create it.
3. Repeat for a second bucket named exactly `product-videos`, also **Public**.
   (These exact names match `SUPABASE_IMAGE_BUCKET` / `SUPABASE_VIDEO_BUCKET` in the backend's `.env` — if you name them differently, update those variables to match.)
4. "Public" here only means _anyone with the file's URL can view it_ (necessary — students need to see product images/videos). Nobody can **upload** to these buckets except your backend, because uploads go through the service role key, which only the backend ever has.

### 3.5 Get your API keys

1. Open **Project Settings → API** (or **Project Settings → API Keys**, depending on the dashboard version you see).
2. Copy the **Project URL** → this is `SUPABASE_URL`.
3. Copy the **`service_role`** secret key (not the `anon` public key) → this is `SUPABASE_SERVICE_ROLE_KEY`.

**Treat the service role key like a password.** It bypasses all access rules. It only ever goes into the _backend's_ environment variables (Render) — never into the frontend, never into git.

You're done with Supabase for now. Keep this tab open — you'll come back to add teams later.

---

## 4. Google Cloud: OAuth login

This is what lets students sign in with their college Google account, and what the backend uses to verify the email actually ends in `@nec.edu.in`.

### 4.1 Create a project

1. Go to the [Google Cloud Console](https://console.cloud.google.com).
2. Top bar → project dropdown → **New Project**. Name it (e.g. `innoverse-expo`) and create it.

### 4.2 Configure the OAuth consent screen

1. In the search bar (or left menu), go to **Google Auth Platform → OAuth consent screen**.
2. Click **Get started**, then fill in the short wizard:
   - **App information**: app name (e.g. "Innoverse Voting") and a support email.
   - **Audience**: choose **External** — this lets any Google account attempt to sign in (the backend is what actually restricts it to `@nec.edu.in`, so this is safe).
     - _Exception:_ if the person setting this up has an `@nec.edu.in` account that is itself managed under the college's Google Workspace, **Internal** is available and is an extra layer of safety (only that Workspace's accounts can even reach the login screen). Most people building this from a personal Google account should use External.
   - **Contact information**: your email, for Google's own notices about the app.
   - Accept and **Create**.
3. By default a new "External" app starts in **Testing** mode, which only allows up to 100 explicitly-added test users to sign in. Once you're ready for the real event, switch **Publishing status** to **In production** so any `@nec.edu.in` student can sign in without being added by hand. For the basic profile/email information this app requests, this normally does not require Google's full verification review — but Google may show first-time users a brief "unverified app" notice depending on its own risk checks. If you'd rather avoid that entirely and you qualify for **Internal** (previous step), that skips this altogether.

### 4.3 Create the OAuth Client ID

1. Go to **Google Auth Platform → Clients** (or **APIs & Services → Credentials** on older dashboard layouts).
2. Click **Create Client** (or **Create Credentials → OAuth client ID**).
3. **Application type**: **Web application**. Name it (e.g. "Innoverse Web Client").
4. **Authorized JavaScript origins** — add both, as you'll have them:
   ```
   http://localhost:3000
   https://your-app.vercel.app
   ```
5. **Authorized redirect URIs** — this must exactly match your backend's callback route:
   ```
   http://localhost:4000/auth/google/callback
   https://your-backend.onrender.com/auth/google/callback
   ```
   (You don't have the real `vercel.app` / `onrender.com` URLs yet — that's fine, add the `localhost` ones now, and come back to add the real ones in [Section 8](#8-connect-everything-together) once you've deployed.)
6. Create it, then copy the **Client ID** and **Client secret** immediately — the secret is only shown in full once.

> **The #1 OAuth error** people hit is `redirect_uri_mismatch` — the callback URL Google receives must match one of the URIs above **exactly**: same protocol (`https` vs `http`), no trailing slash, right path. If you see that error later, this is the first place to check.

You now have `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

---

## 5. Run it locally first

Always worth doing before deploying — it's much faster to fix a typo locally than through two redeploys.

### 5.1 Backend

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in:

- `DATABASE_URL` — from Supabase (§3.3)
- `SESSION_SECRET` — any long random string. Generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — from Google Cloud (§4.3)
- `GOOGLE_CALLBACK_URL` — leave as `http://localhost:4000/auth/google/callback` for now
- `ADMIN_EMAILS` — your own `@nec.edu.in`-style test email(s), comma-separated
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — from Supabase (§3.5)
- Leave `FRONTEND_URL` as `http://localhost:3000`

Then install and run:

```bash
npm install
npm run dev
```

You should see:

```
Connected to PostgreSQL.
INNOVERSE backend listening on port 4000 (development)
```

Visit `http://localhost:4000/health` in a browser — it should return `{"status":"ok"}`.

### 5.2 Frontend

In a **second terminal**:

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Visit `http://localhost:3000`. You should see the Innoverse landing page. Click **Cast Your Vote Now** → **Continue with Google** and sign in with a real Google account whose email ends in `@nec.edu.in` (or, for local testing, temporarily set `ALLOWED_EMAIL_DOMAIN` in the backend `.env` to match whatever email domain you're testing with, then change it back before going live).

If you ran the optional seed data (§3.2), you should land in a gallery with three sample teams. Open one, watch the sample video, click **Make Your Vote**, confirm — you should land on the success page. Try voting again and you should be blocked with "You have already cast your vote."

To test the admin dashboard, make sure your test email is in `ADMIN_EMAILS`, then visit `http://localhost:3000/admin`.

---

## 6. Push to GitHub

```bash
cd innoverse-voting
git init
git add .
git commit -m "Initial commit: Innoverse voting platform"
```

Create a new **empty** repository on GitHub (no README/license — you already have one), then:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

Your `.env` and `.env.local` files are already excluded via `.gitignore` — double check with `git status` that no `.env` file is about to be committed before you push.

---

## 7. Deploy the backend to Render

1. [dashboard.render.com](https://dashboard.render.com) → **New → Web Service**.
2. Connect your GitHub account and pick this repository.
3. Configure:
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance type**: Free is fine to start.
4. Under **Environment Variables**, add every variable from `backend/.env.example` with your real values — same ones you used locally, with two differences:
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = your Vercel URL (you don't have it yet — put in a placeholder like `https://placeholder.vercel.app` for now, you'll fix it in §8)
   - `GOOGLE_CALLBACK_URL` = `https://<your-render-service-name>.onrender.com/auth/google/callback` (Render shows you the service's URL as soon as you create it, before the first deploy even finishes — grab it from the top of the service page)
5. (Optional) Under **Health Check Path**, set `/health` — Render will use it to confirm the service is alive.
6. Click **Create Web Service**. Watch the deploy logs; when it finishes you should see the same `Connected to PostgreSQL` / `listening on port...` lines you saw locally.
7. Visit `https://<your-service>.onrender.com/health` — confirm it returns `{"status":"ok"}`.

> Free Render web services spin down after periods of inactivity and take 30–60 seconds to wake back up on the next request. That's fine for a voting event people check into occasionally, but if it matters to you, Render's paid tiers remove this.

---

## 8. Deploy the frontend to Vercel

1. [vercel.com/new](https://vercel.com/new) → import the same GitHub repository.
2. When configuring the project:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js (auto-detected)
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL` = `https://<your-service>.onrender.com` (your Render backend URL from §7, **no trailing slash**)
4. Click **Deploy**. When it finishes, you'll get a URL like `https://innoverse-expo.vercel.app`.

---

## 9. Connect everything together

Now that both are deployed, go back and fix the placeholder values:

1. **Render → your backend service → Environment**: update `FRONTEND_URL` to your real Vercel URL (no trailing slash), then **manually redeploy** (Render redeploys automatically on env var changes, but double check).
2. **Google Cloud → Clients → your OAuth client**: add the real URLs alongside the localhost ones:
   - Authorized JavaScript origins: add `https://your-app.vercel.app`
   - Authorized redirect URIs: add `https://your-backend.onrender.com/auth/google/callback`
3. Visit your real Vercel URL, click through **Cast Your Vote Now → Continue with Google**, and confirm you land back on the gallery signed in. This round-trip through all three services (Vercel → Google → Render → back to Vercel) is the real end-to-end test.

If step 3 fails, see [Troubleshooting](#12-troubleshooting) below — cross-site cookies and redirect URIs are the two things most likely to need a second look.

---

## 10. Running the event

1. **Before the event**: sign in once yourself (so the admin check has an account to match against), confirm your email is in `ADMIN_EMAILS` on Render, then go to `/admin/teams` and add every real team — name, product image, product video. Delete/archive the sample teams if you ran the seed data.
2. **Thursday morning**: go to `/admin/voting` and click **Start Voting**.
3. **During the event**: `/admin` shows near-real-time stats (refreshes every 30 seconds) — total votes, participation, voting status. `/admin/rankings` shows the live leaderboard — **only admins ever see this**, students cannot.
4. **Saturday 1:30 PM**: go to `/admin/voting` and click **Stop Voting**. (There's also an optional automatic safety net — see `VOTING_AUTO_CLOSE_AT` in the environment variable reference below — but treat the manual button as the real control.)
5. Review `/admin/rankings`, then **Export CSV** if you want a record.
6. Click **Display Winners** on `/admin/rankings` — the top 3 immediately become visible to everyone on the public `/results` page.

---

## 11. Environment variable reference

### Backend (Render)

| Variable                    | Example                                                    | Notes                                                                  |
| --------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| `NODE_ENV`                  | `production`                                               |                                                                        |
| `PORT`                      | `4000`                                                     | Render sets this automatically; the app respects it either way         |
| `FRONTEND_URL`              | `https://innoverse-expo.vercel.app`                        | No trailing slash                                                      |
| `DATABASE_URL`              | `postgresql://postgres:...@db...supabase.co:5432/postgres` | Supabase §3.3                                                          |
| `SESSION_SECRET`            | (random string)                                            |                                                                        |
| `GOOGLE_CLIENT_ID`          | `....apps.googleusercontent.com`                           | Google Cloud §4.3                                                      |
| `GOOGLE_CLIENT_SECRET`      |                                                            |                                                                        |
| `GOOGLE_CALLBACK_URL`       | `https://your-backend.onrender.com/auth/google/callback`   | Must match Google Cloud exactly                                        |
| `ALLOWED_EMAIL_DOMAIN`      | `nec.edu.in`                                               |                                                                        |
| `ADMIN_EMAILS`              | `admin1@nec.edu.in,admin2@nec.edu.in`                      | Comma-separated, no spaces needed                                      |
| `SUPABASE_URL`              | `https://xxxx.supabase.co`                                 | Supabase §3.5                                                          |
| `SUPABASE_SERVICE_ROLE_KEY` |                                                            | Secret — backend only                                                  |
| `SUPABASE_IMAGE_BUCKET`     | `product-images`                                           | Must match the bucket name                                             |
| `SUPABASE_VIDEO_BUCKET`     | `product-videos`                                           | Must match the bucket name                                             |
| `VOTING_AUTO_CLOSE_AT`      | `2026-09-05T13:30:00+05:30`                                | Optional. Leave blank to rely solely on the admin's Stop Voting button |

### Frontend (Vercel)

| Variable              | Example                                                 |
| --------------------- | ------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com` (no trailing slash) |

---

## 12. Troubleshooting

**`redirect_uri_mismatch` from Google.**
The callback URL your backend sent doesn't exactly match one in Google Cloud → Clients → your client → Authorized redirect URIs. Check protocol, trailing slash, and that you added _both_ the localhost and production URLs.

**Signed in on Google, but redirected back "logged out," or `/auth/me` always says `authenticated: false`.**
Almost always a cross-site cookie issue. The frontend (Vercel) and backend (Render) are different domains, so the session cookie needs `SameSite=None; Secure` — the app already sets this automatically in production (`NODE_ENV=production`), but double-check that env var is actually set to `production` on Render, and that you're visiting the site over `https://`, not `http://`.

**CORS errors in the browser console.**
`FRONTEND_URL` on Render doesn't match the exact URL you're visiting the frontend from (including `https://`, no trailing slash). Update it and redeploy the backend.

**Database connection times out from Render but worked locally.**
See the IPv6/IPv4 note in §3.3 — switch to the Shared pooler (session mode) connection string.

**"Only @nec.edu.in college accounts are eligible for voting" for an account that should be allowed.**
Check `ALLOWED_EMAIL_DOMAIN` on Render matches the real domain exactly (no `@`, no typos).

**Images/videos don't load, or Next.js throws an image "hostname not configured" error.**
Supabase Storage URLs always end in `.supabase.co`, which `frontend/next.config.js` already allows. If you're using a custom Supabase domain, add it to `images.remotePatterns` there.

**A team's image/video won't upload from the admin dashboard.**
Check the file isn't over the limit (8 MB for images, 150 MB for videos — adjust `MAX_IMAGE_BYTES` / `MAX_VIDEO_BYTES` in `backend/src/controllers/admin.controller.ts` and `backend/src/middleware/upload.ts` if you need more), and that the two Storage buckets exist, are named exactly `product-images` / `product-videos` (or match your env vars), and are set to Public.

**I need to test the "voting closed" and "results published" screens without waiting for Saturday.**
Just click **Stop Voting** / **Display Winners** in the admin dashboard — the same one your admin account will use for real. Click **Start Voting** again afterwards to keep testing.

---

## 13. Security notes (what's already handled for you)

- **Google OAuth only** — there is no username/password system anywhere, so there's no password database to protect or leak.
- **Domain check is server-side** — `backend/src/config/passport.ts` rejects any non-`@nec.edu.in` account _before_ a session is ever created, regardless of what the browser sends.
- **Admin access is server-side** — `ADMIN_EMAILS` is only ever read by the backend (`backend/src/config/env.ts` / `middleware/auth.ts`); the frontend's "isAdmin" flag is just a display convenience computed by the backend on every request, never trusted on its own.
- **One vote per student is enforced at the database level** — `votes.user_id` has a `UNIQUE` constraint (see `schema.sql`). Even a direct, hand-crafted API call cannot create a second vote; the backend explicitly catches that database error and returns a clean "already voted" response.
- **Sessions are `httpOnly`, `Secure` (in production), and `SameSite` cookies** — never readable by JavaScript, only sent to the exact backend domain.
- **Uploads never touch the frontend's credentials** — the Supabase `service_role` key lives only in Render's environment variables. File type and size are validated server-side before anything is uploaded.
- **Team deletion is guarded** — if a team already has recorded votes, the backend archives it (hides it from the gallery) instead of deleting it, so historical vote data is never silently destroyed.
- **A one-line audit trail on dependencies**: `npm audit` currently comes back clean on the backend. On the frontend, it reports one remaining advisory chain (an outdated PostCSS copy bundled _inside_ Next.js's own build tooling, not something this app's runtime ever exercises) — clearing it fully means moving to Next.js's next major version, which involves its own migration work. Worth revisiting periodically with `npm audit` as part of normal maintenance, along with `npm outdated`.

---

## 14. Customization

- **Colors/fonts**: `frontend/tailwind.config.ts` (palette) and `frontend/app/layout.tsx` (Google Fonts — currently Playfair Display for headings, Inter for body).
- **Event copy/dates**: `frontend/app/page.tsx` (landing page) and `frontend/app/gallery/page.tsx` (voting-closes label).
- **Upload size limits**: `backend/src/middleware/upload.ts` and `backend/src/controllers/admin.controller.ts` (`MAX_IMAGE_BYTES` / `MAX_VIDEO_BYTES`).
- **"Eligible voters" definition**: the admin dashboard currently defines it as _everyone who has ever signed in_ (there's no separate student roster feature). See `getStats` in `backend/src/controllers/admin.controller.ts` if you want to wire up a real roster count instead.

---

Built for INNOVERSE — Prompt to Product Expo. One college Google account, one vote — enforced by the database, not the browser.
