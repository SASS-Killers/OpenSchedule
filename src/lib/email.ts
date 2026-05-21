const isDev = process.env.NODE_ENV !== "production";

let logEmail: ((type: string, recipient: string) => Promise<void>) | null = null;

// Lazy-import the db query to avoid SSR issues in browser bundles
async function getLogEmail() {
  if (logEmail) return logEmail;
  try {
    const { query } = await import("@/db/neon");
    logEmail = async (type: string, recipient: string) => {
      try {
        const id = crypto.randomUUID();
        const now = Math.floor(Date.now() / 1000);
        await query`
          INSERT INTO sent_emails_log (id, email_type, recipient, sent_at)
          VALUES (${id}, ${type}, ${recipient}, ${now})
        `;
      } catch {
        // Silent — telemetry logging should never break email delivery
      }
    };
  } catch {
    logEmail = async () => {};
  }
  return logEmail;
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
  emailType = "confirmation",
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  emailType?: string;
}) {
  if (isDev) {
    // Mailpit REST API — catches emails in local browser UI
    await fetch("http://127.0.0.1:8025/api/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        To: [{ Name: to.split("@")[0], Email: to }],
        From: { Name: "OpenSchedule", Email: "noreply@openschedule.app" },
        Subject: subject,
        Text: text,
        HTML: html || text,
      }),
    });
  } else {
    // Brevo REST API (production)
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) return;
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { name: "OpenSchedule", email: process.env.FROM_EMAIL || "noreply@openschedule.app" },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: html || text,
      }),
    });
  }

  // Log to telemetry (fire-and-forget)
  const logger = await getLogEmail();
  logger(emailType, to);
}

// ── Templates ──────────────────────────────────────────────

export function otpEmail(code: string) {
  return {
    subject: "Your OpenSchedule Login Code",
    text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`,
    html: `<div style="font-family:sans-serif;padding:2rem;max-width:480px;margin:0 auto;">
      <h2>Your Login Code</h2>
      <p style="font-size:2rem;font-weight:700;letter-spacing:0.3em;text-align:center;padding:1rem;background:#f4f4f4;border-radius:8px;color:#000;">${code}</p>
      <p style="color:#666;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
    </div>`,
  };
}

export function bookingConfirmationClientEmail({
  clientName,
  hostName,
  eventTitle,
  startTime,
  endTime,
  cancellationUrl,
  icsUrl,
}: {
  clientName: string;
  hostName: string;
  eventTitle: string;
  startTime: string;
  endTime: string;
  cancellationUrl: string;
  icsUrl?: string;
}) {
  return {
    subject: `Confirmed: ${eventTitle} with ${hostName}`,
    text: `Hi ${clientName},\n\nYour ${eventTitle} with ${hostName} is confirmed for ${startTime} – ${endTime}.\n\nCancel: ${cancellationUrl}\n\nAdd to calendar: ${icsUrl || "Download .ics from your booking page"}`,
    html: `<div style="font-family:sans-serif;padding:2rem;max-width:480px;margin:0 auto;">
      <h2>Booking Confirmed</h2>
      <p><strong>${eventTitle}</strong> with ${hostName}</p>
      <p>${startTime} – ${endTime}</p>
      ${icsUrl ? `<p style="margin:1rem 0;"><a href="${icsUrl}" style="display:inline-block;padding:0.5rem 1rem;background:#6366f1;color:#fff;border-radius:0.45rem;text-decoration:none;font-size:0.85rem;">Add to Calendar (.ics)</a></p>` : ""}
      <hr style="border:none;border-top:1px solid #eee;margin:1.5rem 0;"/>
      <p style="color:#666;">Need to cancel? <a href="${cancellationUrl}">Click here</a></p>
    </div>`,
  };
}

export function bookingNotificationHostEmail({
  hostName,
  clientName,
  clientEmail,
  eventTitle,
  startTime,
  endTime,
}: {
  hostName: string;
  clientName: string;
  clientEmail: string;
  eventTitle: string;
  startTime: string;
  endTime: string;
}) {
  return {
    subject: `New booking: ${eventTitle} with ${clientName}`,
    text: `Hi ${hostName},\n\n${clientName} (${clientEmail}) booked ${eventTitle} for ${startTime} – ${endTime}.`,
    html: `<div style="font-family:sans-serif;padding:2rem;max-width:480px;margin:0 auto;">
      <h2>New Booking</h2>
      <p><strong>${eventTitle}</strong></p>
      <p>${startTime} – ${endTime}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:1.5rem 0;"/>
      <p><strong>${clientName}</strong><br/>${clientEmail}</p>
    </div>`,
  };
}

export function cancellationEmail({
  name,
  eventTitle,
  startTime,
}: {
  name: string;
  eventTitle: string;
  startTime: string;
}) {
  return {
    subject: `Cancelled: ${eventTitle}`,
    text: `Hi ${name},\n\nYour ${eventTitle} on ${startTime} has been cancelled.`,
    html: `<div style="font-family:sans-serif;padding:2rem;max-width:480px;margin:0 auto;">
      <h2>Booking Cancelled</h2>
      <p><strong>${eventTitle}</strong> on ${startTime}</p>
      <p style="color:#666;">This appointment has been cancelled.</p>
    </div>`,
  };
}

export function welcomeHostEmail({ name, email }: { name: string; email: string }) {
  return {
    subject: "Welcome to OpenSchedule",
    text: `Hi ${name},\n\nYou've been added as a host. Login at the app with ${email} to set your availability.`,
    html: `<div style="font-family:sans-serif;padding:2rem;max-width:480px;margin:0 auto;">
      <h2>Welcome to OpenSchedule</h2>
      <p>Hi ${name},</p>
      <p>You've been added as a host. Login with <strong>${email}</strong> to set your availability and create event types.</p>
    </div>`,
  };
}
