import { useEffect, useRef } from "react";
import { FuzzySearch } from "@/ui/fuzzy-search";

let ALL_TZS: string[] = [];
try {
  ALL_TZS = ((Intl as any).supportedValuesOf?.("timeZone") ?? [])
    .filter((tz: string) => !tz.includes("/Etc/") && !tz.startsWith("System/"));
} catch { /* SSR-safe */ }

export function TimezonePicker({ value, onChange }: { value: string; onChange?: (tz: string) => void }) {
  const initRef = useRef(false);
  const selectedRef = useRef(value);

  // On mount: detect browser timezone and auto-save if stored is a generic default
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const browser = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const defaults = ["UTC", "America/New_York", "America/Los_Angeles", "America/Chicago", "Europe/London"];
    if (browser && browser !== selectedRef.current && defaults.includes(selectedRef.current)) {
      selectedRef.current = browser;
      if (onChange) {
        onChange(browser);
      } else {
        fetch("/api/host/timezone", {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: `timezone=${encodeURIComponent(browser)}`,
        });
      }
    }
  }, []);

  const handleChange = (tz: string) => {
    selectedRef.current = tz;
    if (onChange) {
      onChange(tz);
    } else {
      fetch("/api/host/timezone", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: `timezone=${encodeURIComponent(tz)}`,
      });
    }
  };

  return (
    <FuzzySearch
      items={ALL_TZS}
      value={selectedRef.current}
      onChange={handleChange}
      placeholder="Search timezone…"
      groupBy={(tz) => tz.split("/").slice(0, -1).join(" / ") || "Other"}
      displayName={(tz) => tz.replace(/_/g, " ")}
    />
  );
}
