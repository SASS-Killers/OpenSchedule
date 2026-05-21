import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EventTypeManager } from "@/host-dashboard/event-type-manager";

// Mock fetch for PostgREST calls
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe("EventTypeManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: empty list response
    mockFetch.mockResolvedValue(new Response("[]", { status: 200 }));
  });

  it("loads event types on mount", async () => {
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify([
      { id: "1", title: "30 Min Call", slug: "30min", duration: 30, is_active: 1 },
    ]), { status: 200 }));
    render(<EventTypeManager />);
    // Wait for load
    await new Promise((r) => setTimeout(r, 100));
    expect(screen.getByText("30 Min Call")).toBeTruthy();
    expect(mockFetch).toHaveBeenCalled();
  });

  it("shows empty state when no event types", () => {
    render(<EventTypeManager />);
    expect(screen.getByText(/No event types/i)).toBeTruthy();
  });

  it("opens form on New Event Type click", async () => {
    render(<EventTypeManager />);
    fireEvent.click(screen.getByText("+ New Event Type"));
    expect(screen.getByText("Create")).toBeTruthy();
    expect(screen.getByPlaceholderText(/e\.g\. 30 Minute Call/)).toBeTruthy();
  });

  it("closes form on Cancel", async () => {
    render(<EventTypeManager />);
    fireEvent.click(screen.getByText("+ New Event Type"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.getByText("+ New Event Type")).toBeTruthy();
  });

  it("deletes an event type", async () => {
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify([
        { id: "1", title: "Test Type", slug: "test", duration: 30, is_active: 1 },
      ]), { status: 200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    render(<EventTypeManager />);
    await new Promise((r) => setTimeout(r, 100));
    const deleteBtn = screen.getByText("Delete");
    fireEvent.click(deleteBtn);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
