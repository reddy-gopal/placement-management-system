# 🎯 NexStep — M4: Drives Catalog & Eligibility Engine (Frontend)

Member 4 end-to-end frontend slice for the **NexStep Student Placement Portal**.

---

## 🌟 Features Implemented

### 1. Student Drive Browser (`/student/drives`)
- **Card Grid Layout**: Company name, logo avatar, role title, package pill (`₹X.X LPA`), location, employment type, and live deadline countdown.
- **Prominent Eligibility Badges**:
  - 🟢 **"Eligible to Apply"** badge when student satisfies all criteria.
  - 🔴 **"Not Eligible"** badge with count of issues and an interactive tooltip/popover explaining the exact failure reasons (e.g. *"Requires CGPA $\ge 7.5$; your CGPA is 7.2"* or *"Allows at most 0 active backlogs; you have 1"*).
- **KPI Summary Header**:
  - Active drives count
  - Eligible drives count
  - Average CTC
  - Highest CTC package

### 2. Search, Filter & Discovery Engine
- **Search Bar**: Live search by company name, job role, description, and target skills.
- **Eligibility Filter Pills**: `All Drives`, `Eligible Only`, `Ineligible Only`.
- **CTC Pills**: `Any CTC`, `₹6+ LPA`, `₹12+ LPA`, `₹20+ LPA`.
- **Branch Filter**: Filter by allowed academic branches (`CSE`, `IT`, `ECE`, `EEE`, `MECH`, `CIVIL`).
- **Employment Type**: Filter by `FULL_TIME` or `INTERNSHIP`.
- **Sorting**: By Deadline (Soonest first), Package (High to Low), Newest, or Company (A-Z).

### 3. Detailed Drive View (`/student/drives/:id` & Modal)
- Full job description, role, package breakdown, skills required tags, and selection process stages.
- **Criteria Breakdown Checklist**:
  - Minimum CGPA: Required vs Student's CGPA
  - Maximum Backlogs: Allowed vs Student's Backlogs
  - Allowed Branches: Allowed list vs Student's Branch
  - Visual status indicators (`Satisfied` / `Not Met`)
- **1-Click Apply Flow**:
  - Interactive application modal with verified student snapshot and resume link preview.
  - Submits to `POST /api/v1/applications/apply`.
  - Duplicate application prevention (marks drive as `Applied`).

### 4. Real-time Eligibility Engine & Profile Simulator
- Built-in **Academic Profile Bar** and **Eligibility Simulator**:
  - **Quick Archetypes**: Switch between test profiles (e.g., *Aditya Sharma* CSE 8.8 CGPA, *Sneha Patel* ECE 7.2 CGPA 1 Backlog, *Rahul Verma* MECH 6.8 CGPA, *Karan Mehra* IT 5.8 CGPA 2 Backlogs).
  - **Custom Profile Adjuster**: Tweak CGPA (0.0 to 10.0 slider), active backlogs (0 to 10), and branch dropdown to watch every badge on the page re-calculate in real time!
  - **Live JWT Mode**: Paste your token from Member 1 authentication to connect directly with the live Express backend (`http://localhost:4000/api/v1`).
- Graceful offline fallback with rich realistic drives if the backend database is offline.

---

## 🛠️ Quick Start

```bash
cd M4-Frontend
npm install
npm run dev
```

The application runs on `http://localhost:5174` with automatic API proxying to `http://localhost:4000`.
