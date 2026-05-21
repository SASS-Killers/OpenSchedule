import { useState, useEffect, useCallback, useRef } from "react";

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatTime(ts: number): string {
  const d = new Date(ts * 1000);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "p" : "a";
  const hh = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hh}:${m}${ampm}`;
}

function monthDays(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1).getDay(); // 0=Sun
  const total = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(first).fill(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

interface Props {
  hostId: string;
  eventTypeId: string;
}

export function BookingWidget({ hostId, eventTypeId }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [booked, setBooked] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [error, setError] = useState("");

  const days = monthDays(year, month);

  const fetchSlots = useCallback(async (date: string) => {
    setLoading(true);
    setSelectedSlot(null);
    setError("");
    try {
      const res = await fetch(`/api/slots?hostId=${hostId}&eventTypeId=${eventTypeId}&date=${date}`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    }
    setLoading(false);
  }, [hostId, eventTypeId]);

  // Background polling every 15s to refresh slots while date is selected
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (selectedDate) {
      // Initial fetch + poll
      fetchSlots(selectedDate);
      pollRef.current = setInterval(() => fetchSlots(selectedDate), 15000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedDate, fetchSlots]);

  const book = async () => {
    if (!selectedSlot || !name || !email) return;
    setError("");
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ eventTypeId, startTime: selectedSlot, clientName: name, clientEmail: email, notes }),
      });
      const data = await res.json();
      if (data.ok) {
        setBooked(true);
        setBookingResult(data);
      } else {
        setError(data.error || "Booking failed");
      }
    } catch {
      setError("Network error");
    }
  };

  if (booked && bookingResult) {
    return (
      <div style={{ textAlign: "center", padding: "2rem 0" }}>
        <div style={{
          width: "3rem", height: "3rem", borderRadius: "999px",
          background: "rgba(52,211,153,0.15)", display: "grid", placeItems: "center",
          margin: "0 auto 1rem", fontSize: "1.5rem",
        }}>✅</div>
        <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem" }}>Booking Confirmed</h2>
        <p style={{ color: "var(--app-text-muted)", fontSize: "0.9rem", margin: "0 0 1.5rem" }}>
          {formatTime(bookingResult.startTime)} – {formatTime(bookingResult.endTime)}
        </p>
        <p style={{ fontSize: "0.85rem", color: "var(--app-text-muted)" }}>
          A confirmation has been sent. Save this link to cancel:
        </p>
        <code style={{
          display: "block", padding: "0.5rem", borderRadius: "0.45rem",
          background: "rgba(0,0,0,0.2)", fontSize: "0.82rem", wordBreak: "break-all",
          marginTop: "0.5rem",
        }}>{window.location.origin + bookingResult.cancellationUrl}</code>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      {/* Month navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          onClick={() => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }}
          className="app-btn" style={{ padding: "0.35rem 0.7rem", minHeight: 0, fontSize: "0.85rem" }}
        >←</button>
        <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{MONTHS[month]} {year}</span>
        <button
          onClick={() => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); }}
          className="app-btn" style={{ padding: "0.35rem 0.7rem", minHeight: 0, fontSize: "0.85rem" }}
        >→</button>
      </div>

      {/* Calendar grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.25rem",
        textAlign: "center", fontSize: "0.82rem",
      }}>
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
          <div key={d} style={{ fontWeight: 600, color: "var(--app-text-muted)", padding: "0.3rem 0" }}>{d}</div>
        ))}
        {days.map((d, i) => {
          const dateStr = d ? `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` : "";
          const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const isPast = d ? new Date(dateStr + "T23:59:59").getTime() < Date.now() : false;
          const isSel = dateStr === selectedDate;
          return (
            <div
              key={i}
              onClick={() => { if (d && !isPast) { setSelectedDate(dateStr); } }}
              style={{
                padding: "0.45rem 0", borderRadius: "0.4rem", cursor: d && !isPast ? "pointer" : "default",
                fontWeight: isSel ? 700 : isToday ? 600 : 400,
                background: isSel ? "var(--app-primary)" : isToday ? "rgba(99,102,241,0.12)" : "transparent",
                color: isSel ? "#fff" : isPast ? "var(--app-text-muted)" : "var(--app-text)",
                opacity: isPast ? 0.3 : 1,
              }}
            >{d || ""}</div>
          );
        })}
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--app-text-muted)" }}>
            {selectedDate}
          </div>
          {loading ? (
            <p style={{ color: "var(--app-text-muted)", fontSize: "0.85rem" }}>Loading...</p>
          ) : slots.length === 0 ? (
            <p style={{ color: "var(--app-text-muted)", fontSize: "0.85rem" }}>No available slots for this date.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "0.45rem" }}>
              {slots.map((ts) => (
                <button
                  key={ts}
                  onClick={() => setSelectedSlot(ts === selectedSlot ? null : ts)}
                  style={{
                    padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid var(--app-border)",
                    background: ts === selectedSlot ? "var(--app-primary)" : "rgba(255,255,255,0.03)",
                    color: ts === selectedSlot ? "#fff" : "var(--app-text)",
                    cursor: "pointer", fontSize: "0.85rem", fontFamily: "monospace",
                  }}
                >{formatTime(ts)}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Booking form */}
      {selectedSlot && (
        <div style={{
          display: "grid", gap: "0.6rem", padding: "1rem", borderRadius: "0.7rem",
          border: "1px solid var(--app-border)", background: "rgba(255,255,255,0.02)",
        }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
            {formatTime(selectedSlot)}
          </div>
          <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)}
            style={inputStyle} />
          <input placeholder="Your email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            style={inputStyle} />
          <textarea placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            style={{ ...inputStyle, resize: "vertical" }} />
          {error && <div style={{ color: "#f87171", fontSize: "0.85rem" }}>{error}</div>}
          <button onClick={book} disabled={!name || !email}
            className="app-btn app-btn-primary" style={{ justifyContent: "center", opacity: !name || !email ? 0.6 : 1 }}
          >Confirm Booking</button>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.55rem 0.75rem", borderRadius: "0.45rem",
  border: "1px solid var(--app-border)", background: "rgba(0,0,0,0.2)",
  color: "#fff", fontSize: "0.88rem", outline: "none",
};
