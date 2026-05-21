import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TimezonePicker } from "@/host-dashboard/timezone-picker";

globalThis.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));

describe("TimezonePicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with initial value", () => {
    render(<TimezonePicker value="America/New_York" />);
    const input = document.querySelector("input");
    expect(input).toBeTruthy();
  });

  it("shows results on search", async () => {
    render(<TimezonePicker value="America/New_York" />);
    const input = document.querySelector("input")!;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "los" } });
    await new Promise((r) => setTimeout(r, 200));
    expect(screen.getByText("America/Los Angeles")).toBeTruthy();
  });

  it("selects timezone on click", async () => {
    let selected = "";
    render(
      <TimezonePicker
        value="America/New_York"
        onChange={(tz: string) => {
          selected = tz;
        }}
      />,
    );
    const input = document.querySelector("input")!;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "los" } });
    await new Promise((r) => setTimeout(r, 200));
    const option = screen.getByText("America/Los Angeles");
    fireEvent.mouseDown(option);
    await new Promise((r) => setTimeout(r, 100));
    expect(selected).toBe("America/Los_Angeles");
  });

  it("auto-saves when no onChange provided", async () => {
    render(<TimezonePicker value="UTC" />);
    const input = document.querySelector("input")!;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "new" } });
    await new Promise((r) => setTimeout(r, 200));
    const option = screen.getByText("America/New York");
    fireEvent.mouseDown(option);
    await new Promise((r) => setTimeout(r, 100));
    expect(globalThis.fetch).toHaveBeenCalled();
  });
});
