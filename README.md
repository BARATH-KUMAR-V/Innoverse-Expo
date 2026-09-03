# INNOVERSE — Prompt to Product Expo

A real, production-ready full-stack voting platform: college students sign in with their `@nec.edu.in` Google account, browse exhibited products, and cast one vote each. Everything that matters — authentication, the one-vote rule, voting open/closed state, results — is enforced by the server and the database, never by the browser.

This README is a complete, start-from-zero build guide: Supabase, Google Cloud, local development, GitHub, and Vercel, in the order you actually need to do them. Follow it top to bottom the first time; after that, jump to whichever section you need.

**Nothing here needs you to write code.** Every step is a dashboard click, a copy-pasted value, or a terminal command given to you exactly as written.

---

## 1. What you're deploying

| Layer          | Technology                                                | Where it runs    |
| -------------- | ---------------------------------------------------------- | ---------------- |
| Frontend + API | Next.js 15 (App Router) + TypeScript + Tailwind + Zustand | Vercel           |
| Database       | PostgreSQL                                                  | Supabase         |
| File storage   | Product images & videos                                     | Supabase Storage |
| Authentication | Google OAuth 2.0, restricted to `@nec.edu.in`                | Google Cloud     |

```
Student's browser
      │
      ▼
Next.js app (Vercel)  ── pages + /app/api/* route handlers
      │                              │
      ├──► PostgreSQL (Supabase)     users, teams, votes, voting_config, event_settings, sessions
      └──► Supabase Storage          product images & videos
```

The browser never talks to the database or to Supabase Storage directly, and it never decides who's an admin or whether someone has already voted — it only ever calls this app's own API routes, and those are the only thing with real credentials. The one exception is uploading a product image/video: the admin dashboard uploads those files straight from the browser to Supabase Storage using a short-lived signed URL that an API route issues — this is necessary because Vercel's serverless functions cap request bodies at a few megabytes, far below the 150 MB this app allows for product videos. The metadata (which team, which URL) still only ever reaches the database through the server.

### Project structure

```
innoverse-voting/
├── frontend/                       Next.js app — the whole product (deploys to Vercel)
│   ├── app/
│   │   ├── api/                    Route Handlers — auth, teams, votes, admin, results
│   │   ├── admin/                  admin dashboard pages
│   │   ├── gallery/, product/[id]/, results/, success/, page.tsx, layout.tsx
│   ├── lib/
│   │   ├── env.ts, db.ts           server env loader, Postgres connection pool
│   │   ├── session.ts              cookie-based session helpers
│   │   ├── google-oauth.ts         Google OAuth 2.0 redirect + token exchange
│   │   ├── supabase.ts             Supabase Storage admin client (service role)
│   │   ├── api-handler.ts          requireAuth/requireAdmin + error handling
│   │   └── services/               database queries & Storage uploads
│   ├── db/                         schema.sql, seed.sql
│   ├── store/                      Zustand state (auth, UI)
│   └── .env.local.example
└── README.md                       you are here
```

---

## 2. Prerequisites

