# NexStep — Simplified Email Notification Spec (Resend)

## 1. Overview

NexStep uses the official **Resend** Node.js SDK to send clean transactional emails. 
In this mini project, email sending is straightforward:
- Direct API calls (`await resend.emails.send({...})`).
- No Redis queues, no background BullMQ workers, no complex webhooks required.
- Errors are caught and logged without crashing the main user request.

---

## 2. Resend Setup & Utility

```javascript
// server/utils/mailer.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY || 're_test_mock');

const FROM_EMAIL = 'NexStep Placements <onboarding@resend.dev>'; // or verified college domain

/**
 * Send an email notification safely
 */
async function sendEmail({ to, subject, html }) {
  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    console.log(`[Email Sent] To: ${to} | Subject: ${subject} | ID: ${data?.id}`);
    return { success: true, data };
  } catch (error) {
    console.error(`[Email Failed] To: ${to} | Error:`, error.message);
    return { success: false, error };
  }
}

module.exports = { sendEmail };
```

---

## 3. The 3 Essential Email Triggers

### 1. Welcome / Registration Email
- **Trigger:** When a student or recruiter creates an account.
- **Recipient:** New User.
- **Subject:** `Welcome to NexStep Campus Placements!`
- **Content:** Friendly welcome message confirming account creation and a direct link to log in and complete profile.

### 2. Application Submitted Confirmation
- **Trigger:** When an eligible student applies for a drive.
- **Recipient:** Student.
- **Subject:** `Application Submitted: [Job Title] at [Company Name]`
- **Content:** Confirmation that the student's resume and qualifications have been received by the recruiter.

### 3. Interview Call / Status Update Email
- **Trigger:** When recruiter shortlists a candidate for an interview.
- **Recipient:** Candidate Student.
- **Subject:** `Interview Scheduled: [Job Title] with [Company Name]`
- **Content:**
  - Date & Time of the interview.
  - **Online Video Meeting Link** (Direct click-to-join link, e.g. free instant Jitsi room or Google Meet).
  - Interviewer notes or instructions.
  - Link to view application status in the NexStep student dashboard.
