import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { EmailTelemetry } from "@/admin/email-telemetry";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe("EmailTelemetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading initially", () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<EmailTelemetry />);
    expect(screen.getByText("Loading...")).toBeTruthy();
  });

  it("shows email count when loaded", async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ sentToday: 42 }), { status: 200 }));
    render(<EmailTelemetry />);
    await waitFor(() => expect(screen.getByText(/42 \/ 300 sent today/)).toBeTruthy());
    await waitFor(() => expect(screen.getByText(/258 remaining/)).toBeTruthy());
  });

  it("shows soft alert at 80%+ usage", async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ sentToday: 250 }), { status: 200 }));
    render(<EmailTelemetry />);
    await waitFor(() => expect(screen.getByText(/Soft alert/)).toBeTruthy());
  });

  it("shows hard stop alert at 95%+ usage", async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ sentToday: 290 }), { status: 200 }));
    render(<EmailTelemetry />);
    await waitFor(() => expect(screen.getByText(/Hard stop/)).toBeTruthy());
  });
});
