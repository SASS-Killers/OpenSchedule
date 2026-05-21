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

// Montserrat-like system font stack
const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

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

function scaleIn(frame: number, start: number, duration = 20) {
  const s = spring({
    frame: frame - start,
    fps: FPS,
    config: { damping: 12, stiffness: 100 },
  });
  return { opacity: Math.min(s, 1), transform: `scale(${0.5 + s * 0.5})` };
}

// ── Shared UI Components ────────────────────────────────────────────────

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

function MockWindow({
  children,
  label,
  frame,
  start = 0,
}: {
  children: React.ReactNode;
  label: string;
  frame: number;
  start?: number;
}) {
  const style = slideIn(frame, start);
  return (
    <div
      style={{
        ...style,
        width: "85%",
        maxWidth: 900,
        margin: "0 auto",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid rgba(148,163,184,0.2)",
        background: "#1a1a2e",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          padding: "10px 16px",
          background: "rgba(255,255,255,0.04)",
          borderBottom: "1px solid rgba(148,163,184,0.12)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13,
          color: MUTED,
          fontFamily: FONT,
        }}
      >
        <span
          style={{ width: 12, height: 12, borderRadius: 999, background: RED }}
        />
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: 999,
            background: "#fbbf24",
          }}
        />
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: 999,
            background: GREEN,
          }}
        />
        <span style={{ marginLeft: 12 }}>{label}</span>
      </div>
      {children}
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

// ── Scene: Intro ────────────────────────────────────────────────────────

function Intro({ frame }: { frame: number }) {
  const logoScale = scaleIn(frame, 5);
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
      <div style={logoScale}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            fontWeight: 700,
            color: "#fff",
            margin: "0 auto 24px",
            boxShadow: "0 4px 24px rgba(99,102,241,0.3)",
          }}
        >
          OS
        </div>
      </div>
      <h1
        style={{
          fontSize: 56,
          fontWeight: 800,
          color: FG,
          margin: 0,
          opacity: fadeIn(frame, 20),
          transform: `translateY(${interpolate(fadeIn(frame, 20), [0, 1], [20, 0])}px)`,
        }}
      >
        OpenSchedule
      </h1>
      <p
        style={{
          fontSize: 20,
          color: MUTED,
          marginTop: 12,
          opacity: fadeIn(frame, 30),
        }}
      >
        A free, self-hosted Calendly replacement
      </p>
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 40,
          opacity: fadeIn(frame, 40),
        }}
      >
        {["Neon", "PostgREST", "Astro", "Cloudflare"].map((tech) => (
          <span
            key={tech}
            style={{
              padding: "6px 16px",
              borderRadius: 999,
              background: "rgba(99,102,241,0.12)",
              color: ACCENT,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {tech}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
}

// ── Scene: Features Overview ────────────────────────────────────────────

function FeatureCards({ frame }: { frame: number }) {
  const features = [
    {
      icon: "🔑",
      label: "Passwordless Auth",
      desc: "Email OTP login, no passwords needed",
    },
    {
      icon: "📅",
      label: "Dynamic Scheduling",
      desc: "Real-time slot computation with conflict detection",
    },
    {
      icon: "🏖️",
      label: "Availability Exceptions",
      desc: "Vacations, window blocks, recurring rules",
    },
    {
      icon: "📧",
      label: "Email Notifications",
      desc: "OTP, confirmations, reminders via Brevo",
    },
    {
      icon: "📊",
      label: "Email Telemetry",
      desc: "Live quota tracking on admin dashboard",
    },
    {
      icon: "📎",
      label: ".ics Calendar Files",
      desc: "One-click add to Apple/Outlook calendar",
    },
    {
      icon: "👥",
      label: "Multi-User RBAC",
      desc: "Admin provisions Host accounts",
    },
    {
      icon: "🆓",
      label: "100% Free Tier",
      desc: "Neon + Cloudflare + Brevo — $0/month",
    },
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
          margin: "0 0 32px",
          opacity: fadeIn(frame, 0),
        }}
      >
        What OpenSchedule Offers
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px 32px",
          width: "100%",
          maxWidth: 900,
        }}
      >
        {features.map((f, i) => (
          <FeatureRow key={f.label} {...f} frame={frame} start={8 + i * 4} />
        ))}
      </div>
    </AbsoluteFill>
  );
}

