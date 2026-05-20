import { useState } from "react";

export function Avatar({ userId, name, size = "3.5rem" }: { userId: string; name: string; size?: string }) {
  const [failed, setFailed] = useState(false);
  const [src, setSrc] = useState(`/api/avatar?userId=${userId}`);

  const reload = () => {
    setSrc(`/api/avatar?userId=${userId}&t=${Date.now()}`);
    setFailed(false);
  };

  // Expose reload globally so the upload handler can trigger it
  if (typeof window !== "undefined") (window as any).__avatarReload = reload;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {!failed && (
        <img
          src={src}
          alt=""
          onLoad={() => setFailed(false)}
          onError={() => setFailed(true)}
          style={{
            width: "100%", height: "100%", borderRadius: "999px",
            objectFit: "cover", display: "block",
            background: "linear-gradient(135deg, var(--app-primary), var(--app-primary-2))",
          }}
        />
      )}
      {failed && (
        <div style={{
          width: "100%", height: "100%", borderRadius: "999px",
          background: "linear-gradient(135deg, var(--app-primary), var(--app-primary-2))",
          display: "grid", placeItems: "center",
          fontWeight: 700, fontSize: `calc(${size} * 0.35)`, color: "#fff",
        }}>
          {name.charAt(0)}
        </div>
      )}
    </div>
  );
}
