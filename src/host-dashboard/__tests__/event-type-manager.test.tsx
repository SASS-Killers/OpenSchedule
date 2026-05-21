import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { EventTypeManager } from "@/host-dashboard/event-type-manager";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe("EventTypeManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(new Response("[]", { status: 200 }));
  });

  afterEach(() => {
    cleanup();
  });

  it("loads and shows list of event types", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            id: "1",
            title: "30 Min",
            slug: "30min",
            duration: 30,
            is_active: 1,
            description: null,
            buffer_before: 0,
            buffer_after: 0,
            minimum_notice: 4,
          },
        ]),
        { status: 200 },
      ),
    );
    render(<EventTypeManager />);
    await waitFor(() => expect(screen.getByText("30 Min")).toBeTruthy());
  });

  it("shows empty state when no event types and form is closed", () => {
    render(<EventTypeManager />);
    expect(screen.getByText(/No event types yet/)).toBeTruthy();
  });

  it("opens form when + New Event Type is clicked", () => {
    render(<EventTypeManager />);
    fireEvent.click(screen.getByText("+ New Event Type"));
    expect(screen.getByText("Create")).toBeTruthy();
  });

  it("closes form when Cancel is clicked", () => {
    render(<EventTypeManager />);
    fireEvent.click(screen.getByText("+ New Event Type"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Create")).toBeFalsy();
  });

  it("creates a new event type via POST", async () => {
    mockFetch.mockResolvedValueOnce(new Response("[]", { status: 200 }));
    render(<EventTypeManager />);
    fireEvent.click(screen.getByText("+ New Event Type"));

    const titleInput = screen.getByPlaceholderText("e.g. 30 Minute Call") as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: "Test Call" } });

    // Slug auto-generates from title
    const slugInput = screen.getByPlaceholderText("e.g. 30min") as HTMLInputElement;
    expect(slugInput.value).toBe("test-call");

    fireEvent.click(screen.getByText("Create"));
    await waitFor(() => {
      // Find the POST call specifically
      const postCall = mockFetch.mock.calls.find(
        (c: any) => (c[0] as string).includes("/event_types") && c[1]?.method === "POST",
      );
      expect(postCall).toBeTruthy();
    });
  });

  it("shows Saving... state while creating", async () => {
    mockFetch.mockResolvedValueOnce(new Response("[]", { status: 200 }));
    mockFetch.mockImplementationOnce(() => new Promise(() => {})); // Hang
    render(<EventTypeManager />);
    fireEvent.click(screen.getByText("+ New Event Type"));
    const titleInput = screen.getByPlaceholderText("e.g. 30 Minute Call") as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: "Test" } });
    fireEvent.click(screen.getByText("Create"));
    await waitFor(() => expect(screen.getByText("Saving...")).toBeTruthy());
  });

  it("deletes an event type via DELETE", async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: "1",
              title: "Delete Me",
              slug: "del",
              duration: 15,
              is_active: 1,
              description: null,
              buffer_before: 0,
              buffer_after: 0,
              minimum_notice: 4,
            },
          ]),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    render(<EventTypeManager />);
    await waitFor(() => expect(screen.getByText("Delete Me")).toBeTruthy());
    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    const deleteCall = mockFetch.mock.calls.find((c: any) => (c[1]?.method || "").toUpperCase() === "DELETE");
    expect(deleteCall).toBeTruthy();
  });

  it("edits an existing event type via PATCH", async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: "42",
              title: "Edit Me",
              slug: "edit-me",
              duration: 30,
              is_active: 1,
              description: null,
              buffer_before: 0,
              buffer_after: 0,
              minimum_notice: 4,
            },
          ]),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    render(<EventTypeManager />);
    await waitFor(() => expect(screen.getByText("Edit Me")).toBeTruthy());

    // Click Edit
    fireEvent.click(screen.getByText("Edit"));

    // Form should show "Update" button instead of "Create"
    expect(screen.getByText("Update")).toBeTruthy();

    // Title should be pre-filled
    const titleInput = screen.getByPlaceholderText("e.g. 30 Minute Call") as HTMLInputElement;
    expect(titleInput.value).toBe("Edit Me");

    // Slug should be preserved (not auto-generated)
    const slugInput = screen.getByPlaceholderText("e.g. 30min") as HTMLInputElement;
    expect(slugInput.value).toBe("edit-me");

    // Change title
    fireEvent.change(titleInput, { target: { value: "Edited Title" } });

    // Save
    fireEvent.click(screen.getByText("Update"));
    await waitFor(() => {
      const patchCall = mockFetch.mock.calls.find((c: any) => (c[1]?.method || "").toUpperCase() === "PATCH");
      expect(patchCall).toBeTruthy();
      const body = JSON.parse(patchCall[1].body);
      expect(body.title).toBe("Edited Title");
      // Slug should NOT have changed (editing preserves it)
      expect(body.slug).toBe("edit-me");
    });
  });

  it("shows inactive event type with reduced opacity", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            id: "1",
            title: "Old Type",
            slug: "old",
            duration: 60,
            is_active: 0,
            description: null,
            buffer_before: 0,
            buffer_after: 0,
            minimum_notice: 4,
          },
        ]),
        { status: 200 },
      ),
    );
    render(<EventTypeManager />);
    await waitFor(() => {
      const item = screen.getByText("Old Type").closest("div")?.parentElement;
      expect(item).toBeTruthy();
    });
    // The text "inactive" should appear
    await waitFor(() => expect(screen.getByText(/inactive/)).toBeTruthy());
  });

  it("updates slug automatically when title changes and not editing", async () => {
    mockFetch.mockResolvedValueOnce(new Response("[]", { status: 200 }));
    render(<EventTypeManager />);
    fireEvent.click(screen.getByText("+ New Event Type"));

    const titleInput = screen.getByPlaceholderText("e.g. 30 Minute Call") as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: "My Cool Event!!!" } });

    const slugInput = screen.getByPlaceholderText("e.g. 30min") as HTMLInputElement;
    expect(slugInput.value).toBe("my-cool-event");
  });

  it("auto-generates slug from title when not editing", async () => {
    mockFetch.mockResolvedValueOnce(new Response("[]", { status: 200 }));
    render(<EventTypeManager />);
    fireEvent.click(screen.getByText("+ New Event Type"));

    const titleInput = screen.getByPlaceholderText("e.g. 30 Minute Call") as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: "My Event" } });

    const slugInput = screen.getByPlaceholderText("e.g. 30min") as HTMLInputElement;
    expect(slugInput.value).toBe("my-event");

    // Slug overridden when title changes (component always auto-generates when not editing)
    fireEvent.change(titleInput, { target: { value: "My Event Renamed" } });
    expect(slugInput.value).toBe("my-event-renamed");
  });

  it("resets form after cancel", () => {
    mockFetch.mockResolvedValueOnce(new Response("[]", { status: 200 }));
    render(<EventTypeManager />);
    fireEvent.click(screen.getByText("+ New Event Type"));

    const titleInput = screen.getByPlaceholderText("e.g. 30 Minute Call") as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: "Something" } });

    fireEvent.click(screen.getByText("Cancel"));
    fireEvent.click(screen.getByText("+ New Event Type"));

    // Form should be reset
    const titleInputAgain = screen.getByPlaceholderText("e.g. 30 Minute Call") as HTMLInputElement;
    expect(titleInputAgain.value).toBe("");
  });

  it("shows description field in form", () => {
    render(<EventTypeManager />);
    fireEvent.click(screen.getByText("+ New Event Type"));
    expect(screen.getByPlaceholderText("A quick call to catch up")).toBeTruthy();
  });

  it("populates description when editing", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            id: "1",
            title: "Test",
            slug: "test",
            duration: 30,
            is_active: 1,
            description: "A test call",
            buffer_before: 0,
            buffer_after: 0,
            minimum_notice: 4,
          },
        ]),
        { status: 200 },
      ),
    );
    render(<EventTypeManager />);
    await waitFor(() => expect(screen.getByText("Test")).toBeTruthy());
    fireEvent.click(screen.getByText("Edit"));
    const descInput = screen.getByPlaceholderText("A quick call to catch up") as HTMLInputElement;
    expect(descInput.value).toBe("A test call");
  });

  it("sets description to null on create when empty", async () => {
    mockFetch.mockResolvedValueOnce(new Response("[]", { status: 200 }));
    render(<EventTypeManager />);
    fireEvent.click(screen.getByText("+ New Event Type"));

    const titleInput = screen.getByPlaceholderText("e.g. 30 Minute Call") as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: "No Desc" } });

    fireEvent.click(screen.getByText("Create"));
    await waitFor(() => {
      const call = mockFetch.mock.calls.find(
        (c: any) => (c[0] as string).includes("/event_types") && c[1]?.method === "POST",
      );
      const body = JSON.parse(call[1].body);
      expect(body.description).toBeNull();
    });
  });
});
