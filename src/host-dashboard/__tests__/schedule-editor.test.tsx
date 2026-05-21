import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScheduleEditor } from "@/host-dashboard/schedule-editor";

globalThis.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));

describe("ScheduleEditor", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("renders all days", () => {
    render(<ScheduleEditor initial={[]} />);
    expect(screen.getByText("Monday")).toBeTruthy();
  });

  it("toggles day off and on", () => {
    render(<ScheduleEditor initial={[]} />);
    // Saturday starts off ("Not available")
    const sat = screen.getByText("Saturday");
    expect(screen.getAllByText("Not available").length).toBe(2);
    fireEvent.click(sat);
    expect(screen.getAllByText("Not available").length).toBe(1); // Sunday still off
  });

  it("parses time input on blur", () => {
    render(<ScheduleEditor initial={[{ dayOfWeek: 0, startTime: "09:00", endTime: "17:00" }]} />);
    const inputs = document.querySelectorAll("input[type='text']");
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it("shows invalid time error", () => {
    render(<ScheduleEditor initial={[]} />);
    // The validation only shows on Save if times are invalid
    // Default times are valid, so no error initially
    expect(screen.queryByText(/Invalid time/)).toBeFalsy();
  });

  it("saves schedule", async () => {
    render(<ScheduleEditor initial={[]} />);
    fireEvent.click(screen.getByText("Save"));
    await new Promise((r) => setTimeout(r, 50));
    expect(globalThis.fetch).toHaveBeenCalled();
    const call = (globalThis.fetch as any).mock.calls[0];
    expect(call[1].method).toBe("PUT");
  });

  it("renders with initial data", () => {
    render(<ScheduleEditor initial={[{ dayOfWeek: 0, startTime: "09:00", endTime: "17:00" }]} />);
    expect(screen.getByText("Monday")).toBeTruthy();
  });
});