// ── Scene: Login Flow ───────────────────────────────────────────────────

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
        subtitle="Email OTP — no passwords"
        frame={frame}
      />
      <div
        style={{
          marginTop: 32,
          opacity: fadeIn(frame, 25),
          width: "80%",
          maxWidth: 500,
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
            Email
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
            host@example.com
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
              opacity: fadeIn(frame, 45),
              textAlign: "center",
            }}
          >
            ✓ Code sent to host@example.com
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── Scene: Host Dashboard ───────────────────────────────────────────────

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
          marginBottom: 20,
          opacity: fadeIn(frame, 0),
        }}
      >
        Host Dashboard
      </h2>
      <div
        style={{
          display: "flex",
          gap: 16,
          flex: 1,
          opacity: fadeIn(frame, 10),
        }}
      >
        {/* Left column - Settings */}
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
          <div
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
            }}
          >
            Event Types
            <span style={{ color: MUTED, fontWeight: 400 }}>→</span>
          </div>
          <div
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
            }}
          >
            Schedule
            <span style={{ color: MUTED, fontWeight: 400 }}>→</span>
          </div>
          <div
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
            }}
          >
            Exceptions
            <span style={{ color: MUTED, fontWeight: 400 }}>→</span>
          </div>
          <div
            style={{
              marginTop: 16,
              padding: "10px 14px",
              borderRadius: 8,
              background: "rgba(148,163,184,0.06)",
              fontSize: 13,
              color: MUTED,
            }}
          >
            Timezone: America/New_York (auto-detected)
          </div>
        </div>

        {/* Right column - Bookings */}
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
            {
              time: "9:00a",
              title: "30 Min Call",
              client: "Alice Smith",
              status: "Upcoming",
            },
            {
              time: "10:30a",
              title: "Consultation",
              client: "Bob Jones",
              status: "Upcoming",
            },
            {
              time: "2:00p",
              title: "Strategy Session",
              client: "Carol Lee",
              status: "Upcoming",
            },
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
                opacity: fadeIn(frame, 20 + i * 6),
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
                {b.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── Scene: Schedule Editor ──────────────────────────────────────────────

function ScheduleScene({ frame }: { frame: number }) {
  const days = [
    { name: "Monday", on: true, start: "9:00a", end: "5:00p" },
    { name: "Tuesday", on: true, start: "9:00a", end: "5:00p" },
    { name: "Wednesday", on: true, start: "9:00a", end: "5:00p" },
    { name: "Thursday", on: true, start: "9:00a", end: "5:00p" },
    { name: "Friday", on: true, start: "9:00a", end: "5:00p" },
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
        subtitle="Set recurring availability"
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
              border: d.on
                ? "1px solid rgba(148,163,184,0.15)"
                : "1px dashed rgba(148,163,184,0.2)",
              background: d.on ? "rgba(99,102,241,0.04)" : "transparent",
              marginBottom: 6,
              opacity: d.on ? 1 : 0.55,
              opacity: fadeIn(frame, 25 + i * 3),
            }}
          >
            <span
              style={{ fontWeight: 600, fontSize: 15, color: FG, width: 100 }}
            >
              {d.name}
            </span>
            {d.on ? (
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
            opacity: fadeIn(frame, 50),
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
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── Scene: Availability Exceptions ──────────────────────────────────────

function ExceptionsScene({ frame }: { frame: number }) {
  const exceptions = [
    { type: "🚫 Full day", title: "Italy Vacation", date: "Jul 1–15, 2026" },
    { type: "✂️ Window", title: "Dentist Appointment", date: "Jun 10, 2–3pm" },
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
        subtitle="Vacations, window blocks, recurring rules"
        frame={frame}
      />
      <div
        style={{
          display: "flex",
          gap: 24,
          marginTop: 24,
          opacity: fadeIn(frame, 20),
          width: "100%",
          maxWidth: 900,
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
                gap: 12,
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
                  minWidth: 100,
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
                gap: 12,
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
                  minWidth: 100,
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
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── Scene: Booking Widget ───────────────────────────────────────────────

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
        text="Booking Widget"
        subtitle="Public calendar — no login required"
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
        {/* Calendar */}
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
              const isPast = day < 15;
              const isToday = day === 15;
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

        {/* Time slots */}
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
    </AbsoluteFill>
  );
}

// ── Scene: Admin Dashboard ──────────────────────────────────────────────

function AdminDashboardScene({ frame }: { frame: number }) {
  const hosts = [
    { name: "Jane Doe", email: "jane@example.com", role: "host", active: true },
    {
      name: "John Smith",
      email: "john@example.com",
      role: "host",
      active: true,
    },
    {
      name: "Alice Wang",
      email: "alice@example.com",
      role: "host",
      active: false,
    },
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
          marginBottom: 20,
          opacity: fadeIn(frame, 0),
        }}
      >
        Admin Dashboard
      </h2>
      <div style={{ display: "flex", gap: 16, flex: 1 }}>
        {/* Sidebar */}
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
            Email Quota
          </div>
          {/* Telemetry widget */}
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
                color: "#fbbf24",
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
                  background: "#fbbf24",
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: "#fbbf24", marginTop: 6 }}>
              ⚠ Soft alert: reminders may be skipped
            </div>
          </div>
        </div>

        {/* Main */}
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
                opacity: h.active ? 1 : 0.45,
                opacity: fadeIn(frame, 15 + i * 4),
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
                <div style={{ fontSize: 12, color: MUTED }}>
                  {h.email} · {h.role}
                </div>
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

// ── Scene: Booking Confirmation ────────────────────────────────────────

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
      <p
        style={{
          fontSize: 18,
          color: MUTED,
          opacity: fadeIn(frame, 38),
        }}
      >
        June 15, 9:00am – 9:30am
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
      <p
        style={{
          fontSize: 13,
          color: MUTED,
          marginTop: 20,
          opacity: fadeIn(frame, 50),
        }}
      >
        A confirmation email has been sent. Save this cancellation link.
      </p>
    </AbsoluteFill>
  );
}

// ── Scene: Stack/Tech — Outro ──────────────────────────────────────────

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
      <div style={{ opacity: fadeIn(frame, 5) }}>
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
          opacity: fadeIn(frame, 15),
        }}
      >
        OpenSchedule
      </h2>
      <p
        style={{
          fontSize: 18,
          color: MUTED,
          marginTop: 8,
          opacity: fadeIn(frame, 22),
        }}
      >
        100% free · self-hosted · open source
      </p>
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 32,
          opacity: fadeIn(frame, 30),
        }}
      >
        {[
          "Neon PostgreSQL",
          "PostgREST",
          "Astro SSR",
          "React",
          "Cloudflare",
          "Brevo",
        ].map((tech) => (
          <span
            key={tech}
            style={{
              padding: "6px 14px",
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
          fontSize: 16,
          color: MUTED,
          marginTop: 40,
          opacity: fadeIn(frame, 38),
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        github.com/SASS-Killers/OpenSchedule
      </p>
    </AbsoluteFill>
  );
}

// ── Main Composition ────────────────────────────────────────────────────

export const OpenScheduleDemo: React.FC = () => {
  const frame = useCurrentFrame();

  const SCENE_DURATION = 5 * FPS; // 5 seconds per scene = 150 frames

  return (
    <AbsoluteFill style={{ background: BG }}>
      {/* Scene 1: Intro (0-149) */}
      <Sequence durationInFrames={SCENE_DURATION}>
        <Intro frame={frame} />
      </Sequence>

      {/* Scene 2: Features (150-299) */}
      <Sequence from={SCENE_DURATION} durationInFrames={SCENE_DURATION}>
        <FeatureCards frame={frame - SCENE_DURATION} />
      </Sequence>

      {/* Scene 3: Login (300-449) */}
      <Sequence from={SCENE_DURATION * 2} durationInFrames={SCENE_DURATION}>
        <LoginScene frame={frame - SCENE_DURATION * 2} />
      </Sequence>

      {/* Scene 4: Host Dashboard (450-599) */}
      <Sequence from={SCENE_DURATION * 3} durationInFrames={SCENE_DURATION}>
        <HostDashboardScene frame={frame - SCENE_DURATION * 3} />
      </Sequence>

      {/* Scene 5: Schedule Editor (600-749) */}
      <Sequence from={SCENE_DURATION * 4} durationInFrames={SCENE_DURATION}>
        <ScheduleScene frame={frame - SCENE_DURATION * 4} />
      </Sequence>

      {/* Scene 6: Availability Exceptions (750-899) */}
      <Sequence from={SCENE_DURATION * 5} durationInFrames={SCENE_DURATION}>
        <ExceptionsScene frame={frame - SCENE_DURATION * 5} />
      </Sequence>

      {/* Scene 7: Booking Widget (900-1049) */}
      <Sequence from={SCENE_DURATION * 6} durationInFrames={SCENE_DURATION}>
        <BookingWidgetScene frame={frame - SCENE_DURATION * 6} />
      </Sequence>

      {/* Scene 8: Admin Dashboard (1050-1199) */}
      <Sequence from={SCENE_DURATION * 7} durationInFrames={SCENE_DURATION}>
        <AdminDashboardScene frame={frame - SCENE_DURATION * 7} />
      </Sequence>

      {/* Scene 9: Booking Confirmation (1200-1349) */}
      <Sequence from={SCENE_DURATION * 8} durationInFrames={SCENE_DURATION}>
        <ConfirmationScene frame={frame - SCENE_DURATION * 8} />
      </Sequence>

      {/* Scene 10: Outro (1350-1499) */}
      <Sequence from={SCENE_DURATION * 9} durationInFrames={SCENE_DURATION}>
        <OutroScene frame={frame - SCENE_DURATION * 9} />
      </Sequence>
    </AbsoluteFill>
  );
};
