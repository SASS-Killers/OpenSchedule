import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { ScheduleEditor } from "@/host-dashboard/schedule-editor";

globalThis.fetch = vi.fn();

describe("ScheduleEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
  });

  afterEach(() => {
    cleanup();
  });

  it("renders all seven days", () => {
    render(<ScheduleEditor initial={[]} />);
    expect(screen.getByText("Monday")).toBeTruthy();
    expect(screen.getByText("Sunday")).toBeTruthy();
  });

  it("sets default times for weekdays when no initial data", () => {
    render(<ScheduleEditor initial={[]} />);
    // Monday through Friday should have time fields (Mon=0, Tue=1,...Fri=4)
    const textInputs = document.querySelectorAll("input[type='text']");
    // Mon-Fri = 10 inputs (2 per day), Sat-Sun = off
    expect(textInputs.length).toBe(10);
  });

  it("uses initial data when provided", () => {
    render(<ScheduleEditor initial={[{ dayOfWeek: 0, startTime: "08:00", endTime: "14:00" }]} />);
    const inputs = document.querySelectorAll("input[type='text']");
    // Monday should show 8:00a (displayTime format)
    const displayValues = Array.from(inputs).map((i) => (i as HTMLInputElement).value);
    expect(displayValues.some((v) => v.startsWith("8:00"))).toBe(true);
  });

  it("toggles a day on and off", () => {
    render(<ScheduleEditor initial={[]} />);
    // Saturday starts off (no initial data, day 5 is weekday so it gets defaults)
    // Saturday is day 5, Sunday is day 6 — both should be "Not available"
    const notAvail = screen.getAllByText("Not available");
    expect(notAvail.length).toBe(2); // Sat, Sun

    // Click Saturday to toggle it on
    const saturday = screen.getByText("Saturday");
    fireEvent.click(saturday);
    expect(screen.getAllByText("Not available").length).toBe(1); // Only Sunday

    // Click Saturday again to toggle off
    fireEvent.click(saturday);
    expect(screen.getAllByText("Not available").length).toBe(2);
  });

  it("shows time input fields when day is active", () => {
    render(<ScheduleEditor initial={[{ dayOfWeek: 0, startTime: "09:00", endTime: "17:00" }]} />);
    const inputs = document.querySelectorAll("input[type='text']");
    // Mon(2 from initial) + Tue-Fri defaults(8) = 10, Sat+Sun are off
    expect(inputs.length).toBe(10);
  });

  it("shows invalid time error on save with bad time", async () => {
    render(<ScheduleEditor initial={[]} />);
    // Find a time input and type an invalid value
    const inputs = document.querySelectorAll("input[type='text']");
    expect(inputs.length).toBe(10); // Mon-Fri
    // Clear first input
    fireEvent.change(inputs[0], { target: { value: "" } });
    // Blur it — empty string won't be parsed as valid
    fireEvent.blur(inputs[0]);
    // Click Save
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => {
      expect(screen.getByText(/Invalid time/)).toBeTruthy();
    });
  });

  it("save button is disabled when time is invalid", () => {
    render(<ScheduleEditor initial={[]} />);
    const inputs = document.querySelectorAll("input[type='text']");
    fireEvent.change(inputs[0], { target: { value: "" } });
    fireEvent.blur(inputs[0]);
    const saveBtn = screen.getByText("Save").closest("button") as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
  });

  it("shows Saving... during save", async () => {
    // Keep fetch pending
    globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    render(<ScheduleEditor initial={[]} />);
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(screen.getByText("Saving...")).toBeTruthy());
  });

  it("shows Saved indicator after save completes", async () => {
    render(<ScheduleEditor initial={[]} />);
    fireEvent.click(screen.getByText("Save"));
    // The async save calls await fetch, which resolves immediately (mocked),
    // then setSaved(true), then setTimeout to hide after 2s
    await waitFor(() => expect(screen.getByText("Saved")).toBeTruthy(), { timeout: 3000 });
  });

  it("parses time input on blur (9am → 09:00)", () => {
    render(<ScheduleEditor initial={[{ dayOfWeek: 0, startTime: "09:00", endTime: "17:00" }]} />);
    const inputs = document.querySelectorAll("input[type='text']");
    // Monday start time input
    fireEvent.change(inputs[0], { target: { value: "9a" } });
    fireEvent.blur(inputs[0]);
    // After blur, display should show "9:00a"
    // Focus back to see raw value
    fireEvent.focus(inputs[0]);
    expect((inputs[0] as HTMLInputElement).value).toBe("09:00");
  });

  it("parses various time formats on blur", () => {
    render(<ScheduleEditor initial={[{ dayOfWeek: 0, startTime: "09:00", endTime: "17:00" }]} />);
    const inputs = document.querySelectorAll("input[type='text']");

    // Test "3pm" → should show display "3:00p", raw "15:00"
    fireEvent.change(inputs[0], { target: { value: "3pm" } });
    fireEvent.blur(inputs[0]);
    fireEvent.focus(inputs[0]);
    expect((inputs[0] as HTMLInputElement).value).toBe("15:00");

    // After blur, display should be "3:00p"
    fireEvent.blur(inputs[0]);
    expect((inputs[0] as HTMLInputElement).value).toBe("3:00p");
  });

  it("shows display format when not focused", () => {
    render(<ScheduleEditor initial={[{ dayOfWeek: 0, startTime: "14:30", endTime: "17:00" }]} />);
    const inputs = document.querySelectorAll("input[type='text']");
    // Should show "2:30p" (display format) when not focused
    expect((inputs[0] as HTMLInputElement).value).toBe("2:30p");
  });

  it("shows raw value when focused", () => {
    render(<ScheduleEditor initial={[{ dayOfWeek: 0, startTime: "14:30", endTime: "17:00" }]} />);
    const inputs = document.querySelectorAll("input[type='text']");
    fireEvent.focus(inputs[0]);
    expect((inputs[0] as HTMLInputElement).value).toBe("14:30");
  });

  it("maintains invalid raw input on blur if parsing fails", () => {
    render(<ScheduleEditor initial={[{ dayOfWeek: 0, startTime: "09:00", endTime: "17:00" }]} />);
    const inputs = document.querySelectorAll("input[type='text']");
    fireEvent.change(inputs[0], { target: { value: "xyz" } });
    fireEvent.blur(inputs[0]);
    // parseTime("xyz") returns "" which is falsy, so blurTime keeps original
    // But TextField's onBlur sets focused=false, so it displays displayTime value
    // After blur, it shows displayTime of the stored value which is still "xyz"
    // Let's check directly: the raw state value in the component
    fireEvent.focus(inputs[0]);
    // parseTime("xyz") returns "" → "" || "xyz" = "xyz", so value stays "xyz"
    expect((inputs[0] as HTMLInputElement).value).toBe("xyz");
  });

  it("saves schedule with PUT request", async () => {
    render(<ScheduleEditor initial={[]} />);
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
      const call = (globalThis.fetch as any).mock.calls[0];
      expect(call[0]).toBe("/api/host/schedule");
      expect(call[1].method).toBe("PUT");
    });
  });

  it("sends correct body format on save", async () => {
    render(<ScheduleEditor initial={[{ dayOfWeek: 0, startTime: "09:00", endTime: "17:00" }]} />);
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => {
      const call = (globalThis.fetch as any).mock.calls.find((c: any) => c[0] === "/api/host/schedule");
      const body = JSON.parse(call[1].body);
      expect(Array.isArray(body)).toBe(true);
      expect(body[0].dayOfWeek).toBe(0);
    });
  });

  it("does not change day state when toggleDay called on already-toggled day", () => {
    // Toggle day off and on — state should be as expected
    render(<ScheduleEditor initial={[{ dayOfWeek: 0, startTime: "09:00", endTime: "17:00" }]} />);
    // Get initial count of time inputs
    const before = document.querySelectorAll("input[type='text']").length;

    // Toggle Monday off
    fireEvent.click(screen.getByText("Monday"));
    const afterOff = document.querySelectorAll("input[type='text']").length;
    expect(afterOff).toBe(before - 2); // 2 inputs removed

    // Toggle Monday back on
    fireEvent.click(screen.getByText("Monday"));
    const afterOn = document.querySelectorAll("input[type='text']").length;
    expect(afterOn).toBe(before);
  });
});
