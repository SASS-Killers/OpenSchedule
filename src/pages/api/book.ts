import type { APIRoute } from "astro";
import { query } from "@/db/neon";
import { sendEmail, bookingConfirmationClientEmail, bookingNotificationHostEmail } from "@/lib/email";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { eventTypeId, startTime, clientName, clientEmail, notes } = body;

  if (!eventTypeId || !startTime || !clientName || !clientEmail) {
    return new Response(JSON.stringify({ error: "eventTypeId, startTime, clientName, clientEmail required" }), { status: 400 });
  }

  // Get event type
  const [evt] = await query`
    SELECT e.id, e.duration, e.title, e.user_id, u.name AS host_name, u.email AS host_email
    FROM event_types e
    JOIN users u ON e.user_id = u.id
    WHERE e.id = ${eventTypeId} AND e.is_active = true LIMIT 1
  ` as any[];
  if (!evt) return new Response(JSON.stringify({ error: "Event type not found" }), { status: 404 });

  const slotStart = Math.floor(startTime);
  const slotEnd = slotStart + evt.duration * 60;
  const now = Math.floor(Date.now() / 1000);

  // Race condition check
  const [conflict] = await query`
    SELECT id FROM bookings b
    JOIN event_types e ON b.event_type_id = e.id
    WHERE e.user_id = ${evt.user_id} AND b.status = 'confirmed'
    AND b.start_time < ${slotEnd} AND b.end_time > ${slotStart}
    LIMIT 1
  ` as any[];
  if (conflict) {
    return new Response(JSON.stringify({ error: "This slot is no longer available" }), { status: 409 });
  }

  // Auto-register client
  let [client] = await query`
    SELECT id, name FROM clients WHERE email = ${clientEmail} LIMIT 1
  ` as any[];

  if (!client) {
    const clientId = crypto.randomUUID();
    await query`
      INSERT INTO clients (id, email, name, created_at) VALUES (${clientId}, ${clientEmail}, ${clientName}, ${now})
    `;
    client = { id: clientId };
  }

  // Create booking
  const bookingId = crypto.randomUUID();
  const cancelToken = crypto.randomUUID();

  await query`
    INSERT INTO bookings (id, event_type_id, client_id, start_time, end_time, status, client_notes, cancellation_token, reminder_sent, created_at)
    VALUES (${bookingId}, ${eventTypeId}, ${client.id}, ${slotStart}, ${slotEnd}, 'confirmed', ${notes || null}, ${cancelToken}, false, ${now})
  `;

  // Format times for email
  const fmtDate = (ts: number) => new Date(ts * 1000).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
  const startStr = fmtDate(slotStart);
  const endStr = fmtDate(slotEnd);

  // Send confirmation to client
  const clientEmailData = bookingConfirmationClientEmail({
    clientName,
    hostName: evt.host_name,
    eventTitle: evt.title,
    startTime: startStr,
    endTime: endStr,
    cancellationUrl: `/cancel/${cancelToken}`,
  });
  await sendEmail({ to: clientEmail, ...clientEmailData });

  // Send notification to host
  const hostEmailData = bookingNotificationHostEmail({
    hostName: evt.host_name,
    clientName,
    clientEmail,
    eventTitle: evt.title,
    startTime: startStr,
    endTime: endStr,
  });
  await sendEmail({ to: evt.host_email, ...hostEmailData });

  return new Response(JSON.stringify({
    ok: true,
    bookingId,
    startTime: slotStart,
    endTime: slotEnd,
    cancellationUrl: `/cancel/${cancelToken}`,
  }), {
    headers: { "content-type": "application/json" },
  });
};
