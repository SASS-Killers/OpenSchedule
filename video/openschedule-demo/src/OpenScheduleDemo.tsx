import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Sequence,
  AbsoluteFill,
  spring,
  Easing,
} from "remotion";

// ── Constants ──────────────────────────────────────────────────────────
const FPS = 30;
const BG = "#0f0f1a";
const FG = "#e2e8f0";
const MUTED = "#94a3b8";
const ACCENT = "#6366f1";
const ACCENT2 = "#4f46e5";
const GREEN = "#34d399";
const RED = "#f87171";
const YELLOW = "#fbbf24";
const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

// Scene durations
const S5 = 5 * FPS; // 5 seconds
const S4 = 4 * FPS; // 4 seconds
const S3 = 3 * FPS; // 3 seconds

// ── Helpers ────────────────────────────────────────────────────────────

function fadeIn(frame: number, start: number, duration = 15, from = 0, to = 1) {
  return interpolate(frame, [start, start + duration], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function slideIn(
  frame: number,
  start: number,
  duration = 20,
  dir: "left" | "right" | "up" | "down" = "up",
) {
  const progress = interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const offset = (1 - progress) * 40;
  const x = dir === "left" ? -offset : dir === "right" ? offset : 0;
  const y = dir === "up" ? offset : dir === "down" ? -offset : 0;
  return { opacity: progress, transform: `translate(${x}px, ${y}px)` };
}

function scaleIn(frame: number, start: number) {
  const s = spring({
    frame: frame - start,
    fps: FPS,
    config: { damping: 12, stiffness: 100 },
  });
  return { opacity: Math.min(s, 1), transform: `scale(${0.5 + s * 0.5})` };
}

function Title({
  text,
  subtitle,
  frame,
  start = 0,
}: {
  text: string;
  subtitle?: string;
  frame: number;
  start?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        fontFamily: FONT,
      }}
    >
      <h1
        style={{
          fontSize: 48,
          fontWeight: 700,
          color: FG,
          margin: 0,
          opacity: fadeIn(frame, start),
          transform: `translateY(${interpolate(fadeIn(frame, start), [0, 1], [20, 0])}px)`,
        }}
      >
        {text}
      </h1>
      {subtitle && (
        <p
          style={{
            fontSize: 22,
            color: MUTED,
            marginTop: 16,
            opacity: fadeIn(frame, start + 8),
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

function FeatureRow({
  icon,
  label,
  desc,
  frame,
  start = 0,
}: {
  icon: string;
  label: string;
  desc: string;
  frame: number;
  start?: number;
}) {
  const style = slideIn(frame, start, 15, "left");
  return (
    <div
      style={{
        ...style,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "10px 0",
      }}
    >
      <span style={{ fontSize: 28 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 18, fontWeight: 600, color: FG }}>{label}</div>
        <div style={{ fontSize: 14, color: MUTED }}>{desc}</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  SCENE 1 — Booking Widget (public calendar)
// ════════════════════════════════════════════════════════════════════════

function BookingWidgetScene({ frame }: { frame: number }) {
  return (
    <AbsoluteFill
      style={{
        background: BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: FONT,
        padding: "40px 60px",
      }}
    >
      <Title
        text="Book a Meeting"
        subtitle="No login required — just pick a time"
        frame={frame}
      />
      <div
        style={{
          display: "flex",
          gap: 24,
          marginTop: 20,
          width: "100%",
          maxWidth: 800,
          opacity: fadeIn(frame, 20),
        }}
      >
        <div
          style={{
            flex: 1,
            background: "#1a1a2e",
            borderRadius: 12,
            padding: 20,
            border: "1px solid rgba(148,163,184,0.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <span style={{ color: MUTED, cursor: "pointer" }}>←</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: FG }}>
              June 2026
            </span>
            <span style={{ color: MUTED, cursor: "pointer" }}>→</span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 4,
              textAlign: "center",
              fontSize: 13,
            }}
          >
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div
                key={d}
                style={{ fontWeight: 600, color: MUTED, padding: "4px 0" }}
              >
                {d}
              </div>
            ))}
            {Array.from({ length: 30 }, (_, i) => {
              const day = i + 1;
              const isSel = day === 15;
              const isToday = day === 15;
              const isPast = day < 15;
              return (
                <div
                  key={i}
                  style={{
                    padding: "6px 0",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: isSel ? 700 : isToday ? 600 : 400,
                    background: isSel
                      ? ACCENT
                      : isToday
                        ? "rgba(99,102,241,0.12)"
                        : "transparent",
                    color: isSel ? "#fff" : isPast ? MUTED : FG,
                    opacity: isPast ? 0.3 : 1,
                    cursor: isPast ? "default" : "pointer",
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            background: "#1a1a2e",
            borderRadius: 12,
            padding: 20,
            border: "1px solid rgba(148,163,184,0.12)",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: MUTED,
              marginBottom: 12,
            }}
          >
            June 15, 2026
          </div>
          {["9:00a", "9:30a", "10:00a", "10:30a", "11:00a", "11:30a"].map(
            (t, i) => (
              <div
                key={t}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid rgba(148,163,184,0.1)",
                  marginBottom: 6,
                  fontSize: 14,
                  fontFamily: "monospace",
                  color: FG,
                  background:
                    i === 2
                      ? "rgba(99,102,241,0.15)"
                      : "rgba(255,255,255,0.03)",
                  cursor: "pointer",
                  opacity: fadeIn(frame, 25 + i * 3),
                }}
              >
                {t}
                {i === 2 && (
                  <span
                    style={{
                      float: "right",
                      fontSize: 11,
                      color: ACCENT,
                      fontWeight: 600,
                    }}
                  >
                    Selected
                  </span>
                )}
              </div>
            ),
          )}
        </div>
      </div>
      <div
        style={{
          marginTop: 16,
          opacity: fadeIn(frame, 50),
          display: "flex",
          gap: 8,
          alignItems: "center",
          color: MUTED,
          fontSize: 13,
        }}
      >
        <span style={{ color: GREEN }}>✦</span> Background polling every 15s —
        slots update automatically
      </div>
    </AbsoluteFill>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  SCENE 2 — Booking Confirmation
// ════════════════════════════════════════════════════════════════════════

function ConfirmationScene({ frame }: { frame: number }) {
  return (
    <AbsoluteFill
      style={{
        background: BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT,
        padding: 40,
      }}
    >
      <div style={scaleIn(frame, 10)}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            background: "rgba(52,211,153,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            margin: "0 auto 16px",
          }}
        >
          ✅
        </div>
      </div>
      <h2
        style={{
          fontSize: 36,
          fontWeight: 700,
          color: FG,
          margin: "0 0 8px",
          opacity: fadeIn(frame, 25),
        }}
      >
        Booking Confirmed
      </h2>
      <p
        style={{
          fontSize: 20,
          color: MUTED,
          margin: "0 0 4px",
          opacity: fadeIn(frame, 32),
        }}
      >
        30 Min Call with Jane Doe
      </p>
      <p style={{ fontSize: 18, color: MUTED, opacity: fadeIn(frame, 38) }}>
        June 15, 2026 — 9:00–9:30am
      </p>
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 24,
          opacity: fadeIn(frame, 44),
        }}
      >
        <div
          style={{
            padding: "10px 24px",
            borderRadius: 8,
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          📎 Add to Calendar (.ics)
        </div>
      </div>
      <div
        style={{
          marginTop: 24,
          display: "flex",
          gap: 24,
          opacity: fadeIn(frame, 50),
          fontSize: 13,
          color: MUTED,
        }}
      >
        <div>
          <span style={{ color: GREEN }}>✓</span> Confirmation email sent
        </div>
        <div>
          <span style={{ color: GREEN }}>✓</span> Cancellation link provided
        </div>
        <div>
          <span style={{ color: GREEN }}>✓</span> Host notified
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  SCENE 3 — Login Flow (email OTP)
// ════════════════════════════════════════════════════════════════════════

function LoginScene({ frame }: { frame: number }) {
  return (
    <AbsoluteFill
      style={{
        background: BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT,
        padding: 40,
      }}
    >
      <Title
        text="Passwordless Login"
        subtitle="Email OTP — no passwords to remember"
        frame={frame}
      />
      <div
        style={{
          marginTop: 24,
          opacity: fadeIn(frame, 20),
          width: "80%",
          maxWidth: 440,
        }}
      >
        <div
          style={{
            background: "#1a1a2e",
            borderRadius: 12,
            padding: 24,
            border: "1px solid rgba(148,163,184,0.15)",
          }}
        >
          <div style={{ fontSize: 14, color: MUTED, marginBottom: 8 }}>
            Email address
          </div>
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              background: "rgba(0,0,0,0.2)",
              border: "1px solid rgba(148,163,184,0.2)",
              color: FG,
              fontSize: 16,
              marginBottom: 16,
            }}
          >
            jane@example.com
          </div>
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            Send Login Code
          </div>
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 8,
              background: "rgba(52,211,153,0.08)",
              border: "1px solid rgba(52,211,153,0.2)",
              fontSize: 14,
              color: GREEN,
              opacity: fadeIn(frame, 40),
              textAlign: "center",
            }}
          >
            ✓ 6-digit code sent • Expires in 10 min
          </div>
        </div>
        <div
          style={{
            marginTop: 16,
            textAlign: "center",
            fontSize: 13,
            color: MUTED,
            opacity: fadeIn(frame, 48),
          }}
        >
          60-second resend throttle • 5-attempt lockout • JWT sessions
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  SCENE 4 — Host Dashboard
// ════════════════════════════════════════════════════════════════════════

function HostDashboardScene({ frame }: { frame: number }) {
  return (
    <AbsoluteFill
      style={{
        background: BG,
        display: "flex",
        flexDirection: "column",
        fontFamily: FONT,
        padding: 24,
      }}
    >
      <h2
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: FG,
          textAlign: "center",
          marginBottom: 16,
          opacity: fadeIn(frame, 0),
        }}
      >
        Host Dashboard
      </h2>
      <div
        style={{ display: "flex", gap: 16, flex: 1, opacity: fadeIn(frame, 8) }}
      >
        <div
          style={{
            flex: 1,
            background: "#1a1a2e",
            borderRadius: 12,
            padding: 20,
            border: "1px solid rgba(148,163,184,0.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 999,
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              JD
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: FG }}>
                Jane Doe
              </div>
              <div style={{ fontSize: 13, color: MUTED }}>jane@example.com</div>
            </div>
          </div>
          {[
            { label: "Event Types", desc: "Meeting types you offer" },
            { label: "Schedule", desc: "Your weekly availability" },
            { label: "Exceptions", desc: "Vacations, blockouts" },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid rgba(148,163,184,0.12)",
                background: "rgba(99,102,241,0.04)",
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 600,
                color: FG,
                display: "flex",
                justifyContent: "space-between",
                opacity: fadeIn(frame, 12 + i * 4),
              }}
            >
              <div>
                <div>{item.label}</div>
                <div style={{ fontWeight: 400, fontSize: 12, color: MUTED }}>
                  {item.desc}
                </div>
              </div>
              <span
                style={{ color: MUTED, fontWeight: 400, alignSelf: "center" }}
              >
                →
              </span>
            </div>
          ))}
          <div
            style={{
              marginTop: 12,
              padding: "10px 14px",
              borderRadius: 8,
              background: "rgba(148,163,184,0.06)",
              fontSize: 13,
              color: MUTED,
              opacity: fadeIn(frame, 28),
            }}
          >
            Timezone: America/New_York (auto-detected from browser)
          </div>
          <div
            style={{
              marginTop: 8,
              opacity: fadeIn(frame, 34),
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: MUTED,
            }}
          >
            <span style={{ color: GREEN }}>●</span> Avatar upload (resize to
            200×200 on client)
          </div>
        </div>
        <div
          style={{
            flex: 1,
            background: "#1a1a2e",
            borderRadius: 12,
            padding: 20,
            border: "1px solid rgba(148,163,184,0.12)",
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: FG,
              marginBottom: 16,
            }}
          >
            Upcoming Bookings
          </div>
          {[
            { time: "9:00a", title: "30 Min Call", client: "Alice Smith" },
            { time: "10:30a", title: "Consultation", client: "Bob Jones" },
            { time: "2:00p", title: "Strategy Session", client: "Carol Lee" },
          ].map((b, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid rgba(148,163,184,0.1)",
                marginBottom: 8,
                opacity: fadeIn(frame, 16 + i * 5),
              }}
            >
              <div style={{ textAlign: "center", minWidth: 60 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: FG,
                    fontFamily: "monospace",
                  }}
                >
                  {b.time}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: FG }}>
                  {b.title}
                </div>
                <div style={{ fontSize: 12, color: MUTED }}>{b.client}</div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "rgba(52,211,153,0.12)",
                  color: GREEN,
                  alignSelf: "center",
                }}
              >
                Upcoming
              </span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  SCENE 5 — Schedule Editor
// ════════════════════════════════════════════════════════════════════════

function ScheduleScene({ frame }: { frame: number }) {
  const days = [
    { name: "Monday", start: "9:00a", end: "5:00p" },
    { name: "Tuesday", start: "9:00a", end: "5:00p" },
    { name: "Wednesday", start: "9:00a", end: "5:00p" },
    { name: "Thursday", start: "9:00a", end: "5:00p" },
    { name: "Friday", start: "9:00a", end: "5:00p" },
    { name: "Saturday", on: false },
    { name: "Sunday", on: false },
  ];
  return (
    <AbsoluteFill
      style={{
        background: BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: FONT,
        padding: "40px 60px",
      }}
    >
      <Title
        text="Weekly Schedule Editor"
        subtitle="Recurring availability — clicked to toggle off"
        frame={frame}
      />
      <div
        style={{
          width: "100%",
          maxWidth: 500,
          marginTop: 24,
          opacity: fadeIn(frame, 20),
        }}
      >
        {days.map((d, i) => (
          <div
            key={d.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              borderRadius: 8,
              border:
                d.on !== false
                  ? "1px solid rgba(148,163,184,0.15)"
                  : "1px dashed rgba(148,163,184,0.2)",
              background:
                d.on !== false ? "rgba(99,102,241,0.04)" : "transparent",
              marginBottom: 6,
              opacity: fadeIn(frame, 25 + i * 3),
            }}
          >
            <span
              style={{ fontWeight: 600, fontSize: 15, color: FG, width: 100 }}
            >
              {d.name}
            </span>
            {d.on !== false ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: "rgba(0,0,0,0.2)",
                    fontFamily: "monospace",
                    fontSize: 14,
                    color: FG,
                  }}
                >
                  {d.start}
                </span>
                <span style={{ color: MUTED, fontSize: 13 }}>to</span>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: "rgba(0,0,0,0.2)",
                    fontFamily: "monospace",
                    fontSize: 14,
                    color: FG,
                  }}
                >
                  {d.end}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: 13, color: MUTED }}>Not available</span>
            )}
          </div>
        ))}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 16,
            opacity: fadeIn(frame, 48),
          }}
        >
          <div
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Save
          </div>
          <div
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "1px solid rgba(148,163,184,0.15)",
              color: MUTED,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Cancel
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  SCENE 6 — Availability Exceptions
// ════════════════════════════════════════════════════════════════════════

