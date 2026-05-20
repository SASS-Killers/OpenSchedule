import { useState, useRef, useEffect, type ReactNode } from "react";

interface Props {
  trigger: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Dropdown({ trigger, children, open: controlled, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlled ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 100,
            marginTop: "0.25rem",
            borderRadius: "0.7rem",
            border: "1px solid var(--app-border)",
            background: "rgba(3, 7, 18, 0.97)",
            backdropFilter: "blur(12px)",
            padding: "0.35rem",
            maxHeight: "280px",
            overflowY: "auto",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
