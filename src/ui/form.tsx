import { useState, type FormEvent } from "react";

interface Props {
  fields: { name: string; label: string; type?: string; placeholder?: string; required?: boolean }[];
  submitLabel: string;
  onSubmit: (values: Record<string, string>) => Promise<{ ok: boolean; error?: string; data?: any }>;
  onSuccess?: (data: any) => void;
}

export function Form({ fields, submitLabel, onSubmit, onSuccess }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await onSubmit(values);
      if (result.ok && onSuccess) {
        onSuccess(result.data);
      } else if (!result.ok) {
        setError(result.error || "Something went wrong");
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem", width: "100%" }}>
      {fields.map((f) => (
        <div key={f.name} style={{ display: "grid", gap: "0.3rem" }}>
          {f.label && <label style={{ fontSize: "0.82rem", color: "var(--app-text-muted)" }}>{f.label}</label>}
          <input
            type={f.type || "text"}
            placeholder={f.placeholder}
            required={f.required}
            value={values[f.name] || ""}
            onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "0.85rem",
              border: "1px solid var(--app-border)",
              background: "rgba(255,255,255,0.03)",
              color: "#fff",
              fontSize: "0.95rem",
              outline: "none",
            }}
          />
        </div>
      ))}
      {error && <div style={{ color: "#f87171", fontSize: "0.85rem" }}>{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="app-btn app-btn-primary"
        style={{ justifyContent: "center", width: "100%", opacity: loading ? 0.6 : 1 }}
      >
        {loading ? "Sending…" : submitLabel}
      </button>
    </form>
  );
}
