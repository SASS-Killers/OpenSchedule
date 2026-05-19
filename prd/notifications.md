# PRD Section 6: Notifications & Background Cron Jobs

OpenSchedule leverages lightweight, transactional notifications and a scheduled edge cron job to manage client communication effortlessly while strictly respecting free-tier limits.

---

## 1. Notification Types & Triggers

Transactional emails are automatically dispatched via **Brevo** (primary) or **Resend** (alternative) when specific application actions are executed.

### 1.1 Passwordless Login OTP (Magic Code)
* **Trigger**: Host or Admin inputs their email on the `/login` page.
* **Recipient**: The user attempting to log in.
* **Payload**: A simple, clear HTML block showing the 6-digit verification code.
* **Template**:
  > **Subject**: Your OpenSchedule Login Code
  >
  > Hello,
  >
  > Here is your secure 6-digit login verification code: **[6-Digit Code]**.
  > This code will expire in 10 minutes. If you did not request this, you can safely ignore this email.

### 1.2 Booking Confirmation
* **Trigger**: Client successfully reserves a dynamic slot.
* **Recipient 1: Client**:
  * **Payload**: Meeting confirmation details, local timezone conversion representation, location link (e.g. Google Meet), cancellation link, and the `.ics` file attached.
* **Recipient 2: Host**:
  * **Payload**: Details of the booked event, Client's email, name, and notes.

### 1.3 Booking Cancellation
* **Trigger**: Host or Client clicks "Cancel Meeting" via the dashboard or specialized email cancellation link.
* **Recipient 1: Client & Recipient 2: Host**:
  * **Payload**: Confirmation that the specific session has been marked as cancelled in the system. The calendar invite is removed dynamically.

---

## 2. Daily Reminders Background Job

A daily background process runs to alert Clients of their upcoming appointments scheduled for the following day.

### 2.1 Trigger Execution
* **Scheduler**: **Cloudflare Workers Cron Triggers** running at `08:00 UTC` daily.
* **Worker Routing**: Triggers a secure, internal API endpoint (secured via a secret header token `CRON_SECRET` to prevent public execution).

### 2.2 Notifier Query Logic
The Cron Worker initiates a sequence in D1:
1. **Target Selection**:
   ```sql
   SELECT b.id, b.start_time, c.email AS client_email, c.name AS client_name, 
          u.name AS host_name, e.title AS event_title, u.timezone AS host_timezone
   FROM bookings b
   JOIN clients c ON b.client_id = c.id
   JOIN event_types e ON b.event_type_id = e.id
   JOIN users u ON e.user_id = u.id
   WHERE b.status = 'confirmed'
     AND b.reminder_sent = 0
     AND b.start_time BETWEEN ? AND ?;
   ```
   * *Time Bound*: Between `now + 12 hours` and `now + 36 hours` from the current execution time.
2. **Notification Dispatch**:
   * For each booking matching the criteria, format a friendly email:
     > **Subject**: Reminder: Your session tomorrow with [Host Name]
     >
     > Hello [Client Name],
     >
     > This is a friendly reminder that you are scheduled for **[Event Title]** tomorrow, starting at **[Formated Time in Host Timezone]**.
     >
     > If you need to make changes, you can manage your reservation here: [Cancellation Link].
     * Trigger the Brevo REST API to deliver the email.
3. **Database Flag Update**:
   * Once successfully sent to Brevo, execute a database write to set `reminder_sent = 1` for that booking to prevent duplicate dispatching.

---

## 3. Local Email Telemetry & Admin Dashboard Tracking

Because email providers (Brevo, Resend, etc.) do not expose a real-time, lightweight usage quota API suitable for edge-function polling, OpenSchedule incorporates an **In-App Email Telemetry Engine** backed by the `sent_emails_log` table in D1.

### 3.1 Write Logging
Every single email dispatched by the application (OTPs, confirmations, reminders, and cancellations) must write a record to D1 immediately upon a successful response from the Brevo API:
```sql
INSERT INTO sent_emails_log (id, email_type, recipient, sent_at)
VALUES (UUID(), 'otp' | 'confirmation' | 'reminder' | 'cancellation', recipient_email, current_unix_timestamp);
```

### 3.2 Admin Dashboard Telemetry Panel
The Admin Dashboard contains a dedicated **Email Quota & Telemetry** widget:
* **Metric Calculation**: The server queries D1 for the number of emails sent during the current calendar day (in UTC or configured system timezone):
  ```sql
  SELECT COUNT(*) AS emails_sent_today 
  FROM sent_emails_log 
  WHERE sent_at >= [Start of Today UTC Unix Timestamp];
  ```
* **Visual Gauges**:
  * **Daily Usage Status**: Renders a progress bar showing `[emails_sent_today] / 100` emails used today.
  * **Daily Margin**: Highlights the count of remaining free messages: `[100 - emails_sent_today]`.
  * **Historical Tracking**: A mini weekly trend graph showing previous days' volume to identify scheduling peak loads.

---

## 4. Free-Tier Safeguards & Hard Throttling

To prevent serverless edge functions from exceeding the **Brevo 300 emails/day** ceiling (which would result in silent notification failures or API error spam):

* **The Quota Check Interceptor**: Every notification trigger in the application first queries D1 for `emails_sent_today`.
* **Soft Alert (80% Boundary)**:
   * When `emails_sent_today >= 240`, a persistent, highly visible warning banner appears on the Admin Dashboard: *"Brevo daily free tier limit at 80% (240/300). Consider upgrading to Brevo Starter or staggering non-urgent reminders."*
* **Hard Stop & Throttling (95% Boundary)**:
  * When `emails_sent_today >= 95`, the system **suspends all automated daily reminders** to reserve the remaining 5 emails for critical transactional needs (such as Admin/Host login OTP codes).
  * If a client attempts a new booking, the booking completes successfully, but the confirmation email queue behaves defensively (a modal instructs the client to download their `.ics` file instantly as an alternative confirmation).
* **Fail-Safe Logging**: All notification dispatches (confirmations, OTPs, reminders) are logged with statuses inside the edge functions console, facilitating easy troubleshooting.
* **Fallbacks**: If the mailer fails (e.g. SMTP/API timeout), the `reminder_sent` flag remains `0` and no telemetry log is written, allowing retry options.
