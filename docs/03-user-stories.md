# NexStep — Core User Stories (Mini Project)

These 12 core user stories define the complete functionality of the mini project across the 3 roles and authentication.

---

## 1. Authentication & Common (AUTH)

### [AUTH-01] User Registration & Role Selection
- **As a** new user (Student or Recruiter),
- **I want to** register with my email, password, full name, and selected role,
- **So that** I receive an account to access the relevant portal.
- **Acceptance:** Password hashed with bcrypt; returns JWT token and user info; sends welcome email via Resend.

### [AUTH-02] User Login & Role Routing
- **As a** registered user,
- **I want to** log in with my email and password,
- **So that** I am authenticated and automatically redirected to my role dashboard (`/student`, `/recruiter`, or `/admin`).
- **Acceptance:** Validates credentials; returns JWT; client stores token in `localStorage`.

---

## 2. Student Experience (STU)

### [STU-01] Create & Update Academic Profile
- **As a** student,
- **I want to** enter my roll number, branch, graduation year, CGPA, active backlogs, skills, and resume link,
- **So that** recruiters and the placement drive system know my qualifications.
- **Acceptance:** Profile form persists in MongoDB; validates CGPA between 0 and 10; skills stored as array.

### [STU-02] Browse Drives with Live Eligibility Badge
- **As a** student,
- **I want to** browse active campus drives and see a clear "Eligible" or "Not Eligible" status on each card,
- **So that** I immediately know which jobs I can apply for.
- **Acceptance:** Compares student's CGPA, branch, and backlogs against drive criteria; shows reason if ineligible.

### [STU-03] Apply for a Placement Drive
- **As an** eligible student,
- **I want to** click "Apply" on an active drive,
- **So that** my profile and resume are submitted to the recruiter.
- **Acceptance:** Creates an `Application` record with status `APPLIED`; prevents duplicate applications for the same drive.

### [STU-04] Track Application Statuses
- **As a** student,
- **I want to** view a list of all drives I've applied to with their current status (`APPLIED`, `SHORTLISTED`, `SELECTED`, `REJECTED`),
- **So that** I can track my hiring outcomes in real time.
- **Acceptance:** Dashboard lists all applications with color-coded status badges.

---

## 3. Recruiter Experience (REC)

### [REC-01] Set Up Company Profile
- **As a** recruiter,
- **I want to** enter our company name, website, industry, and logo URL,
- **So that** students see our branding when viewing our drives.
- **Acceptance:** Stores company details linked to the recruiter user ID.

### [REC-02] Post a Campus Placement Drive
- **As a** recruiter,
- **I want to** create a drive with job title, description, package (CTC in LPA), location, deadline, and eligibility criteria (Min CGPA, Allowed Branches, Max Backlogs),
- **So that** students can discover and apply for the role.
- **Acceptance:** Form saves new `Drive` in database; appears immediately on the student drive catalog.

### [REC-03] Review Drive Applicants
- **As a** recruiter,
- **I want to** view a table of all students who applied for my drive with their CGPA, branch, and resume link,
- **So that** I can evaluate candidate qualifications.
- **Acceptance:** Recruiter can filter applicants by branch and search by student name/roll number.

### [REC-04] Update Applicant Hiring Status
- **As a** recruiter,
- **I want to** change a candidate's status to `SHORTLISTED`, `SELECTED`, or `REJECTED`,
- **So that** the student is informed of the decision and college placement records stay current.
- **Acceptance:** Updates application status; triggers status update email to the student via Resend.

---

## 4. Admin / TPO Cockpit (ADM)

### [ADM-01] Placement Analytics Overview
- **As a** placement officer,
- **I want to** see an executive summary card with total students, total drives, total placed students, and average CTC,
- **So that** I can evaluate overall campus hiring performance.
- **Acceptance:** Calculates aggregate counts from MongoDB and displays clean stat cards.

### [ADM-02] Manage All Drives & Applications
- **As a** placement officer,
- **I want to** view and manage all posted drives and student applications across all companies,
- **So that** I can ensure college recruitment guidelines are followed and assist recruiters or students.
- **Acceptance:** Admin table with drive deletion and student status override capabilities.
