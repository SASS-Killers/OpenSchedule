import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Form } from "@/ui/form";

describe("Form", () => {
  it("renders fields and button", () => {
    render(
      <Form
        fields={[{ name: "email", label: "Email", type: "email", required: true }]}
        submitLabel="Submit"
        onSubmit={async () => ({ ok: true })}
      />
    );
    expect(screen.getByText("Email")).toBeTruthy();
    expect(screen.getByText("Submit")).toBeTruthy();
    expect(screen.getByRole("button")).toBeTruthy();
  });

  it("shows error when onSubmit fails", async () => {
    render(
      <Form
        fields={[{ name: "name", label: "Name", required: true }]}
        submitLabel="Save"
        onSubmit={async () => ({ ok: false, error: "Something broke" })}
      />
    );
    fireEvent.submit(screen.getByRole("button"));
    const error = await screen.findByText("Something broke");
    expect(error).toBeTruthy();
  });

  it("calls onSuccess when onSubmit succeeds", async () => {
    const onSuccess = vi.fn();
    render(
      <Form
        fields={[{ name: "name", label: "Name" }]}
        submitLabel="Save"
        onSubmit={async () => ({ ok: true, data: { id: "123" } })}
        onSuccess={onSuccess}
      />
    );
    fireEvent.submit(screen.getByRole("button"));
    await new Promise((r) => setTimeout(r, 100));
    expect(onSuccess).toHaveBeenCalledWith({ id: "123" });
  });

  it("disables button while loading", async () => {
    render(
      <Form
        fields={[{ name: "name", label: "Name" }]}
        submitLabel="Go"
        onSubmit={async () => {
          await new Promise((r) => setTimeout(r, 200));
          return { ok: true };
        }}
      />
    );
    fireEvent.submit(screen.getByRole("button"));
    expect(screen.getByRole("button").textContent).toBe("Sending…");
  });
});
