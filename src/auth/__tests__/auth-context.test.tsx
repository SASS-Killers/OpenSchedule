import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/auth/auth-context";

// Test component that uses the auth context
function TestComponent() {
  const { session, loading, error, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="loading">{loading ? "loading" : "idle"}</div>
      <div data-testid="session">{session ? session.email : "none"}</div>
      <div data-testid="error">{error || ""}</div>
      <button onClick={() => login("test@test.com")}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    // Clear cookies
    document.cookie = "";
  });

  it("provides initial state", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByTestId("loading").textContent).toBe("idle");
    expect(screen.getByTestId("session").textContent).toBe("none");
  });

  it("throws when used outside provider", () => {
    // Suppress console error for expected error
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow("useAuth must be used within an AuthProvider");
    spy.mockRestore();
  });

  it("handles login call", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    fireEvent.click(screen.getByText("Login"));
    await new Promise((r) => setTimeout(r, 100));
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/send-code"),
      expect.any(Object),
    );
  });
});
