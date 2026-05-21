import { describe, it, expect } from "vitest";
import {
  otpEmail,
  bookingConfirmationClientEmail,
  bookingNotificationHostEmail,
  cancellationEmail,
  welcomeHostEmail,
} from "@/lib/email";

describe("email templates", () => {
  it("otpEmail includes the code", () => {
    const { subject, text, html } = otpEmail("849201");
    expect(subject).toContain("Login Code");
    expect(text).toContain("849201");
    expect(html).toContain("849201");
    expect(html).toContain("10 minutes");
  });

  it("bookingConfirmationClientEmail has event details", () => {
    const { subject, text } = bookingConfirmationClientEmail({
      clientName: "Alice",
      hostName: "Bob",
      eventTitle: "30 Min Call",
      startTime: "May 21, 9:00am",
      endTime: "9:30am",
      cancellationUrl: "/cancel/abc",
    });
    expect(subject).toContain("30 Min Call");
    expect(subject).toContain("Bob");
    expect(text).toContain("Alice");
    expect(text).toContain("/cancel/abc");
  });

  it("bookingNotificationHostEmail has client info", () => {
    const { subject, text } = bookingNotificationHostEmail({
      hostName: "Bob",
      clientName: "Alice",
      clientEmail: "alice@test.com",
      eventTitle: "Consultation",
      startTime: "May 21, 2:00pm",
      endTime: "2:30pm",
    });
    expect(subject).toContain("Consultation");
    expect(subject).toContain("Alice");
    expect(text).toContain("alice@test.com");
  });

  it("cancellationEmail confirms cancellation", () => {
    const { subject, text } = cancellationEmail({
      name: "Alice",
      eventTitle: "Strategy Session",
      startTime: "May 22, 10:00am",
    });
    expect(subject).toContain("Cancelled");
    expect(subject).toContain("Strategy Session");
    expect(text).toContain("Alice");
  });

  it("welcomeHostEmail includes login instructions", () => {
    const { subject, text, html } = welcomeHostEmail({
      name: "Charlie",
      email: "charlie@test.com",
    });
    expect(subject).toContain("Welcome");
    expect(text).toContain("Charlie");
    expect(text).toContain("charlie@test.com");
    expect(html).toContain("charlie@test.com");
  });
});
