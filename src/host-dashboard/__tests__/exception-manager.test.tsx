import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ExceptionManager } from "@/host-dashboard/exception-manager";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe("ExceptionManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(new Response("[]", { status: 200 }));
  });

  it("renders section titles", () => {
    render(<ExceptionManager />);
    expect(screen.getByText("Availability Exceptions")).toBeTruthy();
    expect(screen.getByText("Recurring Blocks")).toBeTruthy();
  });

  it("shows empty state messages", () => {
    render(<ExceptionManager />);
    expect(screen.getByText("No date-specific exceptions.")).toBeTruthy();
    expect(screen.getByText("No recurring exceptions.")).toBeTruthy();
  });

  it("opens date exception form", () => {
    render(<ExceptionManager />);
    fireEvent.click(screen.getByText("+ Date Exception"));
    expect(screen.getByText("Create")).toBeTruthy();
    expect(screen.getByPlaceholderText("Start date")).toBeTruthy();
  });

  it("opens recurring exception form", () => {
    render(<ExceptionManager />);
    fireEvent.click(screen.getByText("+ Recurring Exception"));
    expect(screen.getByText("Create")).toBeTruthy();
  });

  it("closes date exception form with Cancel", () => {
    render(<ExceptionManager />);
    fireEvent.click(screen.getByText("+ Date Exception"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Create")).toBeFalsy();
  });

  it("disables create button when dates are empty", () => {
    render(<ExceptionManager />);
    fireEvent.click(screen.getByText("+ Date Exception"));
    const btn = screen.getByText("Create") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("shows list of overrides when API returns data", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            id: "1",
            exception_type: "full_day_block",
            start_date: "2026-07-01",
            end_date: "2026-07-15",
            start_time: null,
            end_time: null,
            title: "Vacation",
            is_active: true,
          },
        ]),
        { status: 200 },
      ),
    );
    render(<ExceptionManager />);
    await waitFor(() => expect(screen.getByText(/Vacation/)).toBeTruthy());
    await waitFor(() => expect(screen.getByText("Delete")).toBeTruthy());
  });

  it("shows list of recurring exceptions when API returns data", async () => {
    mockFetch
      .mockResolvedValueOnce(new Response("[]", { status: 200 })) // overrides
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: "r1",
              exception_type: "window_block",
              day_of_week: 2,
              start_time: "10:00",
              end_time: "11:00",
              title: "Standup",
              is_active: true,
              effective_start: null,
              effective_end: null,
            },
          ]),
          { status: 200 },
        ),
      ); // recurring
    render(<ExceptionManager />);
    await waitFor(() => expect(screen.getByText(/Standup/)).toBeTruthy());
  });
});
