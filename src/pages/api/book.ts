import type { APIRoute } from "astro";
import { query, raw } from "@/db/neon";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { eventTypeId, startTime, clientName, clientEmail, notes } = body;

  if (!eventTypeId || !startTime || !clientName || !clientEmail) {
    return new Response(JSON.stringify({ error: "eventTypeId, startTime, clientName, clientEmail required" }), { status: 400 });
  }

  // Get event type
  const [evt] = await query`
    SELECT id, duration, user_id FROM event_types WHERE id = ${eventTypeId} AND is_active = true LIMIT 1
  ` as any[];
  if (!evt) return new Response(JSON.stringify({ error: "Event type not found" }), { status: 404 });

  const slotStart = Math.floor(startTime);
  const slotEnd = slotStart + evt.duration * 60;
  const now = Math.floor(Date.now() / 1000);

  // Race condition check — verify slot is still free
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
