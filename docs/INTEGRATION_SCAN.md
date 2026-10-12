# Integration Scan: `main` ↔ `member2`

Scanned 2026-10-11. Read-only analysis; nothing was merged, committed or checked out.

| Ref | Commit | Author | Content |
|---|---|---|---|
| `main` (= `origin/main`) | `f586ddf` "completed backend features" (on top of `a8ee8f9` "Backend skaffhold…") | Advaith | Full backend in `Backend/` (ESM, Express 5, Mongoose 9) |
| `origin/member2` | `ae78ff2` "Add my project changes" | Sai Divyanshi | React client in `client/` **and a second backend in `server/`** (CommonJS, Express 4, Mongoose 8), root npm workspace |
| merge-base | `288772b` "ci: streamline CI/CD pipeline…" (2026-10-03) | | |

Source of truth: `docs/05-data-model.md`, `docs/06-api-contract.md`, `docs/02-rbac-permission-matrix.md`.

---

## 1. Top risks

1. **Two backends.** `member2` ships its own Express API in `server/` (student profile only). `main` has the full API in `Backend/`. They share no files, so **git will merge them without a single conflict** and you will end up with two servers, two `StudentProfile` models and two lockfiles. Every real conflict in this report is semantic, not textual.
2. **The frontend cannot talk to `main`'s backend as-is.** It calls `GET/POST /api/v1/student/profile` on port 4000 and reads `data.profile`. `main` serves `GET /api/students/me` + `POST`/`PUT` on port 5000 and returns the raw profile, with a 404 when none exists (§5).
3. **Different collections for the same model.** `member2` stores profiles in `student_profiles` (`server/models/StudentProfile.js:71`, matches docs/05 §2.2). `main` has no `collection` option, so Mongoose uses `studentprofiles` (`Backend/src/entity/StudentProfile.js:69-71`). Pointed at the same database, each backend would see none of the other's profiles.
4. **`main` deviates from docs/06 on almost every path and response shape** (`/api` vs `/api/v1`, `/auth/register` vs `/auth/signup`, `/drives/:id/apply` vs `/applications/apply`, raw objects vs `{ success, … }`). M2 followed the docs exactly, so if docs/06 is the tiebreaker, **`main` is the side that must change**.
5. **Folder layout.** CI (`.github/workflows/ci.yml:61,94`), docs/04 (`server/utils/mailer.js`) and M2's root `package.json` workspaces (`["client","server"]`) all expect `server/` + `client/`. `main` uses `Backend/` (plus an empty, untracked `Frontend/`), so **CI currently skips `main`'s backend entirely**.
6. **Branch values are free text on `main`** (`StudentProfile.js:19-23`, `JobDrive.js` `allowedBranches: [String]`) but an enum on `member2` (`['CSE','IT','ECE','EEE','MECH','CIVIL']`). Eligibility compares exact strings (`Backend/src/helper.js:67`), so `"cse"` vs `"CSE"` silently makes a student ineligible.
7. **M2's dev auth bypass won't work against `main`.** `AUTH_DISABLED` and `npm run dev:token` sign tokens for user ids that have no `User` document. `main`'s `studentOnly` looks the user up (`Backend/src/middlewares/index.js:24-27`), so every request gets 401 "User not found".

The good news: **the JWT payload is compatible**. `main` signs `{ id, email, role }` (`Backend/src/helper.js:36-37`), which is exactly what M2's `requireAuth` expects (`server/middleware/auth.js:37`, `req.user.id`). The **field names also match** (`userId`, `rollNumber`, `cgpa`, `activeBacklogs`, `skills: [String]`, `resumeUrl`), so none of the feared `CGPA` / `rollNo` / `resumeLink` mismatches exist.

---

## 2. Branch overview

**Commits since merge-base**

| Side | Commits |
|---|---|
| `main` | `a8ee8f9` Backend skaffhold and auth services feature (10-06), `f586ddf` completed backend features (10-11) |
| `member2` | `ae78ff2` Add my project changes (10-09) |

**Files changed**