function ExceptionsScene({ frame }: { frame: number }) {
  const exceptions = [
    { type: "🚫 Full-day block", title: "Italy Vacation", date: "Jul 1–15" },
    {
      type: "✂️ Window block",
      title: "Dentist Appointment",
      date: "Jun 10, 2–3pm",
    },
    { type: "🕐 Custom hours", title: "WFH Day", date: "Apr 20, 10am–4pm" },
  ];
  const recurring = [
    { type: "✂️ Window", title: "Team Standup", schedule: "Tuesday 10–11am" },
    {
      type: "🕐 Custom hours",
      title: "Summer Hours",
      schedule: "Mon–Thu 8am–4pm",
    },
  ];
  return (
    <AbsoluteFill
      style={{
        background: BG,
        display: "flex",
        flexDirection: "column",
        fontFamily: FONT,
        padding: "40px 60px",
      }}
    >
      <Title
        text="Availability Exceptions"
        subtitle="Vacations, window blocks, split shifts"
        frame={frame}
      />
      <div
        style={{
          display: "flex",
          gap: 24,
          marginTop: 24,
          width: "100%",
          maxWidth: 900,
          opacity: fadeIn(frame, 20),
        }}
      >
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: FG,
              marginBottom: 12,
            }}
          >
            Date-Specific
          </h3>
          {exceptions.map((e, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid rgba(148,163,184,0.12)",
                background: "rgba(99,102,241,0.03)",
                marginBottom: 6,
                opacity: fadeIn(frame, 25 + i * 5),
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: FG,
                  minWidth: 110,
                }}
              >
                {e.type}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: FG }}>
                  {e.title}
                </div>
                <div style={{ fontSize: 12, color: MUTED }}>{e.date}</div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "rgba(248,113,113,0.1)",
                  color: RED,
                  cursor: "pointer",
                }}
              >
                Delete
              </span>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: FG,
              marginBottom: 12,
            }}
          >
            Recurring
          </h3>
          {recurring.map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid rgba(148,163,184,0.12)",
                background: "rgba(99,102,241,0.03)",
                marginBottom: 6,
                opacity: fadeIn(frame, 35 + i * 5),
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: FG,
                  minWidth: 110,
                }}
              >
                {r.type}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: FG }}>
                  {r.title}
                </div>
                <div style={{ fontSize: 12, color: MUTED }}>{r.schedule}</div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "rgba(248,113,113,0.1)",
                  color: RED,
                  cursor: "pointer",
                }}
              >
                Delete
              </span>
            </div>
          ))}
          <div
            style={{
              marginTop: 8,
              opacity: fadeIn(frame, 48),
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: MUTED,
            }}
          >
            <span style={{ color: ACCENT }}>↻</span> Split-shift aware —
            carve-out algorithm
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  SCENE 7 — Event Types
// ════════════════════════════════════════════════════════════════════════

