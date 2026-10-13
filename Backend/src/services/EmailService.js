import { Resend } from 'resend'

// Initialize Resend with environment variable or fallback placeholder
const apiKey = process.env.RESEND_API_KEY || 're_xxxxxxxxx'
export const resend = new Resend(apiKey)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

const emailContainer = (title, contentHtml) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 32px 16px;
      color: #0f172a;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      background-color: #0f172a;
      color: #ffffff;
      padding: 24px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .badge {
      background-color: #38bdf8;
      color: #0f172a;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .content {
      padding: 32px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    .text {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 20px;
    }
    .card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .card-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 14px;
    }
    .card-row:last-child {
      border-bottom: none;
    }
    .card-label {
      color: #64748b;
      font-weight: 500;
    }
    .card-value {
      font-weight: 600;
      color: #0f172a;
    }
    .btn-container {
      text-align: center;
      margin: 28px 0 16px;
    }
    .btn {
      display: inline-block;
      background-color: #0f172a;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      letter-spacing: 0.01em;
    }
    .btn-green {
      background-color: #15803d;
    }
    .footer {
      border-top: 1px solid #f1f5f9;
      padding: 20px 32px;
      background-color: #fafafa;
      font-size: 12px;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>NexStep Placements</h1>
      <span class="badge">Campus Portal</span>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      © 2026 NexStep · University Placement Cell · All rights reserved.
    </div>
  </div>
</body>
</html>
`

/**
 * Generic safe email sender
 */
const safeSend = async ({ to, subject, html, logType }) => {
    console.log(`\n==================================================`)
    console.log(`[RESEND EMAIL] ${logType || 'Notification'}`)
    console.log(`[To]: ${to}`)
    console.log(`[Subject]: ${subject}`)
    console.log(`==================================================\n`)

    try {
        const result = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            html
        })

        if (result.error) {
            console.error(`[EmailService] Resend API error (${logType}):`, result.error)
        } else {
            console.log(`[EmailService] Email sent successfully (${logType}) with ID:`, result.data?.id)
        }

        return result
    } catch (error) {
        console.error(`[EmailService] Failed to send email (${logType}):`, error.message)
        return { error: { message: error.message } }
    }
}

/**
 * Send the official Hello World onboarding email as specified by Resend API documentation.
 */
export const sendTestEmail = async (to = 'gopalreddyanthapu07@gmail.com') => {
    return safeSend({
        to,
        subject: 'Hello World',
        html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
        logType: 'Test Email'
    })
}

/**
 * Send an email verification code to the registered user.
 */
export const sendVerificationEmail = async ({ to, name, code }) => {
    const subject = `${code} is your NexStep verification code`
    const content = `
      <p class="greeting">Hello ${name || 'there'},</p>
      <p class="text">
        Thank you for registering on <strong>NexStep</strong>. To complete your registration and activate your account, please enter the verification code below:
      </p>
      <div style="background-color:#f1f5f9; border:1px dashed #cbd5e1; border-radius:8px; padding:18px 24px; text-align:center; margin:24px 0;">
        <div style="font-size:32px; font-weight:700; letter-spacing:6px; color:#0f172a; font-family:monospace;">${code}</div>
        <div style="font-size:12px; color:#64748b; margin-top:8px;">This code expires in 15 minutes.</div>
      </div>
      <p class="text">
        If you did not attempt to sign up for NexStep, you can safely ignore this email.
      </p>
    `

    console.log(`[RESEND CODE] -> ${code} <-`)
    return safeSend({
        to,
        subject,
        html: emailContainer('Verify your NexStep account', content),
        logType: 'Email Verification OTP'
    })
}

/**
 * 1. Application Submitted Confirmation Email
 */
export const sendApplicationSubmittedEmail = async ({ to, studentName, jobTitle, companyName, packageLpa, location }) => {
    const subject = `Application Submitted: ${jobTitle} at ${companyName}`
    const content = `
      <p class="greeting">Hello ${studentName || 'Student'},</p>
      <p class="text">
        Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been successfully submitted!
      </p>

      <div class="card">
        <div class="card-row">
          <span class="card-label">Position</span>
          <span class="card-value">${jobTitle}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Company</span>
          <span class="card-value">${companyName}</span>
        </div>
        ${packageLpa ? `
        <div class="card-row">
          <span class="card-label">Package</span>
          <span class="card-value">₹${packageLpa} LPA</span>
        </div>` : ''}
        ${location ? `
        <div class="card-row">
          <span class="card-label">Location</span>
          <span class="card-value">${location}</span>
        </div>` : ''}
      </div>

      <p class="text">
        Your resume and profile are now in review with the recruitment team. You will receive an email update as soon as your application is processed.
      </p>
    `

    return safeSend({
        to,
        subject,
        html: emailContainer('Application Submitted', content),
        logType: 'Application Submitted'
    })
}

/**
 * 2. Interview Scheduled Email with Meeting Link
 */
export const sendInterviewScheduledEmail = async ({ to, studentName, jobTitle, companyName, scheduledAt, meetingLink, notes }) => {
    const subject = `Interview Scheduled: ${jobTitle} with ${companyName}`
    const formattedDate = scheduledAt
        ? new Date(scheduledAt).toLocaleString('en-US', {
              dateStyle: 'full',
              timeStyle: 'short'
          })
        : 'To be announced'

    const content = `
      <p class="greeting">Congratulations, ${studentName || 'Student'}!</p>
      <p class="text">
        You have been <strong>shortlisted</strong> for an interview for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.
      </p>

      <div class="card">
        <div class="card-row">
          <span class="card-label">Company</span>
          <span class="card-value">${companyName}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Role</span>
          <span class="card-value">${jobTitle}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Date & Time</span>
          <span class="card-value" style="color: #2563eb;">${formattedDate}</span>
        </div>
        ${notes ? `
        <div class="card-row">
          <span class="card-label">Recruiter Notes</span>
          <span class="card-value">${notes}</span>
        </div>` : ''}
      </div>

      ${meetingLink ? `
      <div class="btn-container">
        <a href="${meetingLink}" target="_blank" class="btn">
          🎥 Join Online Interview
        </a>
      </div>
      <p class="text" style="text-align: center; font-size: 12px; color: #64748b;">
        Or copy meeting URL: <a href="${meetingLink}" style="color: #2563eb;">${meetingLink}</a>
      </p>
      ` : `
      <p class="text" style="color: #64748b;">
        The recruiter will share the meeting details shortly via your NexStep dashboard.
      </p>
      `}

      <p class="text">
        Please ensure you are ready 5 minutes before the scheduled time with your microphone and camera tested. Good luck!
      </p>
    `

    console.log(`[INTERVIEW LINK] -> ${meetingLink} <-`)
    return safeSend({
        to,
        subject,
        html: emailContainer('Interview Invitation', content),
        logType: 'Interview Scheduled'
    })
}

/**
 * 3. Official Job Offer / Selection Email
 */
export const sendOfferEmail = async ({ to, studentName, jobTitle, companyName, packageLpa, offerDeadline }) => {
    const subject = `🎉 Congratulations! Job Offer from ${companyName} for ${jobTitle}`
    const formattedDeadline = offerDeadline
        ? new Date(offerDeadline).toLocaleDateString('en-US', {
              dateStyle: 'full'
          })
        : '7 days from today'

    const content = `
      <p class="greeting">Congratulations ${studentName || 'Student'}! 🎓</p>
      <p class="text">
        We are thrilled to inform you that you have been <strong>selected</strong> for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>!
      </p>

      <div class="card">
        <div class="card-row">
          <span class="card-label">Offering Company</span>
          <span class="card-value">${companyName}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Role</span>
          <span class="card-value">${jobTitle}</span>
        </div>
        ${packageLpa ? `
        <div class="card-row">
          <span class="card-label">Package (CTC)</span>
          <span class="card-value" style="color: #16a34a; font-size: 16px;">₹${packageLpa} LPA</span>
        </div>` : ''}
        <div class="card-row">
          <span class="card-label">Decision Deadline</span>
          <span class="card-value" style="color: #dc2626;">${formattedDeadline}</span>
        </div>
      </div>

      <p class="text">
        Please log in to your NexStep student portal to review the offer and make your decision (Accept or Decline) before the deadline.
      </p>
    `

    return safeSend({
        to,
        subject,
        html: emailContainer('Job Offer Received', content),
        logType: 'Job Offer Extended'
    })
}

/**
 * 4. Application Status Update Email (e.g. Rejected or Finalized)
 */
export const sendApplicationStatusUpdateEmail = async ({ to, studentName, jobTitle, companyName, status }) => {
    const subject = `Status Update: ${jobTitle} at ${companyName}`
    const content = `
      <p class="greeting">Hello ${studentName || 'Student'},</p>
      <p class="text">
        Thank you for your interest and the time you invested in applying for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.
      </p>
      <p class="text">
        After reviewing all applications, the recruitment team has decided to move forward with other candidates for this specific role.
      </p>
      <p class="text">
        Your profile remains active on NexStep for upcoming placement drives. We encourage you to explore other openings matching your skills.
      </p>
    `

    return safeSend({
        to,
        subject,
        html: emailContainer('Application Update', content),
        logType: 'Status Update'
    })
}

/**
 * 5. Job Drive Update Email
 */
export const sendDriveUpdateEmail = async ({ to, studentName, jobTitle, companyName, updateMessage }) => {
    const subject = `Drive Update: ${jobTitle} at ${companyName}`
    const content = `
      <p class="greeting">Hello ${studentName || 'Student'},</p>
      <p class="text">
        An important update has been posted for the <strong>${jobTitle}</strong> drive by <strong>${companyName}</strong>:
      </p>
      <div class="card">
        <p class="text" style="margin: 0; font-weight: 500;">
          ${updateMessage || 'Please review your NexStep dashboard for updated drive requirements or schedules.'}
        </p>
      </div>
    `

    return safeSend({
        to,
        subject,
        html: emailContainer('Drive Update', content),
        logType: 'Drive Details Updated'
    })
}
