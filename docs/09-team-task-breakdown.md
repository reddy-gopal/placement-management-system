# NexStep — Team Task Breakdown (6-Member Team)

## 1. Ownership Model (Mini Project)

Each member owns an end-to-end vertical slice (Frontend Screen + Backend API + DB Integration) so everyone can work independently without stepping on each other's code.

```
M1 (Setup & Auth) ──► M2 (Student Profile) ──┐
                                             ├──► M4 (Drives & Eligibility Engine)
M3 (Recruiter & Job Drives) ─────────────────┘          │
                                                        ▼
M5 (Applications & Hiring Status Pipeline) ◄────────────┘
         │
         ▼
M6 (Admin Analytics Dashboard & Resend Email Alerts)
```

---

## 2. Detailed Member Assignments

### **Member 1 (M1) — Lead & Authentication Infrastructure**
- **Core Responsibility:** Project scaffolding and secure user access.
- **Backend Tasks:**
  - Set up Express server, MongoDB Mongoose connection, and CORS configuration.
  - Build `User` model with password hashing (`bcryptjs`).
  - Build Auth routes: `POST /api/v1/auth/signup`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`.
  - Create `requireAuth(allowedRoles)` middleware for JWT verification and role checks.
- **Frontend Tasks:**
  - Set up React + Vite + Tailwind CSS project skeleton.
  - Build Auth pages: Sign Up (with role toggle: Student vs Recruiter) and Login page.
  - Build Global Navbar with user profile dropdown and Logout button.
  - Implement `<ProtectedRoute>` route guard component in React Router.

---

### **Member 2 (M2) — Student Profile & Resume Link**
- **Core Responsibility:** Student data onboarding and qualifications.
- **Backend Tasks:**
  - Build `StudentProfile` Mongoose model (linked 1:1 to User).
  - Implement endpoints: `GET /api/v1/student/profile`, `POST /api/v1/student/profile`.
  - Add input validation for CGPA (0.0–10.0), active backlogs, and valid branch names.
- **Frontend Tasks:**
  - Build Student Profile page (`/student/profile`) with form fields: Roll Number, Department/Branch dropdown, Graduation Year, CGPA, Backlogs count, Skills tag input, and Resume PDF link.
  - Display profile summary badge on the Student Dashboard.
  - Add resume preview link/modal so students can verify their submitted resume.

---

### **Member 3 (M3) — Recruiter Portal & Drive Posting**
- **Core Responsibility:** Employer presence and job openings creation.
- **Backend Tasks:**
  - Build `Company` and `JobDrive` Mongoose models.
  - Implement `POST /api/v1/drives` endpoint to create a campus placement drive.
  - Implement `GET /api/v1/drives/recruiter` to retrieve drives posted by the logged-in recruiter.
- **Frontend Tasks:**
  - Build Recruiter Dashboard (`/recruiter/dashboard`) showing active drives posted by their company.
  - Build "Post New Drive" modal/form (`/recruiter/post-drive`):
    - Role title, Job description, Package (CTC in LPA), Location, Application Deadline.
    - Eligibility criteria inputs: Minimum CGPA, Maximum Backlogs, Allowed Branches checklist.
  - Add Company Profile settings page (Company name, Website, Logo URL).

---

### **Member 4 (M4) — Drives Catalog & Eligibility Engine**
- **Core Responsibility:** Real-time eligibility evaluation and student drive discovery.
- **Backend Tasks:**
  - Implement `GET /api/v1/drives` with dynamic eligibility evaluation algorithm:
    - If user is a Student, compare `student.cgpa >= drive.minCgpa`, `student.activeBacklogs <= drive.maxBacklogs`, and `drive.allowedBranches.includes(student.branch)`.
    - Return each drive with `{ isEligible: boolean, ineligibilityReason: string }`.
  - Implement `GET /api/v1/drives/:id` for detailed drive view.
- **Frontend Tasks:**
  - Build Student Drive Browser page (`/student/drives`):
    - Search bar (by company name/role) and branch/CTC filter pills.
    - Drive cards displaying Company name, Package pill (`₹X.X LPA`), Location, and Deadline countdown.
    - Prominent **"Eligible to Apply"** badge (Green) or **"Not Eligible"** badge (Red) with tooltip/popover explaining why (e.g. *"Requires CGPA $\ge 7.5$; your CGPA is 7.2"*).

---

### **Member 5 (M5) — Applications & Hiring Pipeline**
- **Core Responsibility:** 1-click apply, student tracking, and recruiter candidate screening.
- **Backend Tasks:**
  - Build `Application` Mongoose model with compound unique index `{ driveId: 1, studentId: 1 }` (prevents double-apply).
  - Implement `POST /api/v1/applications/apply` (checks eligibility before inserting).
  - Implement `GET /api/v1/applications/my` (for student) and `GET /api/v1/applications/drive/:driveId` (for recruiter).
  - Implement `PATCH /api/v1/applications/:id/status` to update status: `APPLIED` $\rightarrow$ `SHORTLISTED` $\rightarrow$ `SELECTED` $\rightarrow$ `REJECTED`.
- **Frontend Tasks:**
  - Student: "Apply Now" button on drive details with confirmation dialog.
  - Student: "My Applications" tracker page (`/student/applications`) with status progression chips.
  - Recruiter: "Drive Applicants" table (`/recruiter/drives/:id/applicants`) showing applicant name, branch, CGPA, resume preview button, and quick-action status buttons (`Shortlist`, `Select`, `Reject`).

---

### **Member 6 (M6) — Admin Dashboard, Analytics & Resend Email Alerts**
- **Core Responsibility:** Placement statistics, system oversight, and email notifications.
- **Backend Tasks:**
  - Integrate **Resend SDK** utility (`utils/mailer.js`) to send transactional emails:
    1. Welcome email on signup (to student/recruiter).
    2. Application confirmation email (when student applies).
    3. Status update email (when student is Shortlisted or Selected).
  - Build Admin analytics endpoint `GET /api/v1/admin/stats` calculating:
    - Total students, total drives, total placed students, placed %, average CTC, highest CTC.
  - Build Admin drive management routes (`GET /api/v1/admin/drives`, `DELETE /api/v1/admin/drives/:id`).
- **Frontend Tasks:**
  - Build Admin Placement Overview Dashboard (`/admin/dashboard`):
    - 4 KPI Stat Cards: Total Students, Placement %, Average Package (LPA), Total Drives.
    - Simple branch-wise placement breakdown bar chart or progress bars.
  - Build Admin Master Drive List table with ability to close or remove drives.
