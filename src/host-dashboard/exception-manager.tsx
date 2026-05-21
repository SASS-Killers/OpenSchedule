import { useState, useEffect } from "react";

interface Override {
  id: string;
  exception_type: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  title: string | null;
  is_active: boolean;
}

interface Recurring {
  id: string;
  exception_type: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  title: string | null;
  effective_start: string | null;
  effective_end: string | null;
  is_active: boolean;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function emptyOverride() {
  return {
    exception_type: "full_day_block" as const,
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    title: "",
  };
}

function emptyRecurring() {
  return {
    exception_type: "window_block" as const,
    day_of_week: 1,
    start_time: "10:00",
    end_time: "11:00",
    title: "",
    effective_start: "",
    effective_end: "",
  };
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.7rem",
  borderRadius: "0.45rem",
  border: "1px solid var(--app-border)",
  background: "rgba(0,0,0,0.2)",
  color: "#fff",
  fontSize: "0.88rem",
  outline: "none",
};

export function ExceptionManager() {
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [recurrings, setRecurrings] = useState<Recurring[]>([]);
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [form, setForm] = useState(emptyOverride());
  const [recForm, setRecForm] = useState(emptyRecurring());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const today = new Date();
    const future = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    const from = today.toISOString().slice(0, 10);
    const to = future.toISOString().slice(0, 10);

    try {
      const [oRes, rRes] = await Promise.all([
        fetch(`/api/host/exceptions?from=${from}&to=${to}`),
        fetch(`/api/host/exceptions/recurring`),
      ]);
      if (oRes.ok) setOverrides(await oRes.json());
      if (rRes.ok) setRecurrings(await rRes.json());
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createOverride = async () => {
    setSaving(true);
    await fetch("/api/host/exceptions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        exceptionType: form.exception_type,
        startDate: form.start_date,
        endDate: form.end_date,
        startTime: form.start_time || null,
        endTime: form.end_time || null,
        title: form.title || null,
      }),
    });
    setSaving(false);
    setShowOverrideForm(false);
    setForm(emptyOverride());
    load();
  };

  const createRecurring = async () => {
    setSaving(true);
    await fetch("/api/host/exceptions/recurring", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        exceptionType: recForm.exception_type,
        dayOfWeek: recForm.day_of_week,
        startTime: recForm.start_time,
        endTime: recForm.end_time,
        title: recForm.title || null,
        effectiveStart: recForm.effective_start || null,
        effectiveEnd: recForm.effective_end || null,
      }),
    });
    setSaving(false);
    setShowRecurringForm(false);
    setRecForm(emptyRecurring());
    load();
  };

  const removeOverride = async (id: string) => {
    await fetch(`/api/host/exceptions/${id}`, { method: "DELETE" });
    load();
  };

  const removeRecurring = async (id: string) => {
    await fetch(`/api/host/exceptions/recurring/${id}`, { method: "DELETE" });
    load();
  };

  const typeLabel = (t: string) => {
    switch (t) {
      case "full_day_block":
        return "🚫 Full day";
      case "custom_hours":
        return "🕐 Custom hours";
      case "window_block":
        return "✂️ Window block";
      default:
        return t;
    }
  };

  const dayLabel = (d: number) => DAYS[d] || "Unknown";

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Availability Exceptions</h3>

      {/* Date-specific exceptions */}
      {overrides.length === 0 && !showOverrideForm && (
        <p style={{ color: "var(--app-text-muted)", fontSize: "0.85rem" }}>No date-specific exceptions.</p>
      )}
      {overrides.map((o) => (
        <div
          key={o.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.7rem 0.85rem",
            borderRadius: "0.6rem",
            border: "1px solid var(--app-border)",
            opacity: o.is_active ? 1 : 0.45,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>
              {typeLabel(o.exception_type)} {o.title && `· ${o.title}`}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--app-text-muted)" }}>
              {o.start_date === o.end_date ? o.start_date : `${o.start_date} → ${o.end_date}`}
              {o.start_time && ` · ${o.start_time}–${o.end_time}`}
            </div>
          </div>
          <button
            onClick={() => removeOverride(o.id)}
            className="app-btn"
            style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem", minHeight: 0, color: "#f87171" }}
          >
            Delete
          </button>
        </div>
      ))}

      {showOverrideForm && (
        <div
          style={{
            display: "grid",
            gap: "0.6rem",
            padding: "1rem",
            borderRadius: "0.7rem",
            border: "1px solid var(--app-border)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <select
            value={form.exception_type}
            onChange={(e) => setForm({ ...form, exception_type: e.target.value })}
            style={inputStyle}
          >
            <option value="full_day_block">Full-day block (vacation)</option>
            <option value="custom_hours">Custom hours</option>
            <option value="window_block">Window block (dentist)</option>
          </select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              placeholder="Start date"
              style={inputStyle}
            />
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              placeholder="End date"
              style={inputStyle}
            />
          </div>
          {form.exception_type !== "full_day_block" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                style={inputStyle}
              />
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                style={inputStyle}
              />
            </div>
          )}
          <input
            type="text"
            value={form.title}
            placeholder="Title (e.g. Italy vacation)"
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={inputStyle}
          />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={createOverride}
              disabled={!form.start_date || !form.end_date || saving}
              className="app-btn app-btn-primary"
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
            >
              {saving ? "Saving..." : "Create"}
            </button>
            <button
              onClick={() => setShowOverrideForm(false)}
              className="app-btn"
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {!showOverrideForm && (
        <button
          onClick={() => setShowOverrideForm(true)}
          className="app-btn"
          style={{
            padding: "0.6rem",
            justifyContent: "center",
            border: "1px dashed var(--app-border)",
            width: "100%",
            fontSize: "0.85rem",
          }}
        >
          + Date Exception
        </button>
      )}

      {/* Recurring exceptions */}
      <h3 style={{ margin: "1rem 0 0", fontSize: "1rem", fontWeight: 700 }}>Recurring Blocks</h3>
      {recurrings.length === 0 && !showRecurringForm && (
        <p style={{ color: "var(--app-text-muted)", fontSize: "0.85rem" }}>No recurring exceptions.</p>
      )}
      {recurrings.map((r) => (
        <div
          key={r.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.7rem 0.85rem",
            borderRadius: "0.6rem",
            border: "1px solid var(--app-border)",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>
              {typeLabel(r.exception_type)} {r.title && `· ${r.title}`}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--app-text-muted)" }}>
              {dayLabel(r.day_of_week)} · {r.start_time}–{r.end_time}
            </div>
          </div>
          <button
            onClick={() => removeRecurring(r.id)}
            className="app-btn"
            style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem", minHeight: 0, color: "#f87171" }}
          >
            Delete
          </button>
        </div>
      ))}
      {showRecurringForm && (
        <div
          style={{
            display: "grid",
            gap: "0.6rem",
            padding: "1rem",
            borderRadius: "0.7rem",
            border: "1px solid var(--app-border)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <select
            value={recForm.exception_type}
            onChange={(e) => setRecForm({ ...recForm, exception_type: e.target.value })}
            style={inputStyle}
          >
            <option value="window_block">Window block</option>
            <option value="custom_hours">Custom hours</option>
          </select>
          <select
            value={recForm.day_of_week}
            onChange={(e) => setRecForm({ ...recForm, day_of_week: parseInt(e.target.value) })}
            style={inputStyle}
          >
            {DAYS.map((d, i) => (
              <option key={i} value={i}>
                {d}
              </option>
            ))}
          </select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <input
              type="time"
              value={recForm.start_time}
              onChange={(e) => setRecForm({ ...recForm, start_time: e.target.value })}
              style={inputStyle}
            />
            <input
              type="time"
              value={recForm.end_time}
              onChange={(e) => setRecForm({ ...recForm, end_time: e.target.value })}
              style={inputStyle}
            />
          </div>
          <input
            type="text"
            value={recForm.title}
            placeholder="Title (e.g. Team standup)"
            onChange={(e) => setRecForm({ ...recForm, title: e.target.value })}
            style={inputStyle}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <input
              type="date"
              value={recForm.effective_start}
              placeholder="Effective from"
              onChange={(e) => setRecForm({ ...recForm, effective_start: e.target.value })}
              style={inputStyle}
            />
            <input
              type="date"
              value={recForm.effective_end}
              placeholder="Effective until"
              onChange={(e) => setRecForm({ ...recForm, effective_end: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={createRecurring}
              disabled={!recForm.start_time || !recForm.end_time || saving}
              className="app-btn app-btn-primary"
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
            >
              {saving ? "Saving..." : "Create"}
            </button>
            <button
              onClick={() => setShowRecurringForm(false)}
              className="app-btn"
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {!showRecurringForm && (
        <button
          onClick={() => setShowRecurringForm(true)}
          className="app-btn"
          style={{
            padding: "0.6rem",
            justifyContent: "center",
            border: "1px dashed var(--app-border)",
            width: "100%",
            fontSize: "0.85rem",
          }}
        >
          + Recurring Exception
        </button>
      )}
    </div>
  );
}
