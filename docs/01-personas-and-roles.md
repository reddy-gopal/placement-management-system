# NexStep — Personas & User Roles (Mini Project)

## 1. User Roles Summary

The system is streamlined to **3 primary roles**:

| Role Code | Role Name | Description | Default Landing Screen |
|---|---|---|---|
| `STUDENT` | College Student | Enrolled college student building their profile and applying to campus drives | `/student/dashboard` |
| `RECRUITER` | Company Recruiter | Talent acquisition representative posting jobs and screening applicants | `/recruiter/dashboard` |
| `ADMIN` | Placement Officer (TPO) | College placement authority overseeing all drives, companies, and placement reports | `/admin/dashboard` |

---

## 2. Key Personas

### 2.1 The Student: Arjun Mehta
- **Profile:** 4th Year B.Tech Computer Engineering student.
- **Goal:** Wants to quickly view which companies are visiting campus, verify if his CGPA (7.8) qualifies, apply with his latest resume, and track his application without asking coordinators repeatedly.
- **Core Needs:**
  - Fast, mobile-responsive dashboard.
  - Transparent eligibility indicators (no guessing cut-offs).
  - Clean status indicator: Applied $\rightarrow$ Shortlisted $\rightarrow$ Selected.

### 2.2 The Recruiter: Priya Sharma
- **Profile:** Technical Recruiter at an IT firm.
- **Goal:** Needs to publish job postings with specific criteria (e.g., CSE/IT only, CGPA $\ge 7.0$), review applicants in one central table, preview resumes, and mark candidates as Shortlisted or Selected.
- **Core Needs:**
  - Simple job posting form.
  - Clean applicant screening table with search and filtering by branch/CGPA.
  - 1-click status updates that notify students automatically.

### 2.3 The Placement Officer (Admin): Prof. Ramesh Iyer
- **Profile:** College Training and Placement Officer (TPO).
- **Goal:** Wants an executive overview of the placement season — how many drives have been conducted, which students got placed, and what the highest and average CTCs are.
- **Core Needs:**
  - High-level KPI cards (Total Students, Placed %, Average Package).
  - Ability to review and delete inappropriate drive postings or spam registrations.
