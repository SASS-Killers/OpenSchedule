import { useState, useEffect } from "react";

export function EmailTelemetry() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/email-stats");
        if (res.ok) {
          const data = await res.json();
          setCount(data.sentToday || 0);
        }
      } catch {
        /* ignore */
      }
      setLoading(false);
    };
    load();
  }, []);

  const limit = 300;
  const pct = Math.min((count / limit) * 100, 100);
  const remaining = Math.max(limit - count, 0);

  return (
    <div
      style={{
        padding: "1rem",
        borderRadius: "0.7rem",
        border: "1px solid var(--app-border)",
        background:
          pct >= 95 ? "rgba(248,113,113,0.08)" : pct >= 80 ? "rgba(251,191,36,0.08)" : "rgba(99,102,241,0.04)",
      }}
    >
      <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", fontWeight: 700 }}>Email Quota</h3>
      {loading ? (
        <p style={{ fontSize: "0.85rem", color: "var(--app-text-muted)" }}>Loading...</p>
      ) : (
        <>
          <div
            style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.4rem" }}
          >
            <span>
              {count} / {limit} sent today
            </span>
            <span style={{ fontWeight: 600, color: remaining <= 15 ? "#f87171" : "var(--app-text)" }}>
              {remaining} remaining
            </span>
          </div>
          <div
            style={{
              height: "0.5rem",
              borderRadius: "999px",
              background: "rgba(148,163,184,0.15)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: "999px",
                transition: "width 0.3s",
                width: `${pct}%`,
                background: pct >= 95 ? "#f87171" : pct >= 80 ? "#fbbf24" : "var(--app-primary)",
              }}
            />
          </div>
          {pct >= 80 && (
            <p
              style={{
                fontSize: "0.78rem",
                marginTop: "0.5rem",
                color: pct >= 95 ? "#f87171" : "#fbbf24",
              }}
            >
              {pct >= 95
                ? "Hard stop: Only OTPs will be sent. Consider upgrading Brevo."
                : "Soft alert: Non-critical reminders will be skipped."}
            </p>
          )}
        </>
      )}
    </div>
  );
}
