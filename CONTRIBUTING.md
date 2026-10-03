# Contributing to NexStep (Mini Project)

Welcome to **NexStep** — a clean, lightweight campus placement management portal for college students, recruiting companies, and the placement cell.

---

## 1. Prerequisites

Ensure you have the following installed on your machine:
- **Node.js:** `v18.x` or `v20.x` (LTS)
- **npm:** `v9.x` or higher
- **Git:** `v2.x+`
- **MongoDB:** A free [MongoDB Atlas](https://www.mongodb.com/atlas) connection URI or local MongoDB

*(Note: No Redis, Docker, or external workers required!)*

---

## 2. Quickstart Development Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/reddy-gopal/placement-management-system.git
   cd placement-management-system
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your MongoDB connection string and Resend API key:
   ```env
   PORT=4000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/nexstep?retryWrites=true&w=majority
   JWT_SECRET=super_secret_jwt_key_12345
   RESEND_API_KEY=re_test_mock_or_actual_key
   ```

4. **Start Development Servers:**
   ```bash
   npm run dev
   ```
   This boots:
   - **Frontend (React + Vite + Tailwind):** `http://localhost:5173`
   - **Backend API (Express.js):** `http://localhost:4000/api/v1`

---

## 3. Branching & Git Conventions

- **Base Branch:** Branch off `develop`.
- **Branch Naming:**
  - `feature/<module>/<ID>-<short-description>` (e.g. `feature/student/STU-01-profile`)
  - `fix/<module>/<short-description>`
- **Commit Messages:** Use Conventional Commits:
  ```bash
  git commit -m "feat(student): add profile edit form with cgpa validation [STU-01]"
  ```
- **PR Review:** Create a Pull Request against `develop` and request a review from your teammate.

---

## 4. Coding Standards

- **Frontend:** React + Tailwind CSS. Use clean utility classes; avoid inline styles. Keep UI components responsive and clean.
- **Backend:** Node.js + Express + Mongoose. Use async/await and try/catch blocks. Return standard JSON: `{ success: true, data }` or `{ success: false, message }`.
- **Emails:** Send transactional emails directly using `utils/mailer.js` (`resend.emails.send()`).