function EventTypesScene({ frame }: { frame: number }) {
  const types = [
    { title: "30 Min Call", slug: "30min", dur: "30 min", active: true },
    { title: "Consultation", slug: "consult", dur: "45 min", active: true },
    {
      title: "Strategy Session",
      slug: "strategy",
      dur: "60 min",
      active: true,
    },
    { title: "Quick Chat", slug: "quick", dur: "15 min", active: false },
  ];
  return (
    <AbsoluteFill
      style={{
        background: BG,
        display: "flex",
        flexDirection: "column",
        fontFamily: FONT,
        padding: "40px 60px",
      }}
    >
      <Title
        text="Event Types"
        subtitle="Customize meeting durations, buffers, and notice periods"
        frame={frame}
      />
      <div
        style={{
          display: "flex",
          gap: 24,
          marginTop: 24,
          width: "100%",
          maxWidth: 800,
          opacity: fadeIn(frame, 20),
        }}
      >
        <div
          style={{
            flex: 1,
            background: "#1a1a2e",
            borderRadius: 12,
            padding: 20,
            border: "1px solid rgba(148,163,184,0.12)",
          }}
        >
          {types.map((t, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid rgba(148,163,184,0.1)",
                marginBottom: 6,
                opacity: t.active
                  ? fadeIn(frame, 25 + i * 4)
                  : fadeIn(frame, 25 + i * 4) * 0.5,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: FG }}>
                  {t.title}
                </div>
                <div style={{ fontSize: 12, color: MUTED }}>
                  {t.dur} · /{t.slug}
                  {!t.active && " · inactive"}
                </div>
              </div>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: "pointer",
                  background: "rgba(99,102,241,0.08)",
                  color: ACCENT,
                }}
              >
                Edit
              </span>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: "pointer",
                  color: RED,
                }}
              >
                Delete
              </span>
            </div>
          ))}
          <div
            style={{
              padding: "10px",
              borderRadius: 8,
              border: "1px dashed rgba(148,163,184,0.2)",
              textAlign: "center",
              fontSize: 14,
              color: MUTED,
              cursor: "pointer",
              marginTop: 8,
              opacity: fadeIn(frame, 48),
            }}
          >
            + New Event Type
          </div>
        </div>
        <div
          style={{
            flex: 1,
            opacity: fadeIn(frame, 30),
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {[
            { label: "Duration", val: "15, 30, 45, 60 min" },
            { label: "Buffer before", val: "0–30 min padding" },
            { label: "Buffer after", val: "0–30 min padding" },
            { label: "Min. notice", val: "4–48 hours ahead" },
            { label: "Auto-slug", val: "Generated from title" },
          ].map((f, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: "1px solid rgba(148,163,184,0.06)",
                opacity: fadeIn(frame, 35 + i * 3),
              }}
            >
              <span style={{ fontSize: 14, color: MUTED }}>{f.label}</span>
              <span style={{ fontSize: 14, color: FG, fontWeight: 600 }}>
                {f.val}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  SCENE 8 — Admin Dashboard
// ════════════════════════════════════════════════════════════════════════

function AdminDashboardScene({ frame }: { frame: number }) {
  const hosts = [
    { name: "Jane Doe", email: "jane@example.com", active: true },
    { name: "John Smith", email: "john@example.com", active: true },
    { name: "Alice Wang", email: "alice@example.com", active: false },
  ];
  return (
    <AbsoluteFill
      style={{
        background: BG,
        display: "flex",
        flexDirection: "column",
        fontFamily: FONT,
        padding: 24,
      }}
    >
      <h2
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: FG,
          marginBottom: 16,
          opacity: fadeIn(frame, 0),
        }}
      >
        Admin Dashboard
      </h2>
      <div style={{ display: "flex", gap: 16, flex: 1 }}>
        <div
          style={{
            width: 200,
            background: "#1a1a2e",
            borderRadius: 12,
            padding: 16,
            border: "1px solid rgba(148,163,184,0.12)",
            opacity: fadeIn(frame, 5),
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "rgba(99,102,241,0.1)",
              color: ACCENT,
              fontWeight: 600,
              fontSize: 14,
              marginBottom: 4,
            }}
          >
            Hosts
          </div>
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              color: MUTED,
              fontSize: 14,
            }}
          >
            Settings
          </div>
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 8,
              background: "rgba(251,191,36,0.06)",
              border: "1px solid rgba(251,191,36,0.15)",
              opacity: fadeIn(frame, 10),
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: YELLOW,
                marginBottom: 8,
              }}
            >
              Email Quota
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: FG }}>247</div>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}>
              / 300 sent today
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 999,
                background: "rgba(148,163,184,0.15)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: "82%",
                  borderRadius: 999,
                  background: YELLOW,
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: YELLOW, marginTop: 6 }}>
              ⚠ 80% soft alert — reminders skipped
            </div>
          </div>
        </div>
        <div
          style={{
            flex: 1,
            background: "#1a1a2e",
            borderRadius: 12,
            padding: 20,
            border: "1px solid rgba(148,163,184,0.12)",
            opacity: fadeIn(frame, 8),
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 700, color: FG }}>
              Hosts ({hosts.length})
            </span>
            <div
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Add Host
            </div>
          </div>
          {hosts.map((h, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid rgba(148,163,184,0.1)",
                marginBottom: 6,
                opacity: h.active
                  ? fadeIn(frame, 15 + i * 4)
                  : fadeIn(frame, 15 + i * 4) * 0.45,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {h.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: FG }}>
                  {h.name}
                </div>
                <div style={{ fontSize: 12, color: MUTED }}>{h.email}</div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: h.active
                    ? "rgba(52,211,153,0.12)"
                    : "rgba(148,163,184,0.1)",
                  color: h.active ? GREEN : MUTED,
                }}
              >
                {h.active ? "Active" : "Off"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  SCENE 9 — Easy Install App
// ════════════════════════════════════════════════════════════════════════

function InstallScene({ frame }: { frame: number }) {
  const steps = [
    {
      num: "1",
      title: "Create Cloudflare Account",
      desc: "Free account in 2 minutes",
    },
    {
      num: "2",
      title: "Auto-Provision D1 & Pages",
      desc: "Wrangler CLI runs in background",
    },
    {
      num: "3",
      title: "Connect Brevo Email",
      desc: "300 free emails/day — test validation",
    },
    { num: "4", title: "Set Admin Profile", desc: "Name, email, timezone" },
    {
      num: "5",
      title: "Build & Deploy",
      desc: "Compiled and live on Cloudflare Edge",
    },
  ];
  return (
    <AbsoluteFill
      style={{
        background: BG,
        display: "flex",
        flexDirection: "column",
        fontFamily: FONT,
        padding: "40px 60px",
      }}
    >
      <Title
        text="One-Click Local Installer"
        subtitle="A guided wizard for non-technical users"
        frame={frame}
      />
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 20,
          width: "100%",
          maxWidth: 800,
          opacity: fadeIn(frame, 20),
        }}
      >
        {steps.map((s, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              padding: "14px 10px",
              borderRadius: 10,
              background: "rgba(99,102,241,0.06)",
              border: "1px solid rgba(99,102,241,0.15)",
              opacity: fadeIn(frame, 25 + i * 5),
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                background: ACCENT,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                margin: "0 auto 8px",
              }}
            >
              {s.num}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: FG,
                marginBottom: 4,
              }}
            >
              {s.title}
            </div>
            <div style={{ fontSize: 11, color: MUTED }}>{s.desc}</div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 24,
          width: "100%",
          maxWidth: 600,
          opacity: fadeIn(frame, 48),
          background: "#1a1a2e",
          borderRadius: 10,
          padding: 16,
          border: "1px solid rgba(148,163,184,0.12)",
          fontFamily: "monospace",
          fontSize: 13,
          color: MUTED,
          lineHeight: 1.6,
        }}
      >
        <div style={{ color: GREEN }}>$ npm run install-wizard</div>
        <div style={{ opacity: fadeIn(frame, 52) }}>
          {" "}
          ✓ Cloudflare account configured
        </div>
        <div style={{ opacity: fadeIn(frame, 56) }}>
          {" "}
          ✓ D1 database provisioned
        </div>
        <div style={{ opacity: fadeIn(frame, 60) }}>
          {" "}
          ✓ Brevo API key validated
        </div>
        <div style={{ opacity: fadeIn(frame, 64) }}>
          {" "}
          ✓ Admin account created
        </div>
        <div style={{ opacity: fadeIn(frame, 68), color: GREEN }}>
          ✓ Deployed to Cloudflare Pages 🚀
        </div>
      </div>
      <div
        style={{
          marginTop: 12,
          opacity: fadeIn(frame, 72),
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 12,
          color: MUTED,
        }}
      >
        <span style={{ color: ACCENT }}>🔒</span> Installer runs locally — never
        deployed to production
      </div>
    </AbsoluteFill>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  SCENE 10 — Free Hosting Stack
