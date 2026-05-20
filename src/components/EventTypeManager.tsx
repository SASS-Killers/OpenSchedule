import { useState, useEffect } from "react";

interface EventType {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  duration: number;
  buffer_before: number;
  buffer_after: number;
  minimum_notice: number;
  is_active: number;
}

function emptyForm() {
  return { title: "", slug: "", description: "", duration: 30, bufferBefore: 0, bufferAfter: 0, minimumNotice: 4 };
}

export function EventTypeManager() {
  const [types, setTypes] = useState<EventType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/event-types");
    setTypes(await res.json());
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const body = editing ? { id: editing, ...form } : form;
    await fetch("/api/admin/event-types", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm());
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/admin/event-types?id=${id}`, { method: "DELETE" });
    load();
  };

  const edit = (t: EventType) => {
    setForm({
      title: t.title,
      slug: t.slug,
      description: t.description || "",
      duration: t.duration,
      bufferBefore: t.buffer_before,
      bufferAfter: t.buffer_after,
      minimumNotice: t.minimum_notice,
    });
    setEditing(t.id);
    setShowForm(true);
  };

  const cancel = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm());
  };

  const slugFromTitle = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {/* List */}
      {types.length === 0 && !showForm && (
        <p style={{ color: "var(--app-text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "2rem" }}>
          No event types yet. Create your first one.
        </p>
      )}
      {types.map((t) => (
        <div
          key={t.id}
          style={{
            display: "flex", alignItems: "center", gap: "1rem",
            padding: "0.85rem 1rem",
            borderRadius: "0.7rem",
            border: "1px solid var(--app-border)",
            background: t.is_active ? "rgba(99,102,241,0.04)" : "transparent",
            opacity: t.is_active ? 1 : 0.5,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: "0.92rem" }}>{t.title}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--app-text-muted)" }}>
              {t.duration} min &middot; /{t.slug} {!t.is_active && "&middot; inactive"}
            </div>
          </div>
          <button onClick={() => edit(t)} className="app-btn" style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem", minHeight: 0 }}>Edit</button>
          <button onClick={() => remove(t.id)} className="app-btn" style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem", minHeight: 0, color: "#f87171" }}>Delete</button>
        </div>
      ))}

      {/* Form */}
      {showForm && (
        <div style={{
          display: "grid", gap: "0.75rem",
          padding: "1.25rem", borderRadius: "0.7rem",
          border: "1px solid var(--app-border)",
          background: "rgba(255,255,255,0.03)",
        }}>
          <div style={{ display: "grid", gap: "0.3rem" }}>
            <label style={{ fontSize: "0.8rem", color: "var(--app-text-muted)" }}>Title</label>
            <input type="text" value={form.title} placeholder="e.g. 30 Minute Call"
              onChange={(e) => setForm({ ...form, title: e.target.value, slug: editing ? form.slug : slugFromTitle(e.target.value) })}
              style={inputStyle} />
          </div>
          <div style={{ display: "grid", gap: "0.3rem" }}>
            <label style={{ fontSize: "0.8rem", color: "var(--app-text-muted)" }}>URL Slug</label>
            <input type="text" value={form.slug} placeholder="e.g. 30min"
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              style={{ ...inputStyle, fontFamily: "monospace" }} />
          </div>
          <div style={{ display: "grid", gap: "0.3rem" }}>
            <label style={{ fontSize: "0.8rem", color: "var(--app-text-muted)" }}>Description (optional)</label>
            <input type="text" value={form.description} placeholder="A quick call to catch up"
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div style={{ display: "grid", gap: "0.3rem" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--app-text-muted)" }}>Duration (min)</label>
              <input type="number" value={form.duration} min={5} step={5}
                onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 30 })}
                style={inputStyle} />
            </div>
            <div style={{ display: "grid", gap: "0.3rem" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--app-text-muted)" }}>Min. Notice (hours)</label>
              <input type="number" value={form.minimumNotice} min={0}
                onChange={(e) => setForm({ ...form, minimumNotice: parseInt(e.target.value) || 4 })}
                style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button onClick={save} disabled={!form.title || !form.slug || saving}
              className="app-btn app-btn-primary" style={{ padding: "0.6rem 1.25rem" }}>
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </button>
            <button onClick={cancel} className="app-btn" style={{ padding: "0.6rem 1.25rem" }}>Cancel</button>
          </div>
        </div>
      )}

      {!showForm && (
        <button onClick={() => setShowForm(true)} className="app-btn" style={{
          padding: "0.85rem", justifyContent: "center",
          border: "1px dashed var(--app-border)", width: "100%",
        }}>
          + New Event Type
        </button>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.7rem",
  borderRadius: "0.45rem",
  border: "1px solid var(--app-border)",
  background: "rgba(0,0,0,0.2)",
  color: "#fff",
  fontSize: "0.88rem",
  outline: "none",
};
