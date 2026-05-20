import { useState, useRef, useEffect, useMemo } from "react";
import { Dropdown } from "@/ui/dropdown";

function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (q[qi] === t[ti]) qi++;
  }
  return qi === q.length;
}

interface Props {
  items: string[];
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  /** If provided, groups items by this prefix (e.g., "America/New_York" -> "America") */
  groupBy?: (item: string) => string;
  displayName?: (item: string) => string;
}

export function FuzzySearch({ items, value = "", onChange, placeholder = "Search…", groupBy, displayName }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [internalValue, setInternalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Show internal state if set, otherwise prop value
  const displayValue = internalValue || value;

  const filtered = useMemo(
    () => (query ? items.filter((i) => fuzzyMatch(query, i)) : []),
    [query, items],
  );

  const grouped = useMemo(() => {
    if (!groupBy) return { "": filtered };
    const g: Record<string, string[]> = {};
    for (const item of filtered) {
      const key = groupBy(item);
      if (!g[key]) g[key] = [];
      g[key].push(item);
    }
    return g;
  }, [filtered, groupBy]);

  const select = (item: string) => {
    setInternalValue(item);
    if (onChange) onChange(item);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlightIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && filtered[highlightIdx]) { e.preventDefault(); select(filtered[highlightIdx]); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  useEffect(() => {
    if (open && listRef.current) {
      const item = listRef.current.children[highlightIdx] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIdx, open]);

  const fmt = displayName || ((s: string) => s.replace(/_/g, " "));

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={open ? query : fmt(displayValue)}
        onFocus={() => { setOpen(true); setQuery(""); }}
        onChange={(e) => { setQuery(e.target.value); setHighlightIdx(0); if (!open) setOpen(true); }}
        onKeyDown={onKeyDown}
        style={{
          width: "100%", padding: "0.55rem 0.75rem", borderRadius: "0.7rem",
          border: "1px solid var(--app-border)", background: "rgba(0,0,0,0.2)",
          color: "#fff", fontSize: "0.85rem", outline: "none",
        }}
      />
      <Dropdown open={open} onOpenChange={setOpen}>
        <div ref={listRef}>
          {Object.entries(grouped).map(([region, regionItems]) => (
            <div key={region}>
              {region && (
                <div style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--app-text-muted)", padding: "0.4rem 0.6rem 0.2rem" }}>
                  {region}
                </div>
              )}
              {regionItems.map((item) => {
                const globalIdx = filtered.indexOf(item);
                return (
                  <div
                    key={item}
                    onMouseDown={(e) => { e.preventDefault(); select(item); }}
                    onMouseEnter={() => setHighlightIdx(globalIdx)}
                    style={{
                      padding: "0.4rem 0.6rem", borderRadius: "0.4rem", cursor: "pointer", fontSize: "0.85rem",
                      background: globalIdx === highlightIdx ? "rgba(99,102,241,0.15)" : "transparent",
                      color: globalIdx === highlightIdx ? "#fff" : "var(--app-text)",
                    }}
                  >
                    {fmt(item)}
                  </div>
                );
              })}
            </div>
          ))}
          {query && filtered.length === 0 && (
            <div style={{ padding: "0.75rem", textAlign: "center", fontSize: "0.85rem", color: "var(--app-text-muted)" }}>
              No matches for "{query}"
            </div>
          )}
        </div>
      </Dropdown>
    </div>
  );
}
