## Pull Request — NexStep Placement Portal

### 1. Story Reference
- **Story ID:** `[STORY-ID]` (e.g. `STU-004`)
- **Issue Link:** Closes #`[ISSUE_NUMBER]`
- **Module:** `[Auth | Student | Company | Drives | Pipeline | Notifications | Analytics]`
- **Assignee / Author:** `@username` (M1–M6)

---

### 2. Summary of Changes
*Provide a concise explanation of what this PR introduces and any non-obvious architecture or schema decisions.*
- 
- 

---

### 3. Visual Demonstration (UI / UX Changes)
*Attach screenshots or a screen recording (Loom/GIF) demonstrating the feature across desktop and mobile viewports. If purely backend/API, write `N/A`.*

| Desktop View (1280px) | Mobile View (375px) |
|---|---|
| *(paste image here)* | *(paste image here)* |

---

### 4. Verification & Testing Evidence
*Detail how this change was validated locally and attach terminal output of passing tests.*

- [ ] Unit tests added / updated in `__tests__/`
- [ ] Integration tests covering edge cases & error paths
- [ ] Manual test walkthrough completed

```text
# Paste test output summary here (e.g. npm test)
PASS packages/server/src/__tests__/resume.test.ts
✓ should upload valid PDF with magic bytes check (42 ms)
✓ should reject non-PDF file disguised as PDF (18 ms)
```

---

### 5. Pre-Merge Quality Checklist

- [ ] **Type Safety:** `npm run typecheck` passes with zero errors across all workspaces.
- [ ] **Code Quality:** `npm run lint` passes with no ESLint errors or Prettier diffs.
- [ ] **No Debug Code:** All `console.log`, debugger statements, and temporary stubs removed.
- [ ] **RBAC & Authorization:** Middleware permissions verified against `02-rbac-permission-matrix.md`.
- [ ] **Accessibility (WCAG 2.1 AA):** Colors meet contrast requirements; keyboard navigation & ARIA labels verified.
- [ ] **Email Templates:** If touching emails, React Email template previewed locally (`npm run email:dev`).
- [ ] **Documentation:** API contract or data model updated if schemas were modified.

---

### 6. Database Migrations & Environment Variables
- [ ] Requires new environment variable in `.env` (updated in `.env.example`).
- [ ] Requires database index creation or seed data migration.
- [ ] Notes for deployment: *[None / describe below]*