| Side | Files |
|---|---|
| `main` (31) | `.gitattributes`, `Backend/**` (`.env.example`, `.gitignore`, `.prettierrc`, `package.json`, `package-lock.json`, `src/config`, `src/controllers/*` ×6, `src/entity/*` ×5, `src/enum.js`, `src/helper.js`, `src/middlewares/index.js`, `src/routes/index.js`, `src/server.js`, `src/services/*` ×6, `src/utils/errors.js`) |
| `member2` (62) | `.gitignore`, `package.json`, `package-lock.json` (root workspace), `client/**` (46 files), `server/**` (13 files) |

**Files touched by both:** none. The closest are root-level ignore files (`main`: `Backend/.gitignore` + `.gitattributes`; `member2`: root `.gitignore`), which don't overlap.

---

## 3. Backend / DB comparison

### 3.1 Models present

| Model | `main` (`Backend/src/entity/`) | `member2` (`server/models/`) | Collection on `main` | Collection on `member2` | docs/05 collection |
|---|---|---|---|---|---|
| User | `User.js` | — (referenced only via `ref: 'User'`) | `users` | — | `users` |
| StudentProfile | `StudentProfile.js` | `StudentProfile.js` | `studentprofiles` | `student_profiles` | `student_profiles` |
| Company | `Company.js` | — | `companies` | — | `companies` |
| JobDrive | `JobDrive.js` | — | `jobdrives` | — | `drives` |
| Application | `Application.js` | — | `applications` | — | `applications` |

The only duplicated model is **StudentProfile**, registered under the same model name `'StudentProfile'` in both. That's harmless while they're separate processes, but it would throw `OverwriteModelError` if both were ever loaded into one process.

### 3.2 StudentProfile field by field

| Field | `main` (`Backend/src/entity/StudentProfile.js`) | `member2` (`server/models/StudentProfile.js`) | docs/05 §2.2 | Notes |
|---|---|---|---|---|
| `userId` | ObjectId, ref User, required, unique (L5-10) | same (L18-23) | same | ✅ match |
| `rollNumber` | String, required, **unique**, trim (L12-17) | String, required, unique, trim, **uppercase**, maxlength 30 (L24-31) | String, required (no unique) | ⚠ `main` is case-sensitive, so `21cse101` and `21CSE101` are different students |
| `branch` | String, required, trim, **free text** (L19-23) | String, required, **enum CSE/IT/ECE/EEE/MECH/CIVIL** (L3, L32-36) | String, required ("e.g. CSE, IT, ECE, MECH") | ⚠ enum vs free text (risk 6) |
| `graduationYear` | Number, required (L25-28) | Number, required, 2000-2100, integer (L37-43) | Number, required | ⚠ `main` accepts 2027.5 or -1 |
| `cgpa` | Number, required, 0-10 (L30-35) | same (L44-49) | same | ✅ match |
| `activeBacklogs` | Number, **default 0**, min 0 (L37-41) | Number, **required**, min 0, integer (L50-55) | Number, default 0 | ⚠ M2 stricter than docs; `main` accepts 1.5 |
| `skills` | `[String]`, default `[]` (L43-46) | `[String]` trimmed, default `[]` (L56-59); validator dedupes, max 30 × 50 chars | `[String]` | ✅ both arrays |
| `resumeUrl` | String, default `null`, **no validation** (L48-51) | String, trim, **http(s) URL validator** (L60-64); unset (`$unset`) when blank | String | ⚠ `main` accepts any string |
| `isPlaced` | Boolean, default false (L53-56) | same (L66-69), comment: "managed by hiring pipeline" | same | ✅ match |
| `placedCompany` | String, default null (L58-61) | **missing** | String | ❌ M2 lacks it; `main` writes it on offer accept |
| `packageLpa` | Number, default null, min 0 (L63-67) | **missing** | Number | ❌ M2 lacks it; `main` writes it on accept and aggregates it |
| timestamps | yes (L70) | yes (L71) | not in docs | frontend reads `updatedAt` (`client/src/pages/student/Profile.jsx:51`) |
| collection | default `studentprofiles` | `student_profiles` (L71) | `student_profiles` | ❌ risk 3 |

The user reference is `userId` on both sides, and no `user` vs `userId` mismatch exists.

### 3.3 Which student fields `main`'s logic depends on