// ════════════════════════════════════════════════════════════════════════

function HostingStackScene({ frame }: { frame: number }) {
  const tiers = [
    {
      name: "Neon PostgreSQL",
      cap: "500 MB storage",
      tag: "Free",
      color: ACCENT,
      desc: "JSONB, pgvector, pg_trgm built in",
    },
    {
      name: "Cloudflare Pages",
      cap: "100K req/day",
      tag: "Free",
      color: ACCENT,
      desc: "Global edge — sub-ms cold starts",
    },
    {
      name: "Brevo Email",
      cap: "300 emails/day",
      tag: "Free",
      color: ACCENT,
      desc: "REST API — no SMTP needed",
    },
  ];
  return (
    <AbsoluteFill
      style={{
        background: BG,
        display: "flex",
        flexDirection: "column",
        fontFamily: FONT,
        padding: "40px 60px",
      }}
    >
      <Title
        text="100% Free Hosting Stack"
        subtitle="Runs entirely on free tiers — $0/month"
        frame={frame}
      />
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 24,
          width: "100%",
          maxWidth: 800,
          opacity: fadeIn(frame, 20),
        }}
      >
        {tiers.map((t, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: "#1a1a2e",
              borderRadius: 12,
              padding: 20,
              border: "1px solid rgba(148,163,184,0.12)",
              opacity: fadeIn(frame, 25 + i * 6),
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: FG,
                marginBottom: 4,
              }}
            >
              {t.name}
            </div>
            <div style={{ fontSize: 13, color: MUTED, marginBottom: 12 }}>
              {t.desc}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 14, color: FG, fontWeight: 600 }}>
                {t.cap}
              </span>
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: "rgba(52,211,153,0.12)",
                  color: GREEN,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {t.tag}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 24,
          opacity: fadeIn(frame, 48),
          background: "rgba(99,102,241,0.04)",
          borderRadius: 12,
          padding: 20,
          border: "1px solid rgba(99,102,241,0.12)",
          width: "100%",
          maxWidth: 800,
        }}
      >
        <div
          style={{ fontSize: 15, fontWeight: 600, color: FG, marginBottom: 4 }}
        >
          Scales to ~25 Hosts / 125 bookings/day
        </div>
        <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
          Email is the bottleneck (300/day). Database and compute have 5×
          headroom.
          <br />
          Grow beyond? Upgrade Brevo to Starter ($25/mo) — 20K emails/month.
        </div>
      </div>
      <div
        style={{
          marginTop: 12,
          opacity: fadeIn(frame, 56),
          display: "flex",
          gap: 16,
          fontSize: 12,
          color: MUTED,
        }}
      >
        <span>PostgREST auto-generates REST API from schema</span>
        <span>·</span>
        <span>RLS enforces row-level security</span>
        <span>·</span>
        <span>Zero hand-written API routes</span>
      </div>
    </AbsoluteFill>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  SCENE 11 — Features Grid (compact)
