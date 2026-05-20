import { useEffect, useRef } from "react";

export function Avatar({ userId, name, size = "3.5rem" }: { userId: string; name: string; size?: string }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);

  const reload = () => {
    if (imgRef.current) {
      imgRef.current.src = `/api/avatar?userId=${userId}&t=${Date.now()}`;
      imgRef.current.style.display = "block";
      if (fallbackRef.current) fallbackRef.current.style.display = "none";
    }
  };

  useEffect(() => {
    (window as any).__avatarReload = reload;
  }, []);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <img
        ref={imgRef}
        src={`/api/avatar?userId=${userId}`}
        alt=""
        onError={(e) => {
          (e.target as HTMLElement).style.display = "none";
          if (fallbackRef.current) fallbackRef.current.style.display = "grid";
        }}
        onLoad={(e) => {
          const img = e.target as HTMLImageElement;
          if (img.naturalWidth === 0) {
            img.style.display = "none";
            if (fallbackRef.current) fallbackRef.current.style.display = "grid";
          } else {
            img.style.display = "block";
            if (fallbackRef.current) fallbackRef.current.style.display = "none";
          }
        }}
        style={{
          width: "100%", height: "100%", borderRadius: "999px",
          objectFit: "cover",
          background: "linear-gradient(135deg, var(--app-primary), var(--app-primary-2))",
        }}
      />
      <div
        ref={fallbackRef}
        style={{
          position: "absolute", inset: 0,
          borderRadius: "999px",
          background: "linear-gradient(135deg, var(--app-primary), var(--app-primary-2))",
          display: "none", placeItems: "center",
          fontWeight: 700, fontSize: `calc(${size} * 0.35)`, color: "#fff",
        }}
      >
        {name.charAt(0)}
      </div>
    </div>
  );
}
