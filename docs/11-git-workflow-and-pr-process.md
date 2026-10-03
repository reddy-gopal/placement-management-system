# NexStep — Git Workflow & Pull Request Process

## 1. Branching Strategy

NexStep uses a structured **Gitflow variant with linear history and squash merges**, optimized for rapid, conflict-free parallel development across our 6-engineer squad.

```
       (hotfix)
main ─────────────●───────────────────────────●──────► Production (Vercel + Render)
                   ▲                         ▲
                    \ (hotfix backport)     / (release tag v1.0.0)
develop ─────────────●────────●────────────●────────► Staging Integration
                      \      / \          /
                       ●────●   ●────────●
                       feature/  feature/
                       student   drives
```

### Branch Categories & Protection Matrix

| Branch Pattern | Base Branch | Merges Into | Protection Rules | Deployment Target |
|---|---|---|---|---|
| `main` | — | — | **Protected:** Direct push blocked. Requires 2 reviews (including M1 Tech Lead). CI must pass. Strict linear history. | Production |
| `develop` | `main` | `main` | **Protected:** Direct push blocked. Requires 1 peer review (CODEOWNER). CI must pass. Linear history. | Staging |
| `feature/<module>/<ID>-<desc>` | `develop` | `develop` | Open to author. Must rebase on `develop` before opening PR. | Ephemeral preview |
| `fix/<module>/<ID>-<desc>` | `develop` | `develop` | Open to author. Closes linked bug issue. | Ephemeral preview |
| `release/vX.Y.Z` | `develop` | `main` & `develop` | Final sprint hardening branch. Only critical fixes permitted. | Staging / Pre-prod |
| `hotfix/<ID>-<desc>` | `main` | `main` & `develop` | Critical production incident fixes only. Requires M1 review. | Production immediate |
| `chore/<desc>` / `docs/<desc>` | `develop` | `develop` | Routine dependency updates or documentation edits. | — |

---

## 2. Commit Message Standards (Conventional Commits)

All commit messages must strictly adhere to the [Conventional Commits](https://www.conventionalcommits.org/) v1.0.0 specification with mandatory Story/Issue ID references.

### Structure
```
<type>(<scope>): <short description in imperative present tense> [<STORY-ID>]

[optional body with rationale and architectural context]

[optional footer: Closes #issue_number, BREAKING CHANGE: description]
```

### Allowed Types
- `feat`: A new end-user capability or API feature.
- `fix`: A bug fix addressing a reported issue.
- `docs`: Documentation changes only (e.g. PRD, API contract).
- `style`: Formatting, missing semicolons, white-space (no production code change).
- `refactor`: A code change that neither fixes a bug nor adds a feature.
- `test`: Adding missing unit, integration, or E2E tests.
- `chore`: Build process, package updates, or tooling configuration changes.

### Valid Commit Examples
- `feat(student): add multi-resume pdf upload with magic bytes validation [STU-004]`
- `fix(auth): prevent refresh token reuse race condition during parallel api calls [AUTH-004]`
- `feat(eligibility): implement one-offer placement policy evaluation [ELG-002]`
- `test(notifications): add svix webhook signature verification unit tests [NTF-002]`

---

## 3. Pull Request (PR) Lifecycle & Rules

### Golden Rules of Pull Requests
1. **One Story = One Branch = One PR:** Large epics must be decomposed before starting work.
2. **Size Constraint:** PRs should ideally be under **400 lines of diff** (excluding auto-generated locks and snapshots). PRs exceeding 600 lines require M1 pre-approval.
3. **Rebase Before Review:** Always execute `git fetch origin && git rebase origin/develop` prior to requesting review to maintain clean linear history and prevent merge conflicts.
4. **No Direct Pushes to `main` or `develop`:** Every change arrives via an approved pull request.
5. **Squash and Merge Only:** Merges into `develop` and `main` use GitHub's "Squash and merge" to ensure every commit on integration branches maps 1:1 with an issue.
6. **24-Hour Review SLA:** Every team member must review pending assigned PRs within 24 hours.

### Step-by-Step Developer Workflow

1. **Pick Story:** Move the assigned GitHub Issue from "Sprint Ready" to "In Progress" on the GitHub Project Board.
2. **Create Branch:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/student/STU-004-resume-upload
   ```
3. **Develop & Test Locally:**
   ```bash
   # Run type checks, linter, and tests locally before committing
   npm run typecheck
   npm run lint
   npm test
   ```
4. **Commit Following Convention:**
   ```bash
   git add packages/server/src/controllers/resume.controller.ts
   git commit -m "feat(student): add resume upload endpoint with 5MB cap [STU-004]"
   ```
5. **Rebase on Latest Develop:**
   ```bash
   git fetch origin
   git rebase origin/develop
   ```
6. **Push and Open PR:**
   ```bash
   git push origin feature/student/STU-004-resume-upload
   ```
   Open PR against `develop` using the `.github/PULL_REQUEST_TEMPLATE.md`. Link the issue (`Closes #42`).
7. **CODEOWNERS Automatic Assignment:** GitHub auto-assigns the relevant module owner for review.
8. **Automated CI Check:** GitHub Actions verifies:
   - TypeScript compiles with zero errors across all workspaces (`tsc --noEmit`).
   - ESLint and Prettier rules pass without warnings.
   - Jest unit tests pass with $\ge 80\%$ statement coverage.
   - Build completes successfully for frontend and backend.
9. **Address Feedback:** Make edits, push updates to the branch. Once approved and CI is green, execute **Squash and Merge**.
10. **Branch Deletion:** Delete the remote feature branch immediately upon merge.

---

## 4. GitHub Project Board & Issue Tracking

The team tracks progress using a unified **GitHub Projects (v2)** board with real-time automation:

```
[ Backlog ] ──► [ Sprint Ready ] ──► [ In Progress ] ──► [ In Review ] ──► [ QA on Staging ] ──► [ Done ]
```

### Labeling Taxonomy

| Category | Label Name | Color | Purpose |
|---|---|---|---|
| **Module** | `module:auth` | `#0366d6` | Auth, sessions, RBAC, users |
| | `module:student` | `#28a745` | Student profile, academic, resumes |
| | `module:company` | `#ffc107` | Recruiter, company profile, jobs |
| | `module:drives` | `#6f42c1` | Drives, eligibility engine, policy |
| | `module:pipeline` | `#d73a49` | Applications, interviews, offers |
| | `module:notifications` | `#008672` | Resend, React Email, BullMQ |
| | `module:analytics` | `#f66a0a` | Reports, charts, audit logs |
| **Type** | `type:feature` | `#a2eeef` | New capability |
| | `type:bug` | `#e11d48` | Defect or regression |
| | `type:chore` | `#c5def5` | Tooling, dependencies |
| **Priority** | `priority:must` | `#b60205` | MVP critical path |
| | `priority:should` | `#fbca04` | Important for launch |
| | `priority:could` | `#0e8a16` | Nice to have |
| **Sprint** | `sprint:S0` … `sprint:S4` | `#5319e7` | Sprint allocation |
| **Status** | `status:blocked` | `#000000` | Blocked by external dependency |

---

## 5. Security & Secrets Management

- **Zero Plaintext Secrets:** No credentials, API keys, or private keys may ever be committed to Git.
- **Resend API Keys:** Injected strictly via environment variable `RESEND_API_KEY` stored in GitHub Secrets.
- **Repository Templates:** A fully commented `.env.example` file is maintained in the root directory. Developers copy `.env.example` to `.env` locally.
- **Pre-commit Scan:** Git hooks run `gitleaks` or secret-detection regexes via Husky to reject commits containing potential tokens or private keys.
