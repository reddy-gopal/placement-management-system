# 🎓 NexStep — Student Placement Portal

A modern, lightweight full-stack **MERN** campus placement portal connecting **Students**, **Recruiting Companies**, and the **College Placement Cell (TPO)** in one unified system.

---

## 🌟 Highlights

* **3 Core Roles:** Student, Company Recruiter, and Placement Officer (Admin).
* **Automated Eligibility Engine:** Instant live evaluation of student qualifications (CGPA, Branch, Backlogs) against company criteria.
* **1-Click Applications:** Direct application with resume link and duplicate submission prevention.
* **Integrated Online Interviews:** Instant free video meeting room generation (**Jitsi Meet**) and Google Meet link support with candidate notifications.
* **Direct Transactional Emails:** Seamless email alerts powered by the official **Resend** Node.js SDK.
* **Real-Time Placement Analytics:** Live tracking of Placed %, average package (LPA), highest CTC, and branch-wise hiring reports.

---

## 🏗️ Tech Stack

* **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons
* **Backend:** Node.js, Express.js (REST API)
* **Database:** MongoDB Atlas (Mongoose ODM)
* **Authentication:** JWT (JSON Web Tokens) + `bcryptjs` password hashing
* **Video Interviews:** Free instant web video conferencing via Jitsi Meet (`meet.jit.si`)
* **Email Service:** [Resend](https://resend.com) Node SDK

---

## 🚀 Roles & Capabilities

### 🧑‍🎓 Student
- Create & maintain academic profile (Roll No, Branch, CGPA, Backlogs, Skills, and Resume link).
- Browse active campus drives with live **"Eligible"** (green) vs **"Not Eligible"** (red with reason) badges.
- 1-click apply to eligible drives.
- Track application progress in real-time (`Applied` $\rightarrow$ `Shortlisted` $\rightarrow$ `Selected`).
- View scheduled interview date/time and launch the video interview directly from the dashboard.

### 🏢 Company Recruiter
- Register company profile (Name, Website, Industry, Logo).
- Post placement drives with specific cut-offs (Min CGPA, Allowed Branches, Max Backlogs, Package LPA, Deadline).
- View drive applicants, preview resumes, and filter candidates by CGPA or branch.
- Shortlist candidates for online interviews with automated video meeting links.
- Update candidate hiring status to **Selected** (Placed!) or **Rejected**.

### 👨‍💼 Placement Officer (Admin / TPO)
- Institutional dashboard with placement KPIs: Placed %, Average CTC, Highest Package, Total Offers.
- Supervise all company drives and student applications across campus.
- Manage drive approvals and monitor campus placement outcomes.

---

## 📁 Repository Structure & Documentation

Detailed project architecture and team specifications are documented in the [`/docs`](./docs) folder:

| Document | Purpose |
|---|---|
| [**PRD.md**](./docs/PRD.md) | Product Requirements Document — core flow, stack, and features |
| [**01-personas-and-roles.md**](./docs/01-personas-and-roles.md) | Personas and user role definitions |
| [**02-rbac-permission-matrix.md**](./docs/02-rbac-permission-matrix.md) | Access control matrix and JWT auth middleware |
| [**03-user-stories.md**](./docs/03-user-stories.md) | 12 core user stories covering all features |
| [**04-email-notification-spec.md**](./docs/04-email-notification-spec.md) | Resend email notification specifications |
| [**05-data-model.md**](./docs/05-data-model.md) | Mongoose data models (`User`, `StudentProfile`, `Company`, `JobDrive`, `Application`) |
| [**06-api-contract.md**](./docs/06-api-contract.md) | Complete REST API contract and endpoints |
| [**07-ui-ux-and-design-system.md**](./docs/07-ui-ux-and-design-system.md) | Tailwind CSS design system and screen maps |
| [**09-team-task-breakdown.md**](./docs/09-team-task-breakdown.md) | Task distribution across 6 team members (M1–M6) |
| [**11-git-workflow-and-pr-process.md**](./docs/11-git-workflow-and-pr-process.md) | Git branching, conventional commits, and PR rules |
| [**CONTRIBUTING.md**](./CONTRIBUTING.md) | Developer quickstart guide |

---

## 🛠️ Getting Started Locally

### 1. Clone the repository
```bash
git clone https://github.com/reddy-gopal/placement-management-system.git
cd placement-management-system
```

### 2. Configure Environment Variables
Create a `.env` file in the root or server directory:
```env
PORT=4000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/nexstep?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
RESEND_API_KEY=re_your_resend_api_key
```

### 3. Install & Run
```bash
npm install
npm run dev
```

---

## 👥 Team & Ownership

This project is built by a 6-developer team:
- **M1:** Auth, User Management, Global Scaffolding & Routing
- **M2:** Student Profile, Qualifications & Resume Link
- **M3:** Recruiter Portal, Company Setup & Job Drive Posting
- **M4:** Drives Catalog & Automated Eligibility Engine
- **M5:** Applications, Hiring Pipeline & Online Interview Scheduling
- **M6:** Admin Dashboard Analytics & Resend Email Notifications
