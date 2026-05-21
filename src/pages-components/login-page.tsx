import { useState } from "react";
import { useAuth } from "@/auth/auth-context";

export function LoginPage() {
  const { login, verifyCode, loading, error } = useAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    if (!email.trim()) return;
    const ok = await login(email.trim());
    if (ok) setStep("code");
    else setLocalError("Email not recognized.");
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    if (!code.trim()) return;
    await verifyCode(email.trim(), code.trim());
    // If verifyCode succeeds, it redirects via form submit
    // If it fails, the error comes through the context
  };

  const back = () => {
    setStep("email");
    setCode("");
    setLocalError("");
  };

  const err = localError || error;

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "6rem 1.5rem",
        gap: "1.5rem",
      }}
    >
      <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>
        Sign In
      </h1>

      {step === "email" && (
        <form
          onSubmit={handleEmailSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", maxWidth: 320 }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "0.85rem",
              border: "1px solid var(--app-border)",
              background: "rgba(255,255,255,0.03)",
              color: "#fff",
              fontSize: "0.95rem",
              outline: "none",
            }}
          />
          {err && <div style={{ color: "#f87171", fontSize: "0.85rem" }}>{err}</div>}
          <button
            type="submit"
            disabled={loading}
            className="app-btn app-btn-primary"
            style={{ justifyContent: "center", width: "100%", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Sending…" : "Send Login Code"}
          </button>
        </form>
      )}

      {step === "code" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", maxWidth: 320 }}>
          <p style={{ fontSize: "0.9rem", color: "var(--app-text-muted)", margin: 0 }}>
            Check your email for the code, then enter it below.
          </p>
          <form onSubmit={handleCodeSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              required
              maxLength={6}
              inputMode="numeric"
              pattern="[0-9]{6}"
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.85rem",
                border: "1px solid var(--app-border)",
                background: "rgba(255,255,255,0.03)",
                color: "#fff",
                fontSize: "1.5rem",
                textAlign: "center",
                fontFamily: "monospace",
                letterSpacing: "0.3em",
                outline: "none",
              }}
            />
            {err && <div style={{ color: "#f87171", fontSize: "0.85rem" }}>{err}</div>}
            <button
              type="submit"
              disabled={loading}
              className="app-btn app-btn-primary"
              style={{ justifyContent: "center", width: "100%", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Verifying…" : "Verify & Sign In"}
            </button>
          </form>
          <button onClick={back} className="app-btn" style={{ justifyContent: "center", width: "100%" }}>
            Use a different email
          </button>
        </div>
      )}
    </section>
  );
}
