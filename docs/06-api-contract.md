# NexStep — Simplified API Contract

Base URL: `/api/v1`

---

## 1. Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Access | Request Body | Response Shape |
|---|---|---|---|---|
| `POST` | `/auth/signup` | Public | `{ name, email, password, role }` | `{ success: true, token, user }` |
| `POST` | `/auth/login` | Public | `{ email, password }` | `{ success: true, token, user }` |
| `GET` | `/auth/me` | Authed | Headers: `Bearer <token>` | `{ success: true, user }` |

---

## 2. Student Profile Endpoints (`/api/v1/student`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/student/profile` | Student | Get authenticated student's profile & placement status |
| `POST` | `/student/profile` | Student | Create or update student profile (branch, CGPA, backlogs, skills, resume) |

---

## 3. Placement Drives Endpoints (`/api/v1/drives`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/drives` | Authed | List all active drives (with live student eligibility flag if student) |
| `GET` | `/drives/:id` | Authed | Get specific drive details |
| `POST` | `/drives` | Recruiter/Admin | Create a new placement drive with eligibility rules |
| `PATCH` | `/drives/:id/status`| Recruiter/Admin | Open or close drive registrations |
| `DELETE`| `/drives/:id` | Admin | Delete a drive |

---

## 4. Application & Interview Endpoints (`/api/v1/applications`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/applications/apply` | Student | Apply to a drive: `{ driveId }` (validates student eligibility) |
| `GET` | `/applications/my` | Student | Get all applications submitted by logged-in student (includes interview links) |
| `GET` | `/applications/drive/:driveId` | Recruiter/Admin | View all candidate applicants for a specific drive |
| `PATCH` | `/applications/:id/status` | Recruiter/Admin | Update applicant status & schedule interview:<br>`{ status: 'SHORTLISTED', interviewDate, meetingLink, notes }` or `{ status: 'SELECTED' | 'REJECTED' }` |

---

## 5. Admin Dashboard Endpoints (`/api/v1/admin`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/admin/stats` | Admin | Returns `{ totalStudents, totalDrives, totalPlaced, avgPackage, highestPackage }` |
| `GET` | `/admin/students`| Admin | List all students with placement status and branch |
| `GET` | `/admin/drives` | Admin | List all drives across all companies |
