import { useState, useEffect } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

interface DaySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export function ScheduleEditor({ initial }: { initial: DaySlot[] }) {
  const [slots, setSlots] = useState<Record<number, DaySlot>>(() => {
    const map: Record<number, DaySlot> = {};
    for (const s of initial) map[s.dayOfWeek] = s;
    return map;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Seed defaults for empty days
  useEffect(() => {
    setSlots((prev) => {
      const next = { ...prev };
      for (let d = 0; d < 7; d++) {
        if (!next[d]) {
          if (d < 5) next[d] = { dayOfWeek: d, startTime: "09:00", endTime: "17:00" };
        }
      }
      return next;
    });
  }, []);

  const toggleDay = (day: number) => {
    setSlots((prev) => {
      const next = { ...prev };
      if (next[day]) {
        delete next[day];
      } else {
        next[day] = { dayOfWeek: day, startTime: "09:00", endTime: "17:00" };
      }
      return next;
    });
    setSaved(false);
  };

  const updateTime = (day: number, field: "startTime" | "endTime", value: string) => {
    setSlots((prev) => {
      const s = prev[day];
      if (!s) return prev;
      return { ...prev, [day]: { ...s, [field]: value } };
    });
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    const entries = Object.values(slots).filter((s) => s);
    await fetch("/api/admin/schedule", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(entries),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ display: "grid", gap: "0.85rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.5rem" }}>
        {DAYS.map((label, day) => {
          const slot = slots[day];
          const isOn = !!slot;
          return (
            <div
              key={day}
              onClick={() => toggleDay(day)}
              style={{
                display: "grid",
                gap: "0.35rem",
                padding: "0.75rem 0.5rem",
                borderRadius: "0.85rem",
                border: isOn
                  ? "1px solid var(--app-border)"
                  : "1px dashed rgba(148,163,184,0.3)",
                background: isOn
                  ? "rgba(99,102,241,0.06)"
                  : "transparent",
                cursor: "pointer",
                textAlign: "center",
                opacity: isOn ? 1 : 0.5,
              }}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--app-text-muted)" }}>
                {label}
              </span>
              {isOn ? (
                <div style={{ display: "grid", gap: "0.25rem" }} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateTime(day, "startTime", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.25rem 0",
                      borderRadius: "0.4rem",
                      border: "1px solid var(--app-border)",
                      background: "rgba(0,0,0,0.3)",
                      color: "#fff",
                      fontSize: "0.78rem",
                      textAlign: "center",
                      outline: "none",
                    }}
                  />
                  <span style={{ fontSize: "0.7rem", color: "var(--app-text-muted)" }}>to</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateTime(day, "endTime", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.25rem 0",
                      borderRadius: "0.4rem",
                      border: "1px solid var(--app-border)",
                      background: "rgba(0,0,0,0.3)",
                      color: "#fff",
                      fontSize: "0.78rem",
                      textAlign: "center",
                      outline: "none",
                    }}
                  />
                </div>
              ) : (
                <span style={{ fontSize: "0.85rem", color: "var(--app-text-muted)" }}>—</span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button onClick={save} disabled={saving} className="app-btn app-btn-primary" style={{ padding: "0.7rem 1.5rem" }}>
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && <span style={{ fontSize: "0.85rem", color: "#34d399" }}>Saved</span>}
      </div>
    </div>
  );
}
