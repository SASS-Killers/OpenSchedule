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
  });

  it("transitions to code step", async () => {
    render(<Wrapper />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    fireEvent.submit(document.querySelector("form")!);
    await new Promise((r) => setTimeout(r, 100));
    expect(screen.getByText(/Check your email/)).toBeTruthy();
  });

  it("shows error on verify failure", async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 })) // login
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "Invalid code" }), { status: 200 })); // verify
    render(<Wrapper />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    fireEvent.submit(document.querySelector("form")!);
    await new Promise((r) => setTimeout(r, 100));
    // Now on code step — submit an invalid code
    const codeInput = document.querySelector("input[type='text']")!;
    fireEvent.change(codeInput, { target: { value: "000000" } });
    fireEvent.submit(document.querySelector("form")!);
    await new Promise((r) => setTimeout(r, 200));
    expect(screen.getByText("Invalid code")).toBeTruthy();
  });

  it("returns to email step", async () => {
    render(<Wrapper />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    fireEvent.submit(document.querySelector("form")!);
    await new Promise((r) => setTimeout(r, 100));
    fireEvent.click(screen.getByText("Use a different email"));
    expect(screen.getByText("Send Login Code")).toBeTruthy();
  });
});
