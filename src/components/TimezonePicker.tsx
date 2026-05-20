import { useState, useRef, useEffect } from "react";

// All IANA timezones (from Intl API, filtered to remove legacy/aliases)
const ALL_TZS = (typeof Intl !== "undefined" && Intl.supportedValuesOf
  ? Intl.supportedValuesOf("timeZone")
  : [] as string[]
).filter((tz) => !tz.includes("/Etc/") && !tz.startsWith("System/"));

// Simple fuzzy match — checks if all chars in query appear in order in the target
function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (q[qi] === t[ti]) qi++;
  }
  return qi === q.length;
}

function groupTz(tz: string): string {
  const parts = tz.split("/");
  return parts.slice(0, -1).join(" / ");
}

export function TimezonePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (tz: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [selected, setSelected] = useState(value); // actual selected value for display
  const initRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // On mount: detect browser timezone and override if stored value looks like a default
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const browser = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const defaults = ["UTC", "America/New_York", "America/Los_Angeles", "America/Chicago", "Europe/London"];
    if (browser && browser !== selected && defaults.includes(selected)) {
      setSelected(browser);
      onChange(browser);
    }
  }, []);

  const displayName = (tz: string) => tz.replace(/_/g, " ");

  // Filter timezones by fuzzy match
  const filtered = query
    ? ALL_TZS.filter((tz) => fuzzyMatch(query, tz))
    : [];

  const select = (tz: string) => {
    setSelected(tz);
    onChange(tz);
    setOpen(false);
    setQuery("");
  };

  // Keyboard navigation
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[highlightIdx]) {
      e.preventDefault();
      select(filtered[highlightIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (open && listRef.current) {
      const item = listRef.current.children[highlightIdx] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIdx, open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.parentElement?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Group filtered results by region for display
  const grouped = filtered.reduce(
    (acc, tz) => {
      const region = groupTz(tz);
      if (!acc[region]) acc[region] = [];
      acc[region].push(tz);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  return (
    <div style={{ position: "relative", flex: 1 }}>
      {/* Input field — shows selected or acts as search */}
      <input
        ref={inputRef}
        type="text"
        placeholder="Search timezone…"
        value={open ? query : displayName(selected)}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlightIdx(0);
          if (!open) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        style={{
          width: "100%",
          padding: "0.55rem 0.75rem",
          borderRadius: "0.7rem",
          border: "1px solid var(--app-border)",
          background: "rgba(0,0,0,0.2)",
          color: "#fff",
          fontSize: "0.85rem",
          outline: "none",
          cursor: "text",
        }}
      />

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <div
          ref={listRef}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            maxHeight: "280px",
            overflowY: "auto",
            zIndex: 100,
            marginTop: "0.25rem",
            borderRadius: "0.7rem",
            border: "1px solid var(--app-border)",
            background: "rgba(3, 7, 18, 0.97)",
            backdropFilter: "blur(12px)",
            padding: "0.35rem",
          }}
        >
          {Object.entries(grouped).map(([region, tzs]) => (
            <div key={region}>
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--app-text-muted)",
                  padding: "0.4rem 0.6rem 0.2rem",
                }}
              >
                {region || "Other"}
              </div>
              {tzs.map((tz, i) => {
                const globalIdx = filtered.indexOf(tz);
                return (
                  <div
                    key={tz}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      select(tz);
                    }}
                    onMouseEnter={() => setHighlightIdx(globalIdx)}
                    style={{
                      padding: "0.4rem 0.6rem",
                      borderRadius: "0.4rem",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      background:
                        globalIdx === highlightIdx
                          ? "rgba(99,102,241,0.15)"
                          : "transparent",
                      color:
                        globalIdx === highlightIdx
                          ? "#fff"
                          : "var(--app-text)",
                    }}
                  >
                    {displayName(tz)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {open && query && filtered.length === 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 100,
            marginTop: "0.25rem",
            padding: "0.75rem",
            borderRadius: "0.7rem",
            border: "1px solid var(--app-border)",
            background: "rgba(3, 7, 18, 0.97)",
            fontSize: "0.85rem",
            color: "var(--app-text-muted)",
            textAlign: "center",
          }}
        >
          No timezones match "{query}"
        </div>
      )}
    </div>
  );
}
