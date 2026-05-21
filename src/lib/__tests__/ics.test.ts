import { describe, it, expect } from "vitest";
import { generateIcs } from "@/lib/ics";

describe("generateIcs", () => {
  const base = {
    uid: "abc-123",
    summary: "30 Min Call with John",
    description: "Discuss project timeline",
    startTime: 1779606000,
    endTime: 1779607800,
    organizerName: "John Host",
    organizerEmail: "john@host.com",
    attendeeName: "Alice Client",
    attendeeEmail: "alice@client.com",
  };

  it("returns a valid VCALENDAR string", () => {
    const ics = generateIcs(base);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
  });

  it("includes VEVENT with UID", () => {
    const ics = generateIcs(base);
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("UID:abc-123@openschedule.app");
  });

  it("formats DTSTART and DTEND", () => {
    const ics = generateIcs(base);
    expect(ics).toContain("DTSTART:");
    expect(ics).toContain("DTEND:");
    // Should be in ISO format without separators: YYYYMMDDTHHMMSSZ
    expect(ics).toMatch(/DTSTART:20\d{6}T\d{6}Z/);
  });

  it("includes SUMMARY and DESCRIPTION", () => {
    const ics = generateIcs(base);
    expect(ics).toContain("SUMMARY:30 Min Call with John");
    expect(ics).toContain("DESCRIPTION:Discuss project timeline");
  });

  it("includes ORGANIZER and ATTENDEE", () => {
    const ics = generateIcs(base);
    expect(ics).toContain("ORGANIZER;CN=John Host:mailto:john@host.com");
    expect(ics).toContain("ATTENDEE;CN=Alice Client:mailto:alice@client.com");
  });

  it("includes VALARM reminder", () => {
    const ics = generateIcs(base);
    expect(ics).toContain("BEGIN:VALARM");
    expect(ics).toContain("TRIGGER:-PT15M");
    expect(ics).toContain("ACTION:DISPLAY");
    expect(ics).toContain("END:VALARM");
  });

  it("includes LOCATION when provided", () => {
    const ics = generateIcs({ ...base, location: "Virtual" });
    expect(ics).toContain("LOCATION:Virtual");
  });

  it("omits LOCATION when not provided", () => {
    const ics = generateIcs(base);
    expect(ics).not.toContain("LOCATION:");
  });

  it("uses CRLF line endings", () => {
    const ics = generateIcs(base);
    expect(ics).toContain("\r\n");
  });

  it("escapes newlines in DESCRIPTION", () => {
    const ics = generateIcs({ ...base, description: "Line 1\nLine 2" });
    expect(ics).toContain("DESCRIPTION:Line 1\\nLine 2");
  });

  it("handles empty description", () => {
    const ics = generateIcs({ ...base, description: undefined });
    expect(ics).toContain("DESCRIPTION:");
  });
});
