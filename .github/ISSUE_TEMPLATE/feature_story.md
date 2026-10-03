---
name: Feature Story
about: Standard implementation user story for NexStep
title: '[STORY-ID]: <Title>'
labels: 'type:feature'
assignees: ''
---

### Story Metadata
- **Story ID:** `[STORY-ID]`
- **Module:** `[Auth | Student | Company | Drives | Pipeline | Notifications | Analytics]`
- **Role:** `[Student | Company Recruiter | Placement Officer | Coordinator | Super Admin]`
- **Priority:** `[Must | Should | Could]`
- **Estimate:** `[1 | 2 | 3 | 5 | 8] points`
- **Owner:** `[M1 | M2 | M3 | M4 | M5 | M6]`
- **Sprint:** `[S0 | S1 | S2 | S3 | S4]`
- **Dependencies:** `[None / STORY-IDs]`
- **Branch Name:** `feature/<module>/<STORY-ID>-<short-kebab-desc>`

---

### User Story Statement
**As a** `<role>`,  
**I want** `<capability>`,  
**So that** `<benefit>`.

---

### Acceptance Criteria (Given / When / Then)
1. **Given** ...  
   **When** ...  
   **Then** ...
2. **Given** ...  
   **When** ...  
   **Then** ...

---

### Validation & Edge Cases
- Validation rule 1
- Boundary condition / error handling

---

### Permissions & RBAC Scope
- **Authorized Roles:**
- **Forbidden Roles:**

---

### Linked Artifacts
- **Email Triggers Involved:** `[e.g. EM-01 / None]`
- **API Endpoints:** `[e.g. POST /api/v1/...]`
- **UI Screens:** `[e.g. SCR-STU-01]`

---

### Definition of Done
- [ ] Code implemented in feature branch
- [ ] Unit & integration tests passing with $\ge 80\%$ coverage
- [ ] PR raised and reviewed by CODEOWNER
- [ ] CI pipeline green on `develop`
- [ ] Documentation updated