// ════════════════════════════════════════════════════════════════════════

function FeaturesScene({ frame }: { frame: number }) {
  const features = [
    { icon: "🔑", label: "Passwordless Auth", desc: "Email OTP" },
    { icon: "📅", label: "Dynamic Scheduling", desc: "Conflict detection" },
    { icon: "🏖️", label: "Exceptions", desc: "Vacations, blocks" },
    { icon: "📧", label: "Notifications", desc: "Brevo 300/day" },
    { icon: "📊", label: "Email Telemetry", desc: "Live quota" },
    { icon: "📎", label: ".ics Calendar", desc: "Apple/Outlook" },
    { icon: "👥", label: "Multi-User", desc: "Admin provisions" },
    { icon: "🆓", label: "100% Free Tier", desc: "$0/month" },
  ];
  return (
    <AbsoluteFill
      style={{
        background: BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT,
        padding: "40px 60px",
      }}
    >
      <h2
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: FG,
          margin: "0 0 24px",
          opacity: fadeIn(frame, 0),
        }}
      >
        OpenSchedule
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: "12px",
          width: "100%",
          maxWidth: 900,
        }}
      >
        {features.map((f, i) => (
          <div
            key={f.label}
            style={{
              ...slideIn(frame, 4 + i * 3, 12, "up"),
              padding: "14px 12px",
              borderRadius: 10,
              background: "rgba(99,102,241,0.04)",
              border: "1px solid rgba(99,102,241,0.10)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 6 }}>{f.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: FG }}>
              {f.label}
            </div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
              {f.desc}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  SCENE 12 — Outro
// ════════════════════════════════════════════════════════════════════════

function OutroScene({ frame }: { frame: number }) {
  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(135deg, #0f0f1a 0%, #1a1a3e 50%, #0f0f1a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT,
        padding: 40,
      }}
    >
      <div style={scaleIn(frame, 3)}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: 700,
            color: "#fff",
            margin: "0 auto 20px",
            boxShadow: "0 4px 24px rgba(99,102,241,0.3)",
          }}
        >
          OS
        </div>
      </div>
      <h2
        style={{
          fontSize: 36,
          fontWeight: 700,
          color: FG,
          margin: 0,
          opacity: fadeIn(frame, 12),
        }}
      >
        OpenSchedule
      </h2>
      <p
        style={{
          fontSize: 18,
          color: MUTED,
          marginTop: 8,
          opacity: fadeIn(frame, 18),
        }}
      >
        A free, self-hosted Calendly replacement
      </p>
      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 28,
          flexWrap: "wrap",
          justifyContent: "center",
          opacity: fadeIn(frame, 24),
        }}
      >
        {[
          "Neon PostgreSQL",
          "PostgREST",
          "Astro SSR",
          "React",
          "Cloudflare Pages",
          "Brevo",
        ].map((tech) => (
          <span
            key={tech}
            style={{
              padding: "5px 12px",
              borderRadius: 999,
              background: "rgba(99,102,241,0.1)",
              color: ACCENT,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {tech}
          </span>
        ))}
      </div>
      <p
        style={{
          fontSize: 15,
          color: MUTED,
          marginTop: 32,
          opacity: fadeIn(frame, 32),
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        github.com/SASS-Killers/OpenSchedule
      </p>
      <p
        style={{
          fontSize: 13,
          color: MUTED,
          marginTop: 8,
          opacity: fadeIn(frame, 36),
        }}
      >
        185+ tests · 81% coverage · MIT license
      </p>
    </AbsoluteFill>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  MAIN COMPOSITION
// ════════════════════════════════════════════════════════════════════════

export const OpenScheduleDemo: React.FC = () => {
  const frame = useCurrentFrame();

  // Scene offsets (cumulative)
  const s = [
    0,
    S5,
    S5 + S4,
    S5 + S4 + S4,
    S5 + S4 + S4 + S5,
    S5 + S4 + S4 + S5 + S4,
    S5 + S4 + S4 + S5 + S4 + S4,
    S5 + S4 + S4 + S5 + S4 + S4 + S4,
    S5 + S4 + S4 + S5 + S4 + S4 + S4 + S5,
    S5 + S4 + S4 + S5 + S4 + S4 + S4 + S5 + S5,
    S5 + S4 + S4 + S5 + S4 + S4 + S4 + S5 + S5 + S4,
    S5 + S4 + S4 + S5 + S4 + S4 + S4 + S5 + S5 + S4 + S3,
  ];
  //   S5   S4   S4   S5   S4   S4   S4   S5   S5   S4   S3   S3
  //    0   150  270  390  540  660  780  900  1050 1200 1320 1410 = total 1500 frames = 50s

  return (
    <AbsoluteFill style={{ background: BG }}>
      <Sequence durationInFrames={S5}>
        <BookingWidgetScene frame={frame} />
      </Sequence>
      <Sequence from={s[1]} durationInFrames={S4}>
        <ConfirmationScene frame={frame - s[1]} />
      </Sequence>
      <Sequence from={s[2]} durationInFrames={S4}>
        <LoginScene frame={frame - s[2]} />
      </Sequence>
      <Sequence from={s[3]} durationInFrames={S5}>
        <HostDashboardScene frame={frame - s[3]} />
      </Sequence>
      <Sequence from={s[4]} durationInFrames={S4}>
        <ScheduleScene frame={frame - s[4]} />
      </Sequence>
      <Sequence from={s[5]} durationInFrames={S4}>
        <ExceptionsScene frame={frame - s[5]} />
      </Sequence>
      <Sequence from={s[6]} durationInFrames={S4}>
        <EventTypesScene frame={frame - s[6]} />
      </Sequence>
      <Sequence from={s[7]} durationInFrames={S5}>
        <AdminDashboardScene frame={frame - s[7]} />
      </Sequence>
      <Sequence from={s[8]} durationInFrames={S5}>
        <InstallScene frame={frame - s[8]} />
      </Sequence>
      <Sequence from={s[9]} durationInFrames={S4}>
        <HostingStackScene frame={frame - s[9]} />
      </Sequence>
      <Sequence from={s[10]} durationInFrames={S3}>
        <FeaturesScene frame={frame - s[10]} />
      </Sequence>
      <Sequence from={s[11]} durationInFrames={S3}>
        <OutroScene frame={frame - s[11]} />
      </Sequence>
    </AbsoluteFill>
  );
};
