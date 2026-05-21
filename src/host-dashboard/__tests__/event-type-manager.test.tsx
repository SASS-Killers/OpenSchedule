import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EventTypeManager } from "@/host-dashboard/event-type-manager";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe("EventTypeManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(new Response("[]", { status: 200 }));
  });

  it("loads and shows list", async () => {
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify([
      { id: "1", title: "30 Min", slug: "30min", duration: 30, is_active: 1 },
    ]), { status: 200 }));
    render(<EventTypeManager />);
    await waitFor(() => expect(screen.getByText("30 Min")).toBeTruthy());
  });

  it("shows empty state", () => {
    render(<EventTypeManager />);
    expect(screen.getByText(/No event types/i)).toBeTruthy();
  });

  it("opens and closes form", async () => {
    render(<EventTypeManager />);
    fireEvent.click(screen.getByText("+ New Event Type"));
    expect(screen.getByText("Create")).toBeTruthy();
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Create")).toBeFalsy();
  });

  it("creates a new event type", async () => {
    mockFetch.mockResolvedValueOnce(new Response("[]", { status: 200 }));
    render(<EventTypeManager />);
    fireEvent.click(screen.getByText("+ New Event Type"));
    const inputs = document.querySelectorAll<HTMLInputElement>("input[type='text']");
    const titleInput = Array.from(inputs).find(i => i.placeholder.includes("30 Minute"));
    if (titleInput) fireEvent.change(titleInput, { target: { value: "Test Call" } });
    const slugInput = Array.from(inputs).find(i => i.placeholder.includes("slug") || i.placeholder.includes("e.g. 30min"));
    if (slugInput) fireEvent.change(slugInput, { target: { value: "test-call" } });
    fireEvent.click(screen.getByText("Create"));
    await new Promise((r) => setTimeout(r, 100));
    expect(mockFetch).toHaveBeenCalled();
  });

  it("deletes an event type", async () => {
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify([
        { id: "1", title: "Del Me", slug: "del", duration: 15, is_active: 1 },
      ]), { status: 200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    render(<EventTypeManager />);
    await waitFor(() => expect(screen.getByText("Del Me")).toBeTruthy());
    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
  });
});
