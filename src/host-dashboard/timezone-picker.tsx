import { useEffect, useRef, useState } from "react";
import { FuzzySearch } from "@/ui/fuzzy-search";

// Lazy init to avoid SSR module caching issues
function getTimezones(): string[] {
  try {
    return ((Intl as any).supportedValuesOf?.("timeZone") ?? [])
      .filter((tz: string) => !tz.includes("/Etc/") && !tz.startsWith("System/"));
  } catch {
    return [];
  }
}

export function TimezonePicker({ value, onChange }: { value: string; onChange?: (tz: string) => void }) {
  const initRef = useRef(false);
  const selectedRef = useRef(value);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true); // trigger re-render on client with real timezones
  }, []);

  // On mount: detect browser timezone and auto-save if stored is a generic default
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const browser = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const defaults = ["UTC", "America/New_York", "America/Los_Angeles", "America/Chicago", "Europe/London"];
    if (browser && browser !== selectedRef.current && defaults.includes(selectedRef.current)) {
      selectedRef.current = browser;
      if (onChange) onChange(browser);
      else fetch("/api/host/timezone", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: `timezone=${encodeURIComponent(browser)}`,
      });
    }
  }, []);

  const handleChange = (tz: string) => {
    selectedRef.current = tz;
    if (onChange) onChange(tz);
    else fetch("/api/host/timezone", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: `timezone=${encodeURIComponent(tz)}`,
    });
  };

  const tzs = ready ? getTimezones() : [];

  return (
    <FuzzySearch
      items={tzs}
      value={selectedRef.current}
      onChange={handleChange}
      placeholder="Search timezone…"
      groupBy={(tz) => tz.split("/").slice(0, -1).join(" / ") || "Other"}
      displayName={(tz) => tz.replace(/_/g, " ")}
    />
  );
}
