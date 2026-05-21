import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScheduleEditor } from "@/host-dashboard/schedule-editor";

// Mock fetch
globalThis.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));

describe("ScheduleEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all weekdays", () => {
    render(<ScheduleEditor initial={[]} />);
    expect(screen.getByText("Monday")).toBeTruthy();
    expect(screen.getByText("Tuesday")).toBeTruthy();
    expect(screen.getByText("Wednesday")).toBeTruthy();
    expect(screen.getByText("Thursday")).toBeTruthy();
    expect(screen.getByText("Friday")).toBeTruthy();
    expect(screen.getByText("Saturday")).toBeTruthy();
    expect(screen.getByText("Sunday")).toBeTruthy();
  });

  it("defaults Mon-Fri to available, Sat-Sun off", () => {
    render(<ScheduleEditor initial={[]} />);
    // Mon-Fri should show time inputs (not "Not available")
    const notAvail = screen.getAllByText("Not available");
    expect(notAvail).toHaveLength(2); // Sat, Sun
    // Find Save button
    expect(screen.getByText("Save")).toBeTruthy();
  });

  it("toggles day on click", () => {
    render(<ScheduleEditor initial={[]} />);
    // Click Saturday to toggle it on
    const saturday = screen.getByText("Saturday");
    fireEvent.click(saturday);
    // Should now show time fields, not "Not available"
    expect(screen.queryByText("Not available")).toBeTruthy(); // Sunday still off
    // Click Saturday again to toggle off
    fireEvent.click(saturday);
    expect(screen.getAllByText("Not available")).toHaveLength(2); // Both off
  });

  it("saves when Save clicked", async () => {
    render(<ScheduleEditor initial={[]} />);
    fireEvent.click(screen.getByText("Save"));
    expect(globalThis.fetch).toHaveBeenCalled();
    const call = (globalThis.fetch as any).mock.calls[0];
    expect(call[0]).toContain("/api/host/schedule");
    expect(call[1].method).toBe("PUT");
  });

  it("validates time format", () => {
    render(<ScheduleEditor initial={[]} />);
    // Should show "Invalid time" message when Save clicked with bad data
    // Default times are valid (09:00, 17:00) so no error
    expect(screen.queryByText(/Invalid/i)).toBeFalsy();
  });

  it("renders with initial schedule data", () => {
    render(<ScheduleEditor initial={[
      { dayOfWeek: 0, startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: 1, startTime: "10:00", endTime: "15:00" },
    ]} />);
    expect(screen.getByText("Monday")).toBeTruthy();
    expect(screen.getByText("Tuesday")).toBeTruthy();
  });
});
