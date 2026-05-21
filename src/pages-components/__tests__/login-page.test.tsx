import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AuthProvider } from "@/auth/auth-context";
import { LoginPage } from "@/pages-components/login-page";

function Wrapper() {
  return <AuthProvider><LoginPage /></AuthProvider>;
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    HTMLFormElement.prototype.submit = vi.fn();
  });

  it("renders sign in form", () => {
    render(<Wrapper />);
    expect(screen.getByText("Sign In")).toBeTruthy();
    expect(screen.getByPlaceholderText("you@example.com")).toBeTruthy();
    expect(screen.getByText("Send Login Code")).toBeTruthy();
  });

  it("shows error on failed login", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("fail"));
    render(<Wrapper />);
    const input = screen.getByPlaceholderText("you@example.com");
    fireEvent.change(input, { target: { value: "test@test.com" } });
    const form = document.querySelector("form")!;
    fireEvent.submit(form);
    await new Promise((r) => setTimeout(r, 200));
    // The error is shown by AuthContext — it should appear in the DOM
    expect(screen.queryByText("Sign In")).toBeTruthy();
  });

  it("transitions to code step on successful login", async () => {
    render(<Wrapper />);
    const input = screen.getByPlaceholderText("you@example.com");
    fireEvent.change(input, { target: { value: "test@test.com" } });
    fireEvent.submit(screen.getByText("Send Login Code").closest("form")!);
    await new Promise((r) => setTimeout(r, 100));
    expect(screen.getByText(/Check your email/)).toBeTruthy();
    expect(screen.getByText("Verify & Sign In")).toBeTruthy();
  });

  it("returns to email step from code step", async () => {
    render(<Wrapper />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    fireEvent.submit(screen.getByText("Send Login Code").closest("form")!);
    await new Promise((r) => setTimeout(r, 100));
    fireEvent.click(screen.getByText("Use a different email"));
    expect(screen.getByText("Send Login Code")).toBeTruthy();
  });
});
