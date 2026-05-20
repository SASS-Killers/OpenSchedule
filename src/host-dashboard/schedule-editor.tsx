import { useState, useEffect } from "react";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface DaySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

function parseTime(val: string): string {
  // Accept "9a", "9am", "9:00am", "9:00", "09:00", "9" — normalize to "HH:MM"
  const s = val.trim().toLowerCase().replace(/\s/g, "");
  if (!s) return "";
  const am = s.endsWith("a") || s.endsWith("am");
  const pm = s.endsWith("p") || s.endsWith("pm");
  let digits = s.replace(/[ap]m?/, "");
  if (!digits.includes(":")) {
    digits = digits.length <= 2 ? digits + ":00" : digits.slice(0, 2) + ":" + digits.slice(2);
  }
  let [h, m] = digits.split(":").map((x) => parseInt(x, 10));
  if (isNaN(h)) return "";
  if (isNaN(m)) m = 0;
  if (pm && h < 12) h += 12;
  if (am && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function displayTime(hhmm: string): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "p" : "a";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${String(m).padStart(2, "0")}${period}`;
}

function validTime(val: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(val);
}

export function ScheduleEditor({ initial }: { initial: DaySlot[] }) {
  const [slots, setSlots] = useState<Record<number, DaySlot>>(() => {
    const map: Record<number, DaySlot> = {};
    for (const s of initial) map[s.dayOfWeek] = s;
    return map;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
      if (next[day]) delete next[day];
      else next[day] = { dayOfWeek: day, startTime: "09:00", endTime: "17:00" };
      return next;
    });
    setSaved(false);
  };

  const updateTime = (day: number, field: "startTime" | "endTime", raw: string) => {
    setSlots((prev) => {
      const s = prev[day];
      if (!s) return prev;
      return { ...prev, [day]: { ...s, [field]: raw } };
    });
    setSaved(false);
  };

  const blurTime = (day: number, field: "startTime" | "endTime") => {
    setSlots((prev) => {
      const s = prev[day];
      if (!s) return prev;
      const parsed = parseTime(s[field]);
      return { ...prev, [day]: { ...s, [field]: parsed || s[field] } };
    });
  };

  const isValid = (() => {
    for (const s of Object.values(slots)) {
      if (!s) continue;
      if (!validTime(s.startTime) || !validTime(s.endTime)) return false;
    }
    return true;
  })();

  const save = async () => {
    if (!isValid) return;
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

  const row = (day: number, label: string) => {
    const slot = slots[day];
    const on = !!slot;
    return (
      <div
        key={day}
        onClick={() => toggleDay(day)}
        style={{
          display: "grid",
          gridTemplateColumns: "120px 1fr",
          gap: "0.75rem",
          alignItems: "center",
          padding: "0.6rem 0.85rem",
          borderRadius: "0.7rem",
          border: on ? "1px solid var(--app-border)" : "1px dashed rgba(148,163,184,0.25)",
          background: on ? "rgba(99,102,241,0.04)" : "transparent",
          cursor: "pointer",
          opacity: on ? 1 : 0.55,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: "0.92rem" }}>{label}</span>
        {on ? (
          <div
            style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <TextField
              value={slot.startTime}
              display={displayTime(slot.startTime)}
              onChange={(v) => updateTime(day, "startTime", v)}
              onBlur={() => blurTime(day, "startTime")}
            />
            <span style={{ fontSize: "0.85rem", color: "var(--app-text-muted)" }}>to</span>
            <TextField
              value={slot.endTime}
              display={displayTime(slot.endTime)}
              onChange={(v) => updateTime(day, "endTime", v)}
              onBlur={() => blurTime(day, "endTime")}
            />
          </div>
        ) : (
          <span style={{ fontSize: "0.85rem", color: "var(--app-text-muted)" }}>Not available</span>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "grid", gap: "0.6rem" }}>
      {WEEKDAYS.map((label, i) => row(i, label))}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
        <button
          onClick={save}
          disabled={saving || !isValid}
          className="app-btn app-btn-primary"
          style={{ padding: "0.7rem 1.5rem", opacity: saving || !isValid ? 0.6 : 1 }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {!isValid && (
          <span style={{ fontSize: "0.82rem", color: "#f87171" }}>Invalid time — use format like 9:00am or 17:00</span>
        )}
        {saved && <span style={{ fontSize: "0.85rem", color: "#34d399" }}>Saved</span>}
      </div>
    </div>
  );
}

function TextField({
  value,
  display,
  onChange,
  onBlur,
}: {
  value: string;
  display: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type="text"
      value={focused ? value : display}
      placeholder="9:00am"
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        onBlur();
      }}
      style={{
        width: "100%",
        maxWidth: "120px",
        padding: "0.4rem 0.6rem",
        borderRadius: "0.45rem",
        border: "1px solid var(--app-border)",
        background: "rgba(0,0,0,0.25)",
        color: "#fff",
        fontSize: "0.88rem",
        fontFamily: "monospace",
        outline: "none",
      }}
    />
  );
}
