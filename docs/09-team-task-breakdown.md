# NexStep — Team Task Breakdown (6-Member Team)

## 1. Ownership Model (Mini Project)

Each member owns an end-to-end vertical slice (Frontend Screen + Backend API + DB Integration) so everyone can work independently without stepping on each other's code.

```
M1 (Setup & Auth) ──► M2 (Student Profile) ──┐
                                             ├──► M4 (Drives & Eligibility Engine)
M3 (Recruiter & Job Drives) ─────────────────┘          │
                                                        ▼
M5 (Applications & Online Interviews) ◄─────────────────┘
         │
         ▼
M6 (Admin Analytics Dashboard & Resend Email Alerts)
```

---

## 2. Detailed Member Assignments

### **Member 1 (M1) — Lead & Authentication Infrastructure**
- **Core Responsibility:** Project scaffolding and secure user access.
- **Backend Tasks:**
  - Set up Express server, MongoDB Mongoose connection, and setup CORS.
  - Create `User` model with password hashing (`bcryptjs`).
  - Build Auth routes:
     - `POST /api/v1/auth/signup` — Registers user, hashes password, returns JWT token.
     - `POST /api/v1/auth/login` — Verifies password, returns JWT token.
     - `GET /api/v1/auth/me` — Returns current logged-in user details.
  - Create `requireAuth(allowedRoles)` middleware for JWT verification and role checks.
- **Frontend Tasks:**
  - Set up React + Vite + Tailwind CSS project skeleton.
  - Build **Sign Up Page** with a clean role toggle: `[ Student ]` vs `[ Recruiter ]`.
  - Build **Login Page** with automatic role-based redirect (`/student`, `/recruiter`, `/admin`).
  - Build **Global Navbar** with role badge, user profile indicator, and Logout button.
  - Implement `<ProtectedRoute allowedRoles={...}>` in React Router.

---

### **Member 2 (M2) — Student Profile & Resume Link**
- **Core Responsibility:** Student data onboarding and qualifications.
- **Backend Tasks:**
  - Build `StudentProfile` Mongoose model (linked 1:1 to User):
     - `rollNumber`, `branch` (`CSE`, `IT`, `ECE`, `MECH`, etc.), `graduationYear`, `cgpa` (0.0 to 10.0), `activeBacklogs`, `skills` array, `resumeUrl`, `isPlaced`.
  - Implement endpoints:
     - `GET /api/v1/student/profile` — Fetch student profile.
     - `POST /api/v1/student/profile` — Create or update student profile with CGPA/backlog validation.
- **Frontend Tasks:**
  - Build **Student Profile Page** (`/student/profile`):
     - Form to fill Roll No, Branch dropdown, CGPA, Backlogs, Skills tag input, and Resume PDF URL.
  - Add **Resume Preview Modal** so the student can verify their submitted resume link.
  - Build a compact Profile Summary Card for the Student Dashboard.

---

### **Member 3 (M3) — Recruiter Portal & Drive Posting**
- **Core Responsibility:** Employer presence and job openings creation.
- **Backend Tasks:**
  - Build `Company` and `JobDrive` Mongoose models.
  - Implement `POST /api/v1/drives` endpoint to create a campus placement drive.
  - Implement `GET /api/v1/drives/recruiter` to retrieve drives posted by the logged-in recruiter.
- **Frontend Tasks:**
  - Build **Recruiter Dashboard** (`/recruiter/dashboard`):
     - Displays cards/table of all drives posted by their company.
  - Build **"Post New Drive" Modal / Page**:
     - Form: Job Title, Package (CTC in LPA), Location, Application Deadline.
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
  - Build **Student Drive Browser Page** (`/student/drives`):
    - Search bar (by company name/role) and branch/CTC filter pills.
    - Drive cards displaying Company name, Package pill (`₹X.X LPA`), Location, and Deadline countdown.
    - Prominent **"Eligible to Apply"** badge (Green) or **"Not Eligible"** badge (Red) with tooltip/popover explaining why (e.g. *"Requires CGPA $\ge 7.5$; your CGPA is 7.2"*).

---

### **Member 5 (M5) — Applications, Hiring Pipeline & Online Interviews**
- **Core Responsibility:** 1-click apply, student tracking, recruiter candidate screening, and Jitsi online interviews.
- **Backend Tasks:**
  - Build `Application` Mongoose model:
    - `driveId`, `studentId`, `studentName`, `studentEmail`, `resumeUrl`, `status` (`APPLIED`, `SHORTLISTED`, `SELECTED`, `REJECTED`).
    - `interview`: `{ scheduledAt: Date, meetingLink: String, notes: String }`.
    - Compound unique index `{ driveId: 1, studentId: 1 }` (prevents double-apply).
  - Implement `POST /api/v1/applications/apply` (checks eligibility before inserting).
  - Implement `GET /api/v1/applications/my` (for student) and `GET /api/v1/applications/drive/:driveId` (for recruiter).
  - Implement `PATCH /api/v1/applications/:id/status` to update status:
    - When updating to `SHORTLISTED`, saves `interview.scheduledAt`, `interview.meetingLink`, and `interview.notes`.
- **Frontend Tasks:**
  - **Student Experience:**
    - "Apply Now" button on drive details with confirmation dialog.
    - **"My Applications" Page** (`/student/applications`) showing status progression badges (`Applied` $\rightarrow$ `Shortlisted` $\rightarrow$ `Selected`).
    - When candidate is shortlisted: displays scheduled date/time and a **"Join Online Interview"** button that opens the meeting room in one click.
  - **Recruiter Experience:**
    - **Applicants Review Table** (`/recruiter/drives/:id/applicants`):
      - Lists student name, branch, CGPA, and a "View Resume" button.
      - Action buttons: `Shortlist`, `Select`, `Reject`.
    - **Schedule Interview Modal:** When clicking `Shortlist`, prompts for Date & Time, and auto-generates a free **Jitsi Meet** room URL (`https://meet.jit.si/NexStep-Interview-...`) or accepts custom Google Meet link.

---

### **Member 6 (M6) — Admin Dashboard, Analytics & Resend Email Alerts**
- **Core Responsibility:** Placement statistics, system oversight, and email notifications.
- **Backend Tasks:**
  - Integrate **Resend SDK** utility (`utils/mailer.js`) to send transactional emails:
    1. Welcome email on user signup.
    2. Application confirmation email (when student applies).
    3. **Interview Scheduled Email:** Triggered when M5 shortlists candidate; includes Date, Time, and Jitsi/Meet link.
    4. Selection/Offer email when candidate is marked `SELECTED` (Placed!).
  - Build Admin analytics endpoint `GET /api/v1/admin/stats` calculating:
    - Total students, total drives, total placed students, placed %, average CTC, highest CTC.
  - Build Admin drive management routes (`GET /api/v1/admin/drives`, `DELETE /api/v1/admin/drives/:id`).
- **Frontend Tasks:**
  - Build **Admin Dashboard** (`/admin/dashboard`):
     - 4 KPI Stat Cards: Total Students, Placement %, Average Package (LPA), Total Drives.
     - Simple branch-wise placement breakdown bar chart or progress bars.
  - Build Admin Master Drive List table with ability to close or remove drives.
