# NexStep — Student Placement Portal (Mini Project PRD)

## 1. Project Overview & Objective

**NexStep** is a lightweight, full-stack placement portal designed to streamline campus hiring for college students, recruiting companies, and the placement officer (TPO). 

Instead of dealing with scattered Google Sheets and manual emails, NexStep provides a clean, single-hub web application where:
1. **Students** create profiles, view campus drives they are eligible for, and apply with their resume.
2. **Companies** post job openings, review applicant profiles, and update candidate statuses (Shortlist / Select / Reject).
3. **Placement Officers (Admin)** oversee all drives, verify companies, and view high-level placement statistics.

---

## 2. Core User Roles

We keep the system lean and practical with **3 core roles**:

| Role | Access Scope | Key Actions |
|---|---|---|
| **Student** | Student Portal | Register, build academic profile, upload resume link, browse eligible drives, apply, track application status. |
| **Recruiter** | Recruiter Portal | Register company, post drives with eligibility criteria (Min CGPA, Allowed Branches, Max Backlogs), review applicants, update hiring status. |
| **Admin (TPO)** | Admin Cockpit | Verify companies/drives, monitor all applicants, view placement dashboard (Placed %, Avg Package, Total Offers). |

---

## 3. Technology Stack (Simple MERN)

No heavy message queues, no microservices, no Redis workers. A straightforward, reliable architecture:

- **Frontend:** React 18 + Vite + Tailwind CSS + Lucide Icons (Fast, responsive, modern dark/light UI).
- **Backend:** Node.js + Express.js (REST API).
- **Database:** MongoDB Atlas (Mongoose ODM).
- **Authentication:** JWT (JSON Web Tokens) with passwords hashed using `bcryptjs`.
- **File / Resume Storage:** PDF upload via Cloudinary or direct resume URL link.
- **Transactional Email:** Direct **Resend** Node SDK API calls (no Redis/BullMQ required).

---

## 4. End-to-End Core Flow

```
[Student Registration] ──► [Fill Profile: CGPA, Branch, Backlogs, Resume]
                                │
[Recruiter Posts Drive] ────────┼──► [Automated Eligibility Check (CGPA & Branch)]
(Sets Criteria & Deadline)      │
                                ▼
                    [Student Applies in 1-Click]
                                │
                                ▼
                    [Recruiter Reviews Applicants]
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
       [Shortlist / Interview]              [Reject]
                │
                ▼
      [Select / Offer Extended]
                │
                ▼
    [Placement Dashboard Updates Live]
```

---

## 5. Core Feature Specifications

### 5.1 Authentication & Profile
- User signup & login with role selection (`STUDENT`, `RECRUITER`, `ADMIN`).
- Student Profile: PRN/Roll No, Department (CSE, IT, ECE, MECH, etc.), Current CGPA, Active Backlogs, Skills, and Resume PDF link.
- Company Profile: Company Name, Website, HR Contact, Logo URL.

### 5.2 Drives & Eligibility Engine
- Recruiter or Admin posts a Drive:
  - Role Title, Description, Package (CTC in LPA), Location, Application Deadline.
  - Eligibility Rules: Minimum CGPA (e.g. 7.0), Maximum Active Backlogs (e.g. 0), Allowed Branches.
- Live Eligibility Check:
  - When a student browses drives, the portal compares their profile against the criteria.
  - Clear badge: **"Eligible"** (green) vs **"Not Eligible"** (with exact reason: e.g. "Requires CGPA >= 7.5; your CGPA is 7.1").

### 5.3 Applications & Status Tracking
- Eligible student clicks "Apply Now" $\rightarrow$ Application submitted.
- Application Status Lifecycle:
  `APPLIED` $\longrightarrow$ `SHORTLISTED` $\longrightarrow$ `SELECTED` (or `REJECTED`).
- Student sees a live tracker of all their applications.
- Recruiter sees a filtered table of applicants with resume links and 1-click status update buttons.

### 5.4 Simple Email Alerts (Resend)
Direct, synchronous Resend API calls on key events:
1. **Welcome / Account Confirmation** (on signup).
2. **Application Confirmation** (to student on apply).
3. **Status Update Alert** (to student when shortlisted or selected).

### 5.5 Admin Dashboard
- Total registered students, total drives, total applications.
- Total students placed & overall placement percentage.
- Highest and average CTC offered.