| Consumer | Location | Fields read/written | In M2's model? |
|---|---|---|---|
| Eligibility engine | `Backend/src/helper.js:58-71` (`getEligibilityIssues`), used by `withEligibility` and `applyForDrive` | `cgpa`, `activeBacklogs`, `branch` | ✅ all three |
| Apply | `Backend/src/services/ApplicationService.js:10,20,28` | `isPlaced`, `resumeUrl` | ✅ |
| Applicant list (recruiter) | `ApplicationService.js:57` | `userId rollNumber branch graduationYear cgpa activeBacklogs skills resumeUrl` | ✅ |
| Select candidate | `ApplicationService.js:104` | `isPlaced` | ✅ |
| Accept offer | `ApplicationService.js:146-151` | writes `isPlaced`, `placedCompany`, `packageLpa` | ⚠ last two missing in M2 |
| Admin analytics | `Backend/src/services/AdminService.js:29-38` | `isPlaced`, `$packageLpa` (avg/max) | ⚠ `packageLpa` missing in M2 |
| Profile update whitelist | `Backend/src/helper.js:10-18` (`studentEditableFields`) | `rollNumber branch graduationYear cgpa activeBacklogs skills resumeUrl` | ✅ identical to M2's `FIELD_VALIDATORS` (`server/validators/studentProfileValidator.js:99-107`) |

**Conclusion:** keep `main`'s model as the base. It's a superset of M2's. Port M2's validation (enum, URL, integer, uppercase) into it and set `collection: 'student_profiles'`.

### 3.4 Other models vs docs/05 (only on `main`)

| Model | Differences from docs/05 |
|---|---|
| User | + `timestamps`, `minlength: 4` on password. Otherwise matches. |
| Company | `recruiterId` **unique** (docs: not unique); + `description`, `contactEmail`. |
| JobDrive | collection `jobdrives` (docs `drives`); **no `companyName`** (docs: required); + `employmentType` (required); `status` enum `DRAFT/OPEN/CLOSED/CANCELLED` default `DRAFT` (docs `OPEN/CLOSED` default `OPEN`; `main` always creates as OPEN); `location` required (docs default `'Bangalore / Remote'`); `eligibility.minCgpa` required (docs default 6.0). |
| Application | **no `studentName`, `studentEmail`, `appliedAt`** (docs: required/default; `main` populates instead and uses `createdAt`); `resumeUrl` not required; + `offer { status, deadline, respondedAt }`; **no unique `{driveId, studentId}` index** (docs §2.5 requires it; it was deliberately removed on `main`, and duplicates are now prevented only by a `findOne` check). |

---

## 4. API comparison

### 4.1 Routes on `member2` (`server/`)

| Method | Path | Handler | Middleware | Response |
|---|---|---|---|---|
| GET | `/api/v1/health` | inline (`server/app.js:17`) | — | `{ success, status }` |
| GET | `/api/v1/student/profile` | `getMyProfile` (`server/controllers/studentProfileController.js:17`) | `requireAuth(['STUDENT'])` (`server/routes/student.js:7`) | `{ success: true, profile }`, where `profile` is `null` if none (200) |
| POST | `/api/v1/student/profile` | `upsertMyProfile` (L31) | same | 201 created / 200 updated: `{ success, message, profile }`; 400 `{ success:false, message, errors }`; 409 duplicate roll number |

### 4.2 Routes on `main` (`Backend/src/routes/index.js`, mounted at `/api`, `Backend/src/server.js:13`)

