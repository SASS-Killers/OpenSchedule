// Daily reminder cron worker
// Scheduled at 08:00 UTC via Cloudflare Workers Cron Triggers
// Finds confirmed bookings in the 12-36 hour window and sends reminder emails
//
// Deploy: npx wrangler deploy src/workers/cron.ts --compatibility-date=2026-05-19
// Cron: 0 8 * * *

import { neon } from "@neondatabase/serverless";

interface Env {
  DATABASE_URL: string;
  BREVO_API_KEY: string;
  FROM_EMAIL?: string;
  CRON_SECRET?: string;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const sql = neon(env.DATABASE_URL);

    const now = Math.floor(Date.now() / 1000);
    const in12h = now + 12 * 3600;
    const in36h = now + 36 * 3600;

    // Find bookings in the reminder window that haven't been reminded yet
    const bookings = await sql`
      SELECT b.id, b.start_time, b.cancellation_token,
             c.email AS client_email, c.name AS client_name,
             u.name AS host_name, e.title AS event_title
      FROM bookings b
      JOIN clients c ON b.client_id = c.id
      JOIN event_types e ON b.event_type_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE b.status = 'confirmed'
        AND b.reminder_sent = false
        AND b.start_time BETWEEN ${in12h} AND ${in36h}
    `;

    if (bookings.length === 0) {
      console.log("No bookings to remind today.");
      return;
    }

    // Check email quota — skip reminders if at 80%+
    const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
    const [countRow] = await sql`
      SELECT COUNT(*) AS sent_today FROM sent_emails_log WHERE sent_at >= ${todayStart}
    `;
    const sentToday = countRow?.sent_today || 0;
    if (sentToday >= 240) {
      console.log(`Email quota at ${sentToday}/300 — skipping reminders.`);
      return;
    }

    let sent = 0;
    for (const b of bookings) {
      // Format time in host timezone
      const startStr = new Date(b.start_time * 1000).toLocaleString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

      const subject = `Reminder: ${b.event_title} with ${b.host_name} tomorrow`;
      const text = `Hi ${b.client_name},\n\nThis is a reminder for your ${b.event_title} with ${b.host_name} on ${startStr}.\n\nNeed to cancel? Use this link: ${b.cancellation_token ? `/cancel/${b.cancellation_token}` : "Contact your host."}`;
      const html = `<div style="font-family:sans-serif;padding:2rem;max-width:480px;margin:0 auto;">
        <h2>Upcoming Meeting Reminder</h2>
        <p><strong>${b.event_title}</strong> with ${b.host_name}</p>
        <p>${startStr}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:1.5rem 0;"/>
        <p style="font-size:0.85rem;color:#666;">Need to cancel? <a href="${b.cancellation_token ? `/cancel/${b.cancellation_token}` : "#"}">Click here</a></p>
      </div>`;

      try {
        await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": env.BREVO_API_KEY,
          },
          body: JSON.stringify({
            sender: { name: "OpenSchedule", email: env.FROM_EMAIL || "noreply@openschedule.app" },
            to: [{ email: b.client_email }],
            subject,
            textContent: text,
            htmlContent: html,
          }),
        });

        // Mark reminder as sent
        await sql`UPDATE bookings SET reminder_sent = true WHERE id = ${b.id}`;

        // Log to telemetry
        const logId = crypto.randomUUID();
        await sql`
          INSERT INTO sent_emails_log (id, email_type, recipient, sent_at)
          VALUES (${logId}, 'reminder', ${b.client_email}, ${Math.floor(Date.now() / 1000)})
        `;

        sent++;
      } catch (err) {
        console.error(`Failed to send reminder for booking ${b.id}:`, err);
      }
    }

    console.log(`Sent ${sent}/${bookings.length} reminder emails.`);
  },
};