- A free [Supabase](https://supabase.com) account.
- A [Google Cloud](https://console.cloud.google.com) account (a personal Google account is enough — you don't need an `@nec.edu.in` account to _build_ this, only students need one to _vote_).
- A free [Vercel](https://vercel.com) account.
- A [GitHub](https://github.com) account.
- [Node.js](https://nodejs.org) 18.18 or newer installed on your computer, for local testing before you deploy.

Do the sections in order: **Supabase → Google Cloud → local test → GitHub → Vercel → connect the URLs together.**

---

## 3. Supabase: database + file storage

### 3.1 Create the project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and click **New project**.
2. Pick an organization (or create one), give the project a name (e.g. `innoverse`), generate/choose a strong **database password** — **save this password somewhere**, you'll need it in a minute — and pick a region close to your users (e.g. Mumbai/Singapore for India).
3. Click **Create new project** and wait a minute or two while it provisions.

### 3.2 Run the database schema

1. In the left sidebar, open the **SQL Editor**.
2. Click **New query**.
3. Open `frontend/db/schema.sql` from this project, copy its entire contents, paste it into the SQL Editor, and click **Run**.
4. This creates six tables: `users`, `teams`, `votes`, `voting_config`, `event_settings` (the expo date/venue and voting/results schedule — see §8), and `sessions` (used to store login sessions). It's safe to run more than once.

**Optional — sample data for testing:** if you want to click through the whole voting flow locally before you have real teams and images, also run `frontend/db/seed.sql` the same way. It adds three sample teams with stock photos so the gallery isn't empty. Delete them later from the admin **Manage Teams** page once you add the real ones.

### 3.3 Get your database connection string

1. Click the **Connect** button near the top of the project dashboard.
2. Choose the **Transaction pooler** connection string (not "Direct connection" and not "Session mode"). Vercel Route Handlers run as short-lived serverless functions rather than one long-running server, and the Transaction pooler (port `6543`, PgBouncer under the hood) is exactly what Supabase recommends for that kind of caller.
3. Copy it. It looks like:
   ```
   postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-xx-xxxx-1.pooler.supabase.com:6543/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with the database password from step 3.1. This full string is your `DATABASE_URL`.

### 3.4 Create the storage buckets

1. In the left sidebar, open **Storage**.
2. Click **New bucket**, name it exactly `product-images`, toggle it **Public**, and set its **file size limit** to `8 MB`. Create it.
3. Repeat for a second bucket named exactly `product-videos`, also **Public**, with a file size limit of `150 MB`.
   (These exact names match `SUPABASE_IMAGE_BUCKET` / `SUPABASE_VIDEO_BUCKET` in the app's environment variables — if you name them differently, update those to match. The file size limits are the real backstop behind the 8 MB image / 150 MB video caps the admin dashboard enforces.)
4. "Public" here only means _anyone with the file's URL can view it_ (necessary — students need to see product images/videos). Nobody can **upload** to these buckets except through a short-lived signed URL that this app's admin-only API issues, because generating one requires the service role key, which only the server ever has.

### 3.5 Get your API keys

1. Open **Project Settings → API** (or **Project Settings → API Keys**, depending on the dashboard version you see).
2. Copy the **Project URL** → this is both `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`.
3. Copy the **`service_role`** secret key (not the `anon` public key) → this is `SUPABASE_SERVICE_ROLE_KEY`.
4. Copy the **`anon`** public key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`. It's meant to be public (it ships to the browser) — it's what lets the admin dashboard upload a file directly to Storage using the signed URL the server issued.

**Treat the service role key like a password.** It bypasses all access rules. It only ever goes into the server-side environment variables (never the `NEXT_PUBLIC_*` ones) — never into the browser, never into git.

You're done with Supabase for now. Keep this tab open — you'll come back to add teams later.

---

## 4. Google Cloud: OAuth login

This is what lets students sign in with their college Google account, and what the app uses to verify the email actually ends in `@nec.edu.in`.

### 4.1 Create a project

1. Go to the [Google Cloud Console](https://console.cloud.google.com).
2. Top bar → project dropdown → **New Project**. Name it (e.g. `innoverse-expo`) and create it.

### 4.2 Configure the OAuth consent screen

1. In the search bar (or left menu), go to **Google Auth Platform → OAuth consent screen**.
2. Click **Get started**, then fill in the short wizard:
   - **App information**: app name (e.g. "Innoverse Voting") and a support email.
   - **Audience**: choose **External** — this lets any Google account attempt to sign in (the app is what actually restricts it to `@nec.edu.in`, so this is safe).
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
5. **Authorized redirect URIs** — this must exactly match the app's callback route:
   ```
   http://localhost:3000/api/auth/google/callback
   https://your-app.vercel.app/api/auth/google/callback
   ```
   (You don't have the real `vercel.app` URL yet — that's fine, add the `localhost` one now, and come back to add the real one in [Section 7](#7-deploy-to-vercel) once you've deployed.)
6. Create it, then copy the **Client ID** and **Client secret** immediately — the secret is only shown in full once.

> **The #1 OAuth error** people hit is `redirect_uri_mismatch` — the callback URL Google receives must match one of the URIs above **exactly**: same protocol (`https` vs `http`), no trailing slash, right path. If you see that error later, this is the first place to check.

You now have `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

---

## 5. Run it locally first

Always worth doing before deploying — it's much faster to fix a typo locally than through a redeploy.

```bash
cd frontend
cp .env.local.example .env.local
```

Open `.env.local` and fill in:

- `DATABASE_URL` — from Supabase (§3.3)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — from Google Cloud (§4.3)
- `GOOGLE_CALLBACK_URL` — leave as `http://localhost:3000/api/auth/google/callback` for now
- `ADMIN_EMAILS` — your own `@nec.edu.in`-style test email(s), comma-separated
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase (§3.5)

Then install and run:

```bash
npm install
npm run dev
```

Visit `http://localhost:3000/api/health` in a browser — it should return `{"status":"ok"}`.

Visit `http://localhost:3000`. You should see the Innoverse landing page. Click **Cast Your Vote Now** → **Continue with Google** and sign in with a real Google account whose email ends in `@nec.edu.in` (or, for local testing, temporarily set `ALLOWED_EMAIL_DOMAIN` in `.env.local` to match whatever email domain you're testing with, then change it back before going live).

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

Your `.env.local` file is already excluded via `.gitignore` — double check with `git status` that no `.env.local` file is about to be committed before you push.

---

## 7. Deploy to Vercel

1. [vercel.com/new](https://vercel.com/new) → import your GitHub repository.
2. When configuring the project:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js (auto-detected)
3. Under **Environment Variables**, add every variable from `frontend/.env.local.example` with your real values — the same ones you used locally, with one difference: `GOOGLE_CALLBACK_URL` isn't known yet (you don't have the real `vercel.app` URL until after the first deploy), so put in a placeholder for now, e.g. `https://placeholder.vercel.app/api/auth/google/callback`.
4. Click **Deploy**. When it finishes, you'll get a URL like `https://innoverse-expo.vercel.app`.
5. Now that you know the real URL, go back and fix the placeholder:
   - **Vercel → your project → Settings → Environment Variables**: update `GOOGLE_CALLBACK_URL` to `https://<your-app>.vercel.app/api/auth/google/callback`, then **redeploy** (Settings → Deployments → ⋯ → Redeploy on the latest deployment).
   - **Google Cloud → Clients → your OAuth client**: add the real URLs alongside the localhost ones — Authorized JavaScript origin `https://<your-app>.vercel.app` and Authorized redirect URI `https://<your-app>.vercel.app/api/auth/google/callback`.
6. Visit your real Vercel URL, click through **Cast Your Vote Now → Continue with Google**, and confirm you land back on the gallery signed in. Because the frontend and the API are the same Vercel deployment, this is a same-origin request end to end — no CORS, no cross-site cookie configuration to get right.
7. Visit `https://<your-app>.vercel.app/api/health` — confirm it returns `{"status":"ok"}`.

If step 6 fails, see [Troubleshooting](#11-troubleshooting) below.

---

## 8. Event settings — no hardcoded dates

The expo name, expo date/hours, venue, voting start time, voting close time, and winner-announcement time are **not** in the source code anywhere — they live in the `event_settings` database row and are edited from **Admin → Event Settings**. The landing page, the gallery, and the vote-confirmation screen all read these values live, so updating them there instantly updates the whole site.

- **Voting Starts** is informational only — it's what the landing page and gallery display, but voting only actually accepts votes once an admin clicks **Start Voting** on `/admin/voting`. This is deliberate: the schedule communicates intent to students, but a person still confirms the event is actually ready to go live.
- **Voting Closes** is enforced, not just displayed — once this instant passes, voting automatically closes on the next request (see `applyAutoCloseIfDue` in `frontend/lib/services/votingConfig.ts`), even if the admin dashboard's Stop Voting button was never clicked. The manual Stop Voting button still works as an early/immediate override.
- **Winners Announced** is informational only — students see it before voting; the winners themselves only become public once an admin explicitly clicks **Publish Winners** on `/admin/rankings`, regardless of what this time says.

`db/schema.sql` seeds this table with example dates so local development shows real-looking content — replace every field from Admin → Event Settings before the real event.

## 9. Running the event

1. **Before the event**: sign in once yourself (so the admin check has an account to match against), confirm your email is in `ADMIN_EMAILS` on Vercel, go to **Admin → Event Settings** and set the real expo date/venue and voting/results schedule, then go to `/admin/teams` and add every real team — name, product image, product video. Delete/archive the sample teams if you ran the seed data.
2. **When it's time to open voting**: go to `/admin/voting` and click **Start Voting**.
3. **During the event**: `/admin` shows near-real-time stats (refreshes every 30 seconds) — total votes, participation, voting status. `/admin/rankings` shows the live leaderboard — **only admins ever see this**, students cannot.
4. **At the configured close time**: voting closes automatically on its own (see §8) — `/admin/voting` also lets you **Stop Voting** manually at any point before that if you need to close early.
5. Review `/admin/rankings`, then **Export CSV** if you want a record.
6. Click **Display Winners** on `/admin/rankings` — the top 3 immediately become visible to everyone on the public `/results` page.

---

## 10. Environment variable reference

One set of variables, set once in Vercel (Project → Settings → Environment Variables) and mirrored in `frontend/.env.local` for local dev.

| Variable                        | Example                                                                        | Notes                                                              |
| -------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`                   | `postgresql://postgres.xxxx:...@aws-0-xx-xxxx-1.pooler.supabase.com:6543/postgres` | Supabase §3.3 — the **Transaction pooler** string, not Direct connection |
| `GOOGLE_CLIENT_ID`               | `....apps.googleusercontent.com`                                                  | Google Cloud §4.3                                                     |
| `GOOGLE_CLIENT_SECRET`           |                                                                                   |                                                                        |
| `GOOGLE_CALLBACK_URL`            | `https://your-app.vercel.app/api/auth/google/callback`                           | Must match Google Cloud exactly                                      |
| `ALLOWED_EMAIL_DOMAIN`           | `nec.edu.in`                                                                      |                                                                        |
| `ADMIN_EMAILS`                   | `admin1@nec.edu.in,admin2@nec.edu.in`                                             | Comma-separated, no spaces needed                                    |
| `SUPABASE_URL`                   | `https://xxxx.supabase.co`                                                        | Supabase §3.5                                                         |
| `SUPABASE_SERVICE_ROLE_KEY`      |                                                                                   | Secret — server-side only, never `NEXT_PUBLIC_*`                     |
| `SUPABASE_IMAGE_BUCKET`          | `product-images`                                                                  | Must match the bucket name                                           |
| `SUPABASE_VIDEO_BUCKET`          | `product-videos`                                                                  | Must match the bucket name                                           |
| `NEXT_PUBLIC_SUPABASE_URL`       | `https://xxxx.supabase.co`                                                        | Same value as `SUPABASE_URL` — public, ships to the browser          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  |                                                                                   | The `anon` key — public by design, used for direct-to-Storage uploads |

The expo date/venue and voting/results schedule are **not** environment variables — see §8, they're edited from Admin → Event Settings and live in the `event_settings` table.

---

## 11. Troubleshooting

**`redirect_uri_mismatch` from Google.**
The callback URL the app sent doesn't exactly match one in Google Cloud → Clients → your client → Authorized redirect URIs. Check protocol, trailing slash, and that you added _both_ the localhost and production URLs.

**Signed in on Google, but redirected back "logged out," or `/api/auth/me` always says `authenticated: false`.**
Since the frontend and API are the same Vercel deployment, the session cookie is always first-party — this class of bug is much less likely than it used to be. Double-check you're visiting the site over `https://` in production, and that `GOOGLE_CALLBACK_URL` in Vercel matches the domain you're actually visiting.

**Database connection errors from Vercel that don't happen locally.**
Confirm `DATABASE_URL` is the **Transaction pooler** string (port `6543`), not a Direct connection string — see §3.3. Direct connections aren't designed for the burst of short-lived connections a serverless deployment opens.

**"Only @nec.edu.in college accounts are eligible for voting" for an account that should be allowed.**
Check `ALLOWED_EMAIL_DOMAIN` on Vercel matches the real domain exactly (no `@`, no typos).

**Images/videos don't load, or Next.js throws an image "hostname not configured" error.**
Supabase Storage URLs always end in `.supabase.co`, which `frontend/next.config.js` already allows. If you're using a custom Supabase domain, add it to `images.remotePatterns` there.

**A team's image/video won't upload from the admin dashboard.**
Check the file isn't over the limit (8 MB for images, 150 MB for videos — adjust the file size limit on the relevant bucket in Supabase Storage, §3.4, and the matching `MAX_IMAGE_BYTES` / `MAX_VIDEO_BYTES` constants in `frontend/lib/services/storage.ts` if you need more), and that the two Storage buckets exist and are named exactly `product-images` / `product-videos` (or match your env vars) and are set to Public.

**I need to test the "voting closed" and "results published" screens without waiting for Saturday.**
Just click **Stop Voting** / **Display Winners** in the admin dashboard — the same one your admin account will use for real. Click **Start Voting** again afterwards to keep testing.

---

## 12. Security notes (what's already handled for you)

- **Google OAuth only** — there is no username/password system anywhere, so there's no password database to protect or leak.
- **Domain check is server-side** — `frontend/app/api/auth/google/callback/route.ts` rejects any non-`@nec.edu.in` account _before_ a session is ever created, regardless of what the browser sends.
- **Admin access is server-side** — `ADMIN_EMAILS` is only ever read by the server (`frontend/lib/env.ts` / `frontend/lib/api-handler.ts`); the frontend's "isAdmin" flag is just a display convenience computed by the server on every request, never trusted on its own.
- **One vote per student is enforced at the database level** — `votes.user_id` has a `UNIQUE` constraint (see `frontend/db/schema.sql`). Even a direct, hand-crafted API call cannot create a second vote; the app explicitly catches that database error and returns a clean "already voted" response.
- **Sessions are `httpOnly`, `Secure` (in production), `SameSite=Lax` cookies, looked up against a Postgres `sessions` table** — never readable by JavaScript, and always first-party since the frontend and API share one origin.
- **Uploads never touch the browser's credentials** — the Supabase `service_role` key lives only in the server's environment variables. The browser only ever holds a narrowly-scoped, short-lived signed upload URL for one specific file. File type and size are checked before that URL is issued, and the Storage bucket's own file size limit is the real backstop.
- **Team deletion is guarded** — if a team already has recorded votes, the app archives it (hides it from the gallery) instead of deleting it, so historical vote data is never silently destroyed.

---

## 13. Customization

- **Colors/fonts**: `frontend/tailwind.config.ts` (palette) and `frontend/app/layout.tsx` (Google Fonts — currently Playfair Display for headings, Inter for body).
- **Event dates/venue/schedule**: not in the code — see §8, edit from Admin → Event Settings.
- **Landing/gallery copy that isn't schedule data** (headline, subheading, feature list): `frontend/app/page.tsx` and `frontend/app/gallery/page.tsx`.
- **Upload size limits**: `frontend/lib/services/storage.ts` (`MAX_IMAGE_BYTES` / `MAX_VIDEO_BYTES`) and the matching file size limit on each bucket in Supabase Storage (§3.4).
- **"Eligible voters" definition**: the admin dashboard currently defines it as _everyone who has ever signed in_ (there's no separate student roster feature). See `getStats` in `frontend/app/api/admin/stats/route.ts` if you want to wire up a real roster count instead.

---

Built for INNOVERSE — Prompt to Product Expo. One college Google account, one vote — enforced by the database, not the browser.
