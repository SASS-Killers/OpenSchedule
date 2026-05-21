import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/auth/auth-context";

function TestAuth({ onMount }: { onMount?: (auth: any) => void } = {}) {
  const auth = useAuth();
  if (onMount) onMount(auth);
  const { session, loading, error, login, verifyCode, logout } = auth;
  return (
    <div>
      <div data-testid="loading">{loading ? "loading" : "idle"}</div>
      <div data-testid="session">{session ? session.email : "none"}</div>
      <div data-testid="error">{error || ""}</div>
      <div data-testid="role">{session ? session.role : ""}</div>
      <button data-testid="login-btn" onClick={() => login("t@t.com")}>Login</button>
      <button data-testid="verify-btn" onClick={() => verifyCode("t@t.com", "123456")}>Verify</button>
      <button data-testid="logout-btn" onClick={() => logout()}>Logout</button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    document.cookie = "";
    // Prevent form.submit() from navigating away in tests
    HTMLFormElement.prototype.submit = vi.fn();
  });

  it("provides initial state", () => {
    render(<AuthProvider><TestAuth /></AuthProvider>);
    expect(screen.getByTestId("loading").textContent).toBe("idle");
    expect(screen.getByTestId("session").textContent).toBe("none");
  });

  it("calls send-code on login", async () => {
    render(<AuthProvider><TestAuth /></AuthProvider>);
    fireEvent.click(screen.getByTestId("login-btn"));
    await new Promise((r) => setTimeout(r, 100));
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/send-code"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("handles verifyCode with successful response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ userId: "u1", email: "t@t.com", name: "Test", role: "admin" }), { status: 200 })
    );
    const authRef: any = {};
    render(<AuthProvider><TestAuth onMount={(a) => { Object.assign(authRef, a); }} /></AuthProvider>);
    fireEvent.click(screen.getByTestId("verify-btn"));
    await new Promise((r) => setTimeout(r, 100));
    expect(HTMLFormElement.prototype.submit).toHaveBeenCalled();
  });

  it("handles verifyCode with error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Invalid code" }), { status: 200 })
    );
    render(<AuthProvider><TestAuth /></AuthProvider>);
    fireEvent.click(screen.getByTestId("verify-btn"));
    await new Promise((r) => setTimeout(r, 100));
    expect(screen.getByTestId("error").textContent).toContain("Invalid code");
  });

  it("handles verifyCode with network error", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));
    render(<AuthProvider><TestAuth /></AuthProvider>);
    fireEvent.click(screen.getByTestId("verify-btn"));
    await new Promise((r) => setTimeout(r, 100));
    expect(screen.getByTestId("error").textContent).toContain("Network error");
  });

  it("handles login network error", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("offline"));
    render(<AuthProvider><TestAuth /></AuthProvider>);
    fireEvent.click(screen.getByTestId("login-btn"));
    await new Promise((r) => setTimeout(r, 100));
    expect(screen.getByTestId("error").textContent).toContain("Network error");
  });

  it("reads session from cookie on mount", () => {
    // Set a valid JWT-like cookie
    const payload = btoa(JSON.stringify({ userId: "u1", email: "t@t.com", name: "Test", userrole: "admin" }));
    document.cookie = `session=header.${payload}.sig; path=/`;
    render(<AuthProvider><TestAuth /></AuthProvider>);
    expect(screen.getByTestId("session").textContent).toBe("t@t.com");
    expect(screen.getByTestId("role").textContent).toBe("admin");
  });

  it("handles logout", async () => {
    // Mock window.location.href
    const orig = window.location;
    Object.defineProperty(window, "location", { value: { href: "" }, writable: true });
    render(<AuthProvider><TestAuth /></AuthProvider>);
    fireEvent.click(screen.getByTestId("logout-btn"));
    await new Promise((r) => setTimeout(r, 100));
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/logout"),
      expect.any(Object),
    );
    Object.defineProperty(window, "location", { value: orig, writable: true });
  });
});
