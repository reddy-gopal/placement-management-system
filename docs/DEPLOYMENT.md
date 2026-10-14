# Deploying NexStep

This guide hosts NexStep on free tiers:

| Part | Host | What it runs |
|---|---|---|
| Database | **MongoDB Atlas** (M0 free cluster) | MongoDB |
| Backend API | **Render** (free Web Service) | `Backend/`: Node + Express |
| Frontend | **Vercel** (Hobby) | `client/`: static Vite build |
| Email | **Resend** | Verification codes and notifications |

```
Browser ──► https://nexstep.vercel.app            (Vercel: static React app)
   │
   └──fetch──► https://nexstep-api.onrender.com/api/v1   (Render: Express API)
                    ├──► MongoDB Atlas
                    └──► Resend API (email)
```

The frontend calls the API directly at `VITE_API_URL`; there is no proxy in production. The JWT
travels in the `Authorization` header, not a cookie, so the two parts can live on different
domains without any cookie setup.

Other hosts work too (Railway or Koyeb for the API; Netlify or Cloudflare Pages for the client).
The environment variables and build commands stay the same. Only the screens differ.

---

## 0. Before you deploy: fix the blockers

The pre-deployment check (§7) found four things to settle before going live.

| # | Blocker | Fix |
|---|---|---|
| B1 | **Emails only reach one inbox.** Resend's default sender `onboarding@resend.dev` only delivers to the email address that owns the Resend account. Students and recruiters must verify by email to sign in, so **nobody else can complete sign-up**. | Verify a domain you own in Resend (Domains → Add domain, then add the DNS records it gives you) and set `RESEND_FROM_EMAIL=NexStep <noreply@yourdomain>`. For a demo with no domain, create pre-verified demo accounts with a seed script instead. |
| B2 | ~~`POST /api/v1/auth/test-email` is public.~~ | **Fixed on `chore/deploy-prep`:** now admin-only, and `to` is required. |
| B3 | **Atlas refuses connections from outside its IP allowlist.** Confirmed from this machine. Render's free tier has no fixed outbound IP. | In Atlas → Network Access, add `0.0.0.0/0` (allow from anywhere), and rely on a strong database password. |
| B4 | The admin script defaults to `Admin@12345`. | Always pass your own password (§3.5). The script no longer prints the password (fixed on `chore/deploy-prep`). |

Done on branch `chore/deploy-prep`: `nodemon` moved to devDependencies (the production audit
is now clean), `engines.node >= 20` in both `package.json` files, a `GET /api/v1/health` route,
CORS restricted through `CORS_ORIGIN`, the `X-Powered-By` header removed, and
`client/vercel.json` added.

Still recommended:

- Put a database name in the URI (`…mongodb.net/nexstep?…`). The local `.env` has none, so data
  lands in Mongo's default `test` database.

---

## 1. Prerequisites

- A GitHub account with access to `reddy-gopal/placement-management-system`. Render and Vercel
  deploy straight from GitHub.
