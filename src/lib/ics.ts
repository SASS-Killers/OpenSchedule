// iCalendar (RFC 5545) generator for booking confirmations
export function generateIcs({
  uid,
  summary,
  description,
  startTime,
  endTime,
  organizerName,
  organizerEmail,
  attendeeName,
  attendeeEmail,
  location,
}: {
  uid: string;
  summary: string;
  description?: string;
  startTime: number; // Unix seconds
  endTime: number; // Unix seconds
  organizerName: string;
  organizerEmail: string;
  attendeeName: string;
  attendeeEmail: string;
  location?: string;
}): string {
  const fmt = (ts: number) => {
    const d = new Date(ts * 1000);
    return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OpenSchedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}@openschedule.app`,
    `DTSTART:${fmt(startTime)}`,
    `DTEND:${fmt(endTime)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${(description || "").replace(/\n/g, "\\n")}`,
    `ORGANIZER;CN=${organizerName}:mailto:${organizerEmail}`,
    `ATTENDEE;CN=${attendeeName}:mailto:${attendeeEmail}`,
    location ? `LOCATION:${location}` : "",
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: ${summary}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.filter(Boolean).join("\r\n");
}
