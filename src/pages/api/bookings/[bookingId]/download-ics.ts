import type { APIRoute } from "astro";
import { query } from "@/db/neon";
import { generateIcs } from "@/lib/ics";

export const GET: APIRoute = async ({ params }) => {
  const { bookingId } = params;

  const [booking] = await query`
    SELECT b.id, b.start_time, b.end_time, b.client_notes,
           c.name AS client_name, c.email AS client_email,
           u.name AS host_name, u.email AS host_email,
           e.title AS event_title
    FROM bookings b
    JOIN clients c ON b.client_id = c.id
    JOIN event_types e ON b.event_type_id = e.id
    JOIN users u ON e.user_id = u.id
    WHERE b.id = ${bookingId} AND b.status = 'confirmed'
    LIMIT 1
  ` as any[];

  if (!booking) {
    return new Response("Not found", { status: 404 });
  }

  const ics = generateIcs({
    uid: booking.id,
    summary: `${booking.event_title} with ${booking.host_name}`,
    description: booking.client_notes || `Booked with ${booking.host_name}`,
    startTime: booking.start_time,
    endTime: booking.end_time,
    organizerName: booking.host_name,
    organizerEmail: booking.host_email,
    attendeeName: booking.client_name,
    attendeeEmail: booking.client_email,
  });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="booking-${bookingId}.ics"`,
    },
  });
};