- Accounts on [MongoDB Atlas](https://cloud.mongodb.com), [Render](https://render.com),
  [Vercel](https://vercel.com) and [Resend](https://resend.com). Free plans are enough.
- The code you deploy must be pushed to `main`. Both hosts redeploy on every push to the
  branch you connect.

---

## 2. Database: MongoDB Atlas

1. **Create a cluster:** Create → M0 Free → pick the region nearest to your Render region (for
   example AWS Mumbai `ap-south-1` with Render Singapore).
2. **Create a user:** Security → Database Access → Add New Database User. Choose password
   auth, the role *Read and write to any database*, and a long generated password.
3. **Open the network:** Security → Network Access → Add IP Address → *Allow access from
   anywhere* (`0.0.0.0/0`). See blocker B3.
4. **Get the URI:** Database → Connect → Drivers. Copy the URI and add the database name
   before the `?`:

   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/nexstep?retryWrites=true&w=majority
   ```

   URL-encode special characters in the password (`@` → `%40`, `#` → `%23`, `/` → `%2F`).

Keep production data separate: use a different database name, or a separate cluster, from
the one in your local `.env`.

---

## 3. Backend: Render

### 3.1 Create the service

Render → New → **Web Service** → connect the GitHub repo, then set:

| Setting | Value |
|---|---|
| Name | `nexstep-api`, which gives the URL `https://nexstep-api.onrender.com` |
| Region | Same area as Atlas |
| Branch | `main` |
| Root Directory | `Backend` |
| Runtime | Node |
| Build Command | `npm ci --omit=dev` |
| Start Command | `node src/server.js` |
| Instance Type | Free |
| Health Check Path | `/api/v1/health` |

### 3.2 Environment variables

Add these under Render → Environment:

| Key | Value | Notes |
|---|---|---|
| `NODE_VERSION` | `20` | Pins Node; tested locally on Node 24 |
| `MONGO_URI` | The Atlas URI from §2 | |
| `JWT_SECRET` | 64 random hex chars | Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Do not reuse the local one, which is under 32 characters. |
| `JWT_EXPIRES` | `7d` | |
| `RESEND_API_KEY` | `re_…` | Resend → API Keys → Create (Sending access) |
| `RESEND_FROM_EMAIL` | `NexStep <noreply@yourdomain>` | Must be on a verified domain (B1) |

Do **not** set `PORT`. Render provides it, and `server.js` already reads `process.env.PORT`.

### 3.3 Deploy

Click **Create Web Service**. The log should end with:

```
DB CONNECTED SUCCESSFULLY
SERVER running on port 10000
```

If it ends with `DB CONNECTION FAILED`, check B3 (the Atlas allowlist) and the password
encoding in the URI.

### 3.4 Smoke-test the live API

```bash
API=https://nexstep-api.onrender.com/api/v1
curl -i $API/auth/me        # expect 401 {"success":false,"message":"Authentication token required"}
curl -i $API/nope           # expect 404 {"success":false,"message":"Route not found"}
```

On the free tier the service sleeps after 15 minutes without traffic, so the first request can
take about 50 seconds. Open the API URL a minute before a demo to wake it.

### 3.5 Create the admin (TPO) account

Self-sign-up can't create admins. Run the seed script once against production. Either:

- **Render Shell** (paid plans only): `npm run seed:admin -- tpo@college.edu '<strong-password>' 'Placement Officer'`
- **From your machine** (works on the free plan), from inside `Backend/`. In Git Bash:

  ```bash
  MONGO_URI='<production URI>' node src/scripts/createAdmin.js tpo@college.edu '<strong-password>' 'Placement Officer'
  ```

  In PowerShell:

  ```powershell
  $env:MONGO_URI='<production URI>'; node src/scripts/createAdmin.js tpo@college.edu '<strong-password>' 'Placement Officer'
  ```

Your current IP must be allowed in Atlas; `0.0.0.0/0` covers it. The script prints the
password, so clear your terminal afterwards (B4).

---

## 4. Frontend: Vercel

### 4.1 The SPA rewrite

React Router handles URLs such as `/student/drives` in the browser. Without a rewrite, Vercel
returns 404 when someone refreshes or opens a deep link. `client/vercel.json` (already added)
contains:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```


### 4.2 Create the project

Vercel → Add New → Project → import the repo, then set:

| Setting | Value |
|---|---|
| Root Directory | `client` |
| Framework Preset | Vite (auto-detected) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm ci` |
| Node.js Version (Settings → General) | 20.x |

Environment variable (scope: Production, and Preview too if you use preview deploys):

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://nexstep-api.onrender.com/api/v1` |

`VITE_` variables are **baked into the build**. If you change this value, redeploy
(Deployments → ⋯ → Redeploy). Changing it alone does nothing.

### 4.3 Deploy and check

Click **Deploy**. When it finishes, open the Vercel URL and check:

1. `/login` loads. Refreshing `/student` redirects to `/login`, not a Vercel 404.
2. DevTools → Network: requests go to `nexstep-api.onrender.com/api/v1/...`, not to
   `/api/v1` on the Vercel domain.
3. Sign in as the admin from §3.5 and confirm the overview page loads.

### 4.4 Lock CORS to the frontend

Once the Vercel URL is known, set `CORS_ORIGIN=https://<your-project>.vercel.app` on Render
(Environment → Save, which redeploys). Comma-separate extra origins, such as a custom domain.
While `CORS_ORIGIN` is unset, any site may call the API.

---

## 5. End-to-end check on production

Do this once, with real inboxes.

| Step | Who | Expected |
|---|---|---|
| 1 | Sign up as a student | A code email arrives (only works once B1 is fixed); `/verify` accepts it |
| 2 | Complete the profile (CGPA, branch, resume URL) | Saved |
| 3 | Sign up as a recruiter, verify, create the company profile | Saved |
| 4 | Recruiter posts a drive the student qualifies for, and one they don't | The student sees *Eligible* and *Not eligible*, with the reason |
| 5 | Student applies | "Application submitted" email arrives |
| 6 | Recruiter shortlists → Generate Jitsi Room → save | "Interview scheduled" email with the link; the link opens a Jitsi room |
| 7 | Recruiter selects | Offer email; the student sees Accept/Decline |
| 8 | Student accepts | Admin overview shows 1 placed and the package |

---

## 6. Day-2 operations

- **Redeploys:** every push to `main` rebuilds both services. Roll back from each dashboard
  (Render → Events → Rollback; Vercel → Deployments → Promote).
- **Logs:** Render → Logs shows API errors and `[EmailService]` failures. Resend → Emails shows
  delivery status.
- **Secrets:** never commit `.env`. It is git-ignored and no `.env` is tracked today. To rotate
  `JWT_SECRET`, change it on Render; every user is then signed out.
- **Backups:** the M0 tier has no automated backups. Before the demo or submission, export with
  `mongodump --uri "<production URI>"`.
- **CI:** `.github/workflows/ci.yml` looks for `server/`, so it never builds or tests
  `Backend/`. Point that job at `Backend/` so a broken backend can't reach `main` unnoticed.

---

## 7. Pre-deployment check results (2026-10-13, `main` @ `6a9f110`)

Run locally on Node 24.21.0 / npm 12.2.0.

### Backend

| Check | Result |
|---|---|
| `npm ci` clean install | ✅ (one blocked install script, `@scarf/scarf`; that's telemetry and harmless) |
| `node --check` on every file in `src/` | ✅ no syntax errors |
| Import every module (routes, services, email) | ✅ |
| Prettier | ⚠️ 11 files not formatted (`npm run format` fixes them) |
| `npm audit --omit=dev` | ⚠️ 3 high, all from `nodemon` → `chokidar` → `braces`. Fixed by moving `nodemon` to devDependencies. |
| Connect to the Atlas cluster in local `.env` | ❌ refused: this IP isn't on the allowlist (B3) |
| End-to-end API test against a throwaway MongoDB | ✅ **31 of 33 checks passed.** Both failures are security issues, not functional bugs (below). |

The end-to-end test ran the real server and the real `seed:admin` script against an in-memory
MongoDB. Resend had an invalid key, so no email could go out. It checked:

- **Boot:** the server starts and connects in about 1.6 s. Unknown routes return 404 JSON.
  Missing or forged tokens return 401.
- **Sign-up and verification:** sign-up returns no token until verified; ADMIN sign-up is
  rejected; login before verifying returns 403 and sends a new code; a wrong code returns 400;
  the right code verifies and returns a token; the seeded admin can log in.
- **RBAC:** a student can't read admin stats or create drives. A recruiter can't change another
  company's drive.
- **Validation:** a CGPA above 10 is rejected.
- **Eligibility:** an eligible drive is flagged; an ineligible one gives the exact reason
  (`Requires CGPA >= 8.5; your CGPA is 7.2`).
- **Applying:** applying to an ineligible drive returns 403; a duplicate apply returns 409.
- **Pipeline:** an illegal APPLIED → SELECTED jump returns 400. Shortlisting with a Jitsi link,
  selecting (offer PENDING), and accepting the offer all work. Admin stats show 1 placed at
  8.5 LPA. A placed student can't apply again.
- **Email failures:** every request still succeeded while every email send failed.
- **Failed:** the seed script prints the admin password (B4). `/auth/test-email` answers 200
  without a token (B2).

### Frontend

| Check | Result |
|---|---|
| `npm ci` clean install | ✅ |
| `npm run build` with `VITE_API_URL` set | ✅ built in 36 s. JS 409 kB (119 kB gzip), CSS 55 kB (11 kB gzip). The API URL is baked in; no `localhost` in the bundle. |
| `npm test` | ❌ "No test files found" (exit 1). Vitest is configured but no tests exist. |
| `npm audit --omit=dev` (shipped code) | ⚠️ 2 moderate: `react-router` 6.x open-redirect advisories. The fix is React Router 7 (major upgrade); low risk for this app, since it never navigates to user-supplied URLs. |
| `npm audit` (including dev tools) | ⚠️ 2 critical in `vitest` / `tinypool`. These are dev-only and not shipped. Upgrade Vitest when tests are added. |
| SPA deep-link rewrite for the host | ❌ missing: add `client/vercel.json` (§4.1) |

### Verdict

**The code is ready to deploy.** Before real users sign up:

1. Verify a Resend domain (B1).
2. Remove or protect `/auth/test-email` (B2).
3. Open Atlas network access (B3).
4. Add `client/vercel.json`.
