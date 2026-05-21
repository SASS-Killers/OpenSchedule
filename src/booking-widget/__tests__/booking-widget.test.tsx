import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BookingWidget } from "@/booking-widget/booking-widget";

globalThis.fetch = vi.fn();

/**
 * Navigate to a future month by clicking → enough times.
 * Then click a specific day number in that month.
 */
function gotoFutureDay(dayNum: number) {
  // Navigate forward 2 months to be safe
  fireEvent.click(screen.getByText("→"));
  fireEvent.click(screen.getByText("→"));
  // Click the requested day number
  fireEvent.click(screen.getByText(String(dayNum)));
}

describe("BookingWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders calendar nav and day headers", () => {
    render(<BookingWidget hostId="h1" eventTypeId="e1" />);
    expect(screen.getByText("←")).toBeTruthy();
    expect(screen.getByText("→")).toBeTruthy();
    expect(screen.getByText("Su")).toBeTruthy();
    expect(screen.getByText("Mo")).toBeTruthy();
  });

  it("shows current month and year", () => {
    render(<BookingWidget hostId="h1" eventTypeId="e1" />);
    const today = new Date();
    const monthName = today.toLocaleString("default", { month: "long" });
    expect(screen.getByText(new RegExp(monthName))).toBeTruthy();
    expect(screen.getByText(new RegExp(String(today.getFullYear())))).toBeTruthy();
  });

  it("navigates to next month", () => {
    render(<BookingWidget hostId="h1" eventTypeId="e1" />);
    const today = new Date();
    const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const nextMonth = nextMonthDate.toLocaleString("default", { month: "long" });
    fireEvent.click(screen.getByText("→"));
    expect(screen.getByText(new RegExp(nextMonth))).toBeTruthy();
  });

  it("navigates to previous month", () => {
    render(<BookingWidget hostId="h1" eventTypeId="e1" />);
    const today = new Date();
    const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevMonth = prevMonthDate.toLocaleString("default", { month: "long" });
    fireEvent.click(screen.getByText("←"));
    expect(screen.getByText(new RegExp(prevMonth))).toBeTruthy();
  });

  it("shows no available slots when fetch returns empty", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ slots: [] }), { status: 200 }));
    render(<BookingWidget hostId="h1" eventTypeId="e1" />);
    gotoFutureDay(15);
    await waitFor(() => expect(screen.getByText(/No available slots/)).toBeTruthy(), { timeout: 3000 });
  });

  it("displays slot times when available", async () => {
    const ts = Math.floor(Date.now() / 1000) + 86400 * 5;
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ slots: [ts] }), { status: 200 }));
    render(<BookingWidget hostId="h1" eventTypeId="e1" />);
    gotoFutureDay(15);
    await waitFor(
      () => {
        const slotBtns = Array.from(document.querySelectorAll("button")).filter((b) =>
          /\d+:\d+[ap]/.test(b.textContent || ""),
        );
        expect(slotBtns.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );
  });

  it("shows booking form when slot is selected", async () => {
    const ts = Math.floor(Date.now() / 1000) + 86400 * 5;
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ slots: [ts] }), { status: 200 }));
    render(<BookingWidget hostId="h1" eventTypeId="e1" />);
    gotoFutureDay(15);
    await waitFor(
      () => {
        const slotBtns = Array.from(document.querySelectorAll("button")).filter((b) =>
          /\d+:\d+[ap]/.test(b.textContent || ""),
        );
        if (slotBtns.length > 0) fireEvent.click(slotBtns[0]);
        expect(slotBtns.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );
    await waitFor(() => expect(screen.getByPlaceholderText("Your name")).toBeTruthy(), { timeout: 3000 });
  });

  it("disables confirm when name and email are empty", async () => {
    const ts = Math.floor(Date.now() / 1000) + 86400 * 5;
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ slots: [ts] }), { status: 200 }));
    render(<BookingWidget hostId="h1" eventTypeId="e1" />);
    gotoFutureDay(15);
    await waitFor(
      () => {
        const slotBtns = Array.from(document.querySelectorAll("button")).filter((b) =>
          /\d+:\d+[ap]/.test(b.textContent || ""),
        );
        if (slotBtns.length > 0) fireEvent.click(slotBtns[0]);
        expect(slotBtns.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );
    await waitFor(
      () => {
        const btn = screen.getByText("Confirm Booking") as HTMLButtonElement;
        expect(btn.disabled).toBe(true);
      },
      { timeout: 3000 },
    );
  });

  it("completes full booking flow", async () => {
    const ts = Math.floor(Date.now() / 1000) + 86400 * 5;
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ slots: [ts] }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ ok: true, startTime: ts, endTime: ts + 1800, cancellationUrl: "/cancel/tok123" }),
          { status: 200 },
        ),
      );
    render(<BookingWidget hostId="h1" eventTypeId="e1" />);
    gotoFutureDay(15);
    await waitFor(
      () => {
        const slotBtns = Array.from(document.querySelectorAll("button")).filter((b) =>
          /\d+:\d+[ap]/.test(b.textContent || ""),
        );
        if (slotBtns.length > 0) fireEvent.click(slotBtns[0]);
        expect(slotBtns.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );
    await waitFor(() => expect(screen.getByPlaceholderText("Your name")).toBeTruthy(), { timeout: 3000 });
    fireEvent.change(screen.getByPlaceholderText("Your name"), { target: { value: "Alice" } });
    fireEvent.change(screen.getByPlaceholderText("Your email"), { target: { value: "alice@test.com" } });
    fireEvent.click(screen.getByText("Confirm Booking"));
    await waitFor(
      async () => {
        expect(screen.getByText("Booking Confirmed")).toBeTruthy();
      },
      { timeout: 3000 },
    );
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/book", expect.objectContaining({ method: "POST" }));
  });

  it("shows cancellation URL after booking", async () => {
    const ts = Math.floor(Date.now() / 1000) + 86400 * 5;
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ slots: [ts] }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ ok: true, startTime: ts, endTime: ts + 1800, cancellationUrl: "/cancel/tok999" }),
          { status: 200 },
        ),
      );
    render(<BookingWidget hostId="h1" eventTypeId="e1" />);
    gotoFutureDay(15);
    await waitFor(
      () => {
        const slotBtns = Array.from(document.querySelectorAll("button")).filter((b) =>
          /\d+:\d+[ap]/.test(b.textContent || ""),
        );
        if (slotBtns.length > 0) fireEvent.click(slotBtns[0]);
        expect(slotBtns.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );
    await waitFor(() => expect(screen.getByPlaceholderText("Your name")).toBeTruthy(), { timeout: 3000 });
    fireEvent.change(screen.getByPlaceholderText("Your name"), { target: { value: "Alice" } });
    fireEvent.change(screen.getByPlaceholderText("Your email"), { target: { value: "alice@test.com" } });
    fireEvent.click(screen.getByText("Confirm Booking"));
    await waitFor(() => expect(screen.getByText(/cancel\/tok999/)).toBeTruthy(), { timeout: 3000 });
  });

  it("shows error when booking fails", async () => {
    const ts = Math.floor(Date.now() / 1000) + 86400 * 5;
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ slots: [ts] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "Slot taken" }), { status: 409 }));
    render(<BookingWidget hostId="h1" eventTypeId="e1" />);
    gotoFutureDay(15);
    await waitFor(
      () => {
        const slotBtns = Array.from(document.querySelectorAll("button")).filter((b) =>
          /\d+:\d+[ap]/.test(b.textContent || ""),
        );
        if (slotBtns.length > 0) fireEvent.click(slotBtns[0]);
        expect(slotBtns.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );
    await waitFor(() => expect(screen.getByPlaceholderText("Your name")).toBeTruthy(), { timeout: 3000 });
    fireEvent.change(screen.getByPlaceholderText("Your name"), { target: { value: "Bob" } });
    fireEvent.change(screen.getByPlaceholderText("Your email"), { target: { value: "bob@test.com" } });
    fireEvent.click(screen.getByText("Confirm Booking"));
    await waitFor(() => expect(screen.getByText("Slot taken")).toBeTruthy(), { timeout: 3000 });
  });

  it("shows network error when booking request throws", async () => {
    const ts = Math.floor(Date.now() / 1000) + 86400 * 5;
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ slots: [ts] }), { status: 200 }))
      .mockRejectedValueOnce(new Error("Network error"));
    render(<BookingWidget hostId="h1" eventTypeId="e1" />);
    gotoFutureDay(15);
    await waitFor(
      () => {
        const slotBtns = Array.from(document.querySelectorAll("button")).filter((b) =>
          /\d+:\d+[ap]/.test(b.textContent || ""),
        );
        if (slotBtns.length > 0) fireEvent.click(slotBtns[0]);
        expect(slotBtns.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );
    await waitFor(() => expect(screen.getByPlaceholderText("Your name")).toBeTruthy(), { timeout: 3000 });
    fireEvent.change(screen.getByPlaceholderText("Your name"), { target: { value: "Carol" } });
    fireEvent.change(screen.getByPlaceholderText("Your email"), { target: { value: "carol@test.com" } });
    fireEvent.click(screen.getByText("Confirm Booking"));
    await waitFor(() => expect(screen.getByText("Network error")).toBeTruthy(), { timeout: 3000 });
  });

  it("sends notes with booking request", async () => {
    const ts = Math.floor(Date.now() / 1000) + 86400 * 5;
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ slots: [ts] }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, startTime: ts, endTime: ts + 1800, cancellationUrl: "/cancel/t" }), {
          status: 200,
        }),
      );
    render(<BookingWidget hostId="h1" eventTypeId="e1" />);
    gotoFutureDay(15);
    await waitFor(
      () => {
        const slotBtns = Array.from(document.querySelectorAll("button")).filter((b) =>
          /\d+:\d+[ap]/.test(b.textContent || ""),
        );
        if (slotBtns.length > 0) fireEvent.click(slotBtns[0]);
        expect(slotBtns.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );
    await waitFor(() => expect(screen.getByPlaceholderText("Your name")).toBeTruthy(), { timeout: 3000 });
    fireEvent.change(screen.getByPlaceholderText("Your name"), { target: { value: "Dan" } });
    fireEvent.change(screen.getByPlaceholderText("Your email"), { target: { value: "dan@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("Notes (optional)"), { target: { value: "Afternoon please" } });
    fireEvent.click(screen.getByText("Confirm Booking"));
    await waitFor(
      () => {
        const bookCall = (globalThis.fetch as any).mock.calls.find((c: any) => c[0] === "/api/book");
        expect(bookCall).toBeTruthy();
        const body = JSON.parse(bookCall[1].body);
        expect(body.notes).toBe("Afternoon please");
      },
      { timeout: 3000 },
    );
  });

  it("fetches slots via API when a date is selected", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ slots: [] }), { status: 200 }));
    render(<BookingWidget hostId="h1" eventTypeId="e1" />);
    gotoFutureDay(15);
    await waitFor(
      () => {
        expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/slots?hostId=h1&eventTypeId=e1"));
      },
      { timeout: 3000 },
    );
  });

  it("enables confirm button when form is filled", async () => {
    const ts = Math.floor(Date.now() / 1000) + 86400 * 5;
    globalThis.fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ slots: [ts] }), { status: 200 }));
    render(<BookingWidget hostId="h1" eventTypeId="e1" />);
    gotoFutureDay(15);
    await waitFor(
      () => {
        const slotBtns = Array.from(document.querySelectorAll("button")).filter((b) =>
          /\d+:\d+[ap]/.test(b.textContent || ""),
        );
        if (slotBtns.length > 0) fireEvent.click(slotBtns[0]);
        expect(slotBtns.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );
    await waitFor(
      () => {
        const btn = screen.getByText("Confirm Booking") as HTMLButtonElement;
        expect(btn.disabled).toBe(true);
      },
      { timeout: 3000 },
    );
    fireEvent.change(screen.getByPlaceholderText("Your name"), { target: { value: "Frank" } });
    fireEvent.change(screen.getByPlaceholderText("Your email"), { target: { value: "frank@test.com" } });
    await waitFor(
      () => {
        const btn = screen.getByText("Confirm Booking") as HTMLButtonElement;
        expect(btn.disabled).toBe(false);
      },
      { timeout: 3000 },
    );
  });
});