| Method | Path (prefix `/api`) | Controller | Middleware | docs/06 equivalent |
|---|---|---|---|---|
| POST | `/auth/register` (L20) | `AuthController.register` | — | `POST /auth/signup` ⚠ path + shape |
| POST | `/auth/login` (L21) | `AuthController.login` | — | ✅ path, ⚠ shape |
| GET | `/auth/me` (L22) | `AuthController.me` | `authenticate` | ✅ path, ⚠ shape |
| GET | `/students/me` (L25) | `getProfile` | `authenticate, studentOnly, studentProfileExists` | `GET /student/profile` ⚠ |
| POST | `/students/me` (L26) | `createProfile` | `authenticate, studentOnly` | `POST /student/profile` ⚠ create-only |
| PUT | `/students/me` (L27) | `updateProfile` | `+ studentProfileExists` | (folded into POST in docs) |
| GET | `/students` (L28) | `getAllProfiles` | `adminOnly` | — (`main` only) |
| GET | `/students/:studentId` (L29) | `getProfileById` | `authenticate` (scoped in service) | RBAC "view any student profile" ✅ |
| DELETE | `/students/:studentId` (L30) | `deleteProfile` | `adminOnly` | — (`main` only) |
| GET/POST/PUT/DELETE | `/companies/me` (L33-36) | Company* | `recruiterOnly` (+ `companyProfileExists`) | — (`main` only; docs don't specify company routes) |
| GET | `/companies`, `/companies/recruiter/:id`, `/companies/:id` (L37-39) | Company* | `authenticate` | — (`main` only) |
| POST | `/drives` (L42) | `createDrive` | `authenticate` (role checked in service) | ✅ |
| GET | `/drives` (L43) | `getAllDrives` | `authenticate` | ✅ (+ search/filters/pagination) |
| GET | `/drives/:driveId` (L44) | `getDriveById` | `authenticate` | ✅ |
| PUT | `/drives/:driveId` (L45) | `updateDrive` | `authenticate` | — (`main` only; RBAC allows "Edit Drive") |
| PATCH | `/drives/:driveId/status` (L46) | `updateDriveStatus` | `authenticate` | ✅ |
| DELETE | `/drives/:driveId` (L47) | `deleteDrive` | `authenticate` (admin in service) | ✅ |
| POST | `/drives/:driveId/apply` (L50-56) | `applyForDrive` | `studentOnly, studentProfileExists` | `POST /applications/apply` body `{ driveId }` ⚠ |
| GET | `/drives/:driveId/applications` (L57) | `getDriveApplications` | `authenticate` | `GET /applications/drive/:driveId` ⚠ |
| GET | `/applications/me` (L58) | `getMyApplications` | `studentOnly, studentProfileExists` | `GET /applications/my` ⚠ |
| PATCH | `/applications/:id/status` (L59) | `updateApplicationStatus` | `authenticate` | ✅ path, ⚠ body (see below) |
| PATCH | `/applications/:id/offer` (L60-66) | `respondToOffer` | student | — (`main` only) |
| DELETE | `/applications/:id` (L67-73) | `withdrawApplication` | student | — (`main` only) |
| GET | `/admin/stats`, `/admin/students`, `/admin/drives` (L76,77,80) | Admin* | `adminOnly` | ✅ |
| GET | `/admin/recruiters`, `/admin/companies`, `/admin/applications` (L78,79,81) | Admin* | `adminOnly` | — (`main` only) |
| — | — | — | — | docs/09 L62 `GET /drives/recruiter` ❌ missing on `main` (covered by `GET /drives` when role is RECRUITER) |

**Same intent, different behaviour:**
- **Student profile.** M2 does a single upsert POST and returns 200 with `profile: null` when there's no profile. `main` has separate POST (create) and PUT (update), and GET returns **404** when there's no profile (`Backend/src/middlewares/index.js:33-40`).
- **Status update body.** docs/06 uses flat `{ status, interviewDate, meetingLink, notes }`. `main` expects `{ status, interview: { scheduledAt, meetingLink, notes }, offerDeadline }` (`Backend/src/services/ApplicationService.js:63`).
- **Admin stats.** docs list 5 keys. `main` returns those plus 7 more, wrapped in `{ stats: … }` (`Backend/src/controllers/AdminController.js`).

**Response shapes:**

| | docs/06 | `member2` | `main` |
|---|---|---|---|
| Auth | `{ success, token, user }` | — | `{ success, message, data: { user, token } }` (`Backend/src/controllers/AuthController.js:5,10,15`) |
| Profile | (implied `{ success, … }`) | `{ success, profile }` | raw document (`Backend/src/controllers/StudentController.js:4,19,24`) |
| Other success | — | — | `{ message, <entity> }` or raw, **no `success`** |
| Errors | `{ message }` (docs/02 L34,43,47) | `{ success:false, message, errors? }` | `{ message }` from `Backend/src/server.js:15-20`; auth middleware adds `success:false` (`middlewares/index.js:12,17`) |

### 4.3 Auth and roles

| | `main` | `member2` | docs/02 |
|---|---|---|---|
| JWT payload | `{ id, email, role }` (`helper.js:37`) | expects `{ id, role, email }` (`server/middleware/auth.js:37`) | `{ id, role, email }` ✅ all agree |
| Token check | `authenticate` (`middlewares/index.js:8-21`) | `requireAuth(roles)` (`server/middleware/auth.js:22-49`) | `requireAuth(allowedRoles)` |
| Role check | separate `studentOnly` / `recruiterOnly` / `adminOnly` that **re-read the User from the DB**; multi-role routes check `req.user.role` in services | role from token, in the same middleware | role from token |
| `req.user` usage | `req.user.id`, `req.user.role`; plus `req.student` / `req.company` attached by middleware | `req.user.id` validated with `isValidObjectId` (`studentProfileController.js:7-10`) | `req.user.id` |
| Dev bypass | none | `AUTH_DISABLED`, `DEV_USER_ID`, `scripts/devToken.js` | — |

---

## 5. Config and infrastructure

| | `main` (`Backend/`) | `member2` |
|---|---|---|
| Layout | `Backend/src/{config,controllers,entity,middlewares,routes,services,utils}`; empty untracked `Frontend/` | root workspace → `client/` + `server/{config,controllers,middleware,models,routes,validators,scripts,tests}` |
| Root `package.json` | none | workspaces `["client","server"]`, `npm run dev` runs both via `concurrently` |
| Module system | ESM (`"type": "module"`) | CommonJS (server), ESM (client) |
| Express / Mongoose / dotenv | `^5.2.1` / `^9.10.4` / `^18.0.5` | `^4.21.2` / `^8.9.0` / `^16.4.5` |
| Scripts | `dev`, `devr` (nodemon), `format` (prettier), `test` = placeholder | server: `start`, `dev`, `test` (jest + mongodb-memory-server), `dev:token`; client: `dev`, `build`, `preview`, `test` (vitest) |
| Tests | none committed | `server/tests/studentProfile.test.js`, 6 client test files |
| Lockfiles | `Backend/package-lock.json` | root `package-lock.json` (workspace) |
| Base path / port | `/api`, `PORT || 5000` (`server.js:13,22`) | `/api/v1`, `PORT || 4000` (`server/server.js:18`); Vite proxy `/api` → `:4000` (`client/vite.config.js:11-12`) |
| CORS | `cors()` open (`server.js:9`) | allow-list from `CLIENT_URL` (`server/app.js:9-14`) |
| Body limit | default | `100kb` |
| 404 handler | Express default (HTML) | JSON `notFound` (`server/middleware/errorHandler.js:3-5`) |
| DB connect | `Backend/src/config/config.js`: connect then listen, `process.exit(1)` on failure | `server/config/db.js`: listen first, DNS override, friendly hints |
| Env vars | `MONGO_URI`, `PORT`, `JWT_SECRET`, `JWT_EXPIRES` | `PORT`, `MONGO_URI`, `DNS_SERVERS`, `AUTH_DISABLED`, `DEV_USER_ID`, `JWT_SECRET`, `CLIENT_URL`, `RESEND_API_KEY`; client `VITE_API_URL` |
| DB name | `.env.example` → local `nexstep`; current `.env` resolves to **`test`** | `.env.example` → Atlas `nexstep` |
| CI | not picked up (`ci.yml` looks for `server/` / `client/`) | picked up: client build + `server` jest |

---

## 6. Frontend

**On `main`:** nothing tracked. `Frontend/` exists locally but is empty and untracked.

**On `member2` (`client/`):** React 18 + Vite 6 + Tailwind v4 (`@tailwindcss/vite`, `client/src/index.css`), react-router 6, lucide-react, vitest + Testing Library.

| Area | Files |
|---|---|
| Routing | `client/src/App.jsx`: only `/student/profile` inside `DashboardLayout`; `*` redirects there. `TODO(M1)` for a `ProtectedRoute` (L5). |
| Layout | `components/layout/DashboardLayout.jsx`, `Sidebar.jsx`, `TopBar.jsx`, `BrandMark.jsx`, `navItems.js` (Dashboard / Drives / Applications / Interviews are disabled "Soon" items), `dashboardIdentity.js` (context) |
| Student profile | `pages/student/Profile.jsx`; `components/student/*`: `AcademicInfoSection`, `EligibilitySnapshot`, `ProfileChecklist`, `ProfileStats`, `ReadinessHero`, `ResumeSection`, `ResumePreviewModal`, `SkillsTagInput`, `StudentProfileSummary`, `ProfileDashboardSkeleton`, `SectionHeading` |
| UI kit | `components/ui/Alert.jsx`, `FormField.jsx`, `Modal.jsx`, `buttonStyles.js`, `cardStyles.js` |
| State | local hooks only, `hooks/useStudentProfile.js`; no global store, **no auth context** |
| API layer | `services/apiClient.js` (fetch wrapper; base `VITE_API_URL || '/api/v1'`, L3; treats `!response.ok \|\| !data \|\| data.success === false` as an error, L40), `services/studentProfileApi.js`, `services/authToken.js` (token from `localStorage['nexstep_token']`) |
| Logic | `utils/studentProfileForm.js` (client validation mirroring server), `utils/profileInsights.js` (completeness, eligibility snapshot with typical 6.0 / 0), `constants/studentProfile.js` (BRANCHES enum, "keep in sync with `server/models/StudentProfile.js`") |
| Auth | **no login or signup screens.** Relies on a token pasted into localStorage (`server/scripts/devToken.js:27`) |

**Endpoints and fields the frontend uses vs `main`:**

| Frontend call | Location | Expects | `main` today | Works? |
|---|---|---|---|---|
| `GET /api/v1/student/profile` | `client/src/services/studentProfileApi.js:5-6` | 200 `{ success, profile }`, `profile: null` when none | `GET /api/students/me`, raw doc, **404** when none | ❌ wrong path; and once fixed, a new student hits the error state instead of an empty form |
| `POST /api/v1/student/profile` | `studentProfileApi.js:11-12` | create **or** update, returns `{ success, message, profile }`, 400 with `errors` map | POST create-only (409 if exists), PUT update, raw doc, no `errors` map | ❌ |
| Port | `client/vite.config.js:12`, `client/.env.example:2` | 4000 | 5000 | ❌ |
| Fields read | `profileInsights.js`, `ProfileStats.jsx:93-95`, `StudentProfileSummary.jsx:56`, `Profile.jsx:51` | `rollNumber branch graduationYear cgpa activeBacklogs skills resumeUrl isPlaced updatedAt` | all present on `main`'s model | ✅ |
| Fields sent | `utils/studentProfileForm.js:62-72` | same 7 editable fields; `resumeUrl: ''` means remove | `main` ignores `undefined` but stores `''` as-is (`helper.js` `applyUpdates`) | ⚠ empty string is saved instead of removing the link |
| Branch list | `constants/studentProfile.js:2` | 6-value enum | free text | ⚠ keep in sync |
| Auth token | `services/authToken.js:3` | `nexstep_token` in localStorage | login returns `data.token` | ⚠ the login screen (not built yet) must store it under that key |

---

## 7. Existing data

- **No seed scripts or migrations** on either branch.
- **`main`'s current database** (`.env`, database `test`): collections `users`, `studentprofiles`, `companies`, `jobdrives`, `applications`, **all with 0 documents**. Changing `collection` names (`student_profiles`, `drives`) is free right now: no data to migrate.
- **M2's database:** `server/.env.example` points at an Atlas `nexstep` database, and M2's real `.env` isn't in git. If M2 has test profiles there, they live in `nexstep.student_profiles` and won't be visible to `main` unless both use the same `MONGO_URI` **and** `main` adopts `collection: 'student_profiles'`.
- If the unique `{ driveId, studentId }` index from docs/05 is restored, existing duplicate applications (none today) would block index creation.

---

## 8. Ordered checklist

Each item is tagged `[main]`, `[member2]` or `[either]`. Do them on an integration branch, not directly on `main`.

**A. Decide (before touching code)**
1. `[either]` Agree there is **one backend: `main`'s**. `server/` from `member2` is retired after porting (B5-B7). *It covers 2 routes vs `main`'s 34.*
2. `[either]` Pick the backend folder name. **Recommended: rename `Backend/` → `server/`** (`git mv`). *Matches CI (`ci.yml:94`), docs/04 and the root workspace; CI starts testing the backend.*
3. `[either]` Confirm docs/06 is binding for paths and shapes the frontend uses (§9).

**B. Backend (`main`) changes to match docs and M2's frontend**
4. `[main]` `Backend/src/server.js:13`: mount at `/api/v1`; `:22` default `PORT` to `4000`. *Matches docs/06 and `client/vite.config.js:12`.*
5. `[main]` `Backend/src/routes/index.js:25-27` + `controllers/StudentController.js` + `services/StudentService.js`: replace `/students/me` GET/POST/PUT with `GET /student/profile` → `{ success, profile }` (`null` when missing, 200) and `POST /student/profile` as an **upsert** → 201/200 `{ success, message, profile }`. *This is what `client/src/services/studentProfileApi.js` calls.* Keep `GET /students/:id` and the admin routes.
6. `[main]` `Backend/src/entity/StudentProfile.js`: add `collection: 'student_profiles'`; `branch` enum; `rollNumber` `uppercase` + `maxlength 30`; `graduationYear` 2000-2100 integer; `activeBacklogs` integer; `resumeUrl` http(s) validator. *Port from `server/models/StudentProfile.js:3-64`; keep `placedCompany` and `packageLpa`.*
7. `[main]` Port `server/validators/studentProfileValidator.js` (whole file) into `Backend/src/helper.js` (or `validators/`), and return 400 `{ success:false, message, errors }`. *The frontend shows per-field `errors` (`client/src/services/apiClient.js` → `ApiError.errors`).* Treat `resumeUrl: ''` as remove (`$unset`).
8. `[main]` `Backend/src/server.js:15-20`: add `success: false` to every error and an `errors` map for `ValidationError`; add a JSON 404 handler. *`apiClient.js:40` treats `success === false` as an error; matches M2's `errorHandler.js`.*
9. `[main]` `Backend/src/controllers/*`: wrap success responses as `{ success: true, … }` (at least for endpoints the frontend uses); auth → `{ success, token, user }` (docs/06 §1) instead of `{ data: { user, token } }`.
10. `[main]` `routes/index.js:20`: add `POST /auth/signup` (alias or rename of `/auth/register`). *docs/06 §1; M1's login screen will call it.*
11. `[main]` Application routes to docs/06 §4 when building those screens: `POST /applications/apply { driveId }`, `GET /applications/my`, `GET /applications/drive/:driveId`; accept the flat `interviewDate` body or update docs. *Lines 50-59.*
12. `[main]` `Backend/src/entity/JobDrive.js`: decide on `collection: 'drives'` and `companyName` (docs/05 §2.4). *Free now (empty DB).*
13. `[main]` `Backend/src/server.js:9`: CORS allow-list from `CLIENT_URL`. *Matches M2; open CORS is unnecessary with the Vite proxy.*
14. `[main]` Dev auth: either seed a real dev student `User` or make `studentOnly` trust the token role. *Otherwise M2's `AUTH_DISABLED` / `dev:token` flow gets 401 (risk 7). Simplest: drop the bypass once M1 login exists.*

**C. Repo structure after merging `member2`**
15. `[member2]` Delete `server/` (all 13 files) once B5-B8 are ported. Move `server/tests/studentProfile.test.js` into the kept backend and adapt it to ESM. *Avoid two servers and two models.*
16. `[either]` Root `package.json`: workspaces `["client","server"]` works as-is if B2 is done; otherwise change to `["client","Backend"]`. Then delete `Backend/package-lock.json` and regenerate the root `package-lock.json`. *One lockfile per workspace repo.*
17. `[either]` Merge `.gitignore` files: root (`member2`) + `Backend/.gitignore` (`main`, has the `!.env.example` rule). Keep `.gitattributes` (`main`).
18. `[either]` Unify `.env.example`: keep `main`'s `JWT_EXPIRES`; add `CLIENT_URL`, `DNS_SERVERS`, `RESEND_API_KEY`; drop `AUTH_DISABLED` / `DEV_USER_ID` if B14 removes the bypass. Default DB name `nexstep`.
19. `[main]` `Backend/package.json`: add a real `test` script. *Otherwise CI's backend job is a no-op.*
20. `[member2]` `client/src/constants/studentProfile.js:1`: update the "keep in sync with `server/models/StudentProfile.js`" path if the backend folder name changes.

**D. Frontend (your next work, on top of `member2`)**
21. `[member2]` `client/src/App.jsx:5`: add auth context + `ProtectedRoute`, and login/signup pages that store the token under `nexstep_token` (`services/authToken.js:3`).
22. `[member2]` `client/src/components/layout/navItems.js`: enable Drives / Applications / Interviews as they're built against `main`'s routes (after B11).

---

## 9. Which side adapts

| Conflict | Adapts | Why |
|---|---|---|
| Base path `/api` vs `/api/v1`, port 5000 vs 4000 | **main** | docs/06; frontend and proxy already use it |
| Student profile routes and upsert semantics | **main** | docs/06 §2 + frontend depends on it |
| Response shape `{ success, … }` | **main** | docs/06 §1; `apiClient.js` relies on `success` |
| StudentProfile collection name | **main** | docs/05 §2.2 `student_profiles` |
| StudentProfile validation (enum, URL, integers) | **main** (adopt M2's rules) | stricter, tested, needed for exact-match eligibility |
| `placedCompany`, `packageLpa` | **member2's model is dropped** | `main` needs them; docs/05 has them |
| Backend implementation overall | **member2 (retire `server/`)** | `main` implements every other feature |
| Folder name `Backend/` vs `server/` | **main** (rename) | CI, docs/04 and the workspace expect `server/` |
| `activeBacklogs` required vs default 0 | either; **default 0 + integer** | docs/05 says default 0; the form always sends a value anyway |
| JobDrive / Application shape (`companyName`, `studentName`, `appliedAt`, unique index, status enum) | **docs need a decision** | `main`'s design (populate, offer flow, DRAFT/CANCELLED) is richer than docs; update docs/05 or `main` explicitly |

---

## 10. Merge strategy

1. Create an integration branch from `main`: `git switch -c integrate/member2 main`.
2. **Merge, don't rebase:** `git merge origin/member2`. `member2` is a pushed branch owned by M2, and rebasing it would rewrite their history. Expect **no textual conflicts** (no overlapping paths).
3. In the same branch, still before anything reaches `main`: B2 rename → B4-B9 backend changes → C15 delete `server/` → C16 workspace + lockfile → C17-C18 config.
4. Run `npm install` at the root, the backend tests (M2's ported jest test plus an e2e pass), `npm run build -w client`, and click through `/student/profile` against the real backend.
5. Open a PR `integrate/member2` → `main` and get M2's review, since it deletes M2's `server/`.
6. M2 then branches new work from the updated `main`. They should not keep committing to `member2`'s `server/`.

**Files that will need hand-editing after the merge, even though git reports no conflict:** root `package.json`, root `package-lock.json`, `Backend/package-lock.json` (delete), root `.gitignore` vs `Backend/.gitignore`, `client/src/constants/studentProfile.js`, and everything under `server/` (to be deleted).

---

## 11. Questions for M2 before merging

1. Is `server/` meant to be the team's backend, or a stand-in until M1's auth landed? Are you OK retiring it in favour of `main`'s?
2. Does your Atlas `nexstep` database hold profiles you want to keep? (`main`'s DB is empty.)
3. Should the branch enum stay at `CSE, IT, ECE, EEE, MECH, CIVIL`? Drives' `allowedBranches` must use the same list.
4. Did you rely on `AUTH_DISABLED` / `dev:token` for demos? They'll stop working once `main`'s role middleware is used, until real login exists.
5. Do you want to keep the root workspace + `concurrently` setup? If yes, the backend folder should be `server/`.
6. For removing a resume, is sending `resumeUrl: ''` the intended contract (server unsets the field)?
7. Your tests use jest + mongodb-memory-server in CommonJS. OK to convert them to ESM when moving into the kept backend?
