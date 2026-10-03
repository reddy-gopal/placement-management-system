# NexStep — UI/UX Design System (Tailwind CSS)

## 1. Aesthetic Direction: "Clean, Modern & Premium"

Even as a mini project, NexStep aims for a modern, sleek interface with Tailwind CSS rather than basic default styles:
- **Primary Color:** Deep Indigo (`indigo-600` / `indigo-500` hover).
- **Secondary / Accent:** Emerald Green for Placed/Eligible badges (`emerald-500`), Amber for Pending (`amber-500`), Rose for Ineligible/Rejected (`rose-500`).
- **Dark Mode Support:** Slate dark theme (`bg-slate-900`, `text-slate-100`, cards in `bg-slate-800/80` with subtle `border-slate-700`).
- **Typography:** Modern clean sans-serif (Inter / System font).

---

## 2. Screen Map per Role

### 2.1 Student Portal (`/student`)
1. **Student Dashboard:** Profile summary card, quick stats (Applications sent, Shortlisted count, Placed status), and upcoming drive alerts.
2. **Drive Catalog:** Clean grid of job cards with company logo/avatar, role title, package pill (e.g. `₹8.5 LPA`), deadline countdown, and a prominent badge (**Eligible** / **Ineligible**).
3. **Application Tracker:** Clean list/table showing applied drives with stage badges (`Applied` $\rightarrow$ `Shortlisted` $\rightarrow$ `Selected`).
4. **My Profile:** Simple form to update roll no, branch, CGPA, backlogs, skills tags, and resume link.

### 2.2 Recruiter Portal (`/recruiter`)
1. **Recruiter Dashboard:** List of posted drives, total applicants count, and "+ Post New Drive" button.
2. **Post Drive Form:** Title, CTC, Location, Deadline, and Eligibility sliders/inputs (Min CGPA, Backlogs, Branch checkboxes).
3. **Applicant Review Table:** Table of applicants with candidate name, branch, CGPA, resume preview button, and action buttons (`Shortlist`, `Select`, `Reject`).

### 2.3 Admin Portal (`/admin`)
1. **Executive Dashboard:** 4 KPI stat cards (Total Students, Drives Hosted, Placed %, Average CTC) + simple bar chart of branch-wise placements.
2. **All Drives Management:** Master table of all active campus drives with view and delete capabilities.
3. **Students Directory:** Table of registered students with placement status toggle.
