import React, { useState, useEffect } from "react";
import axios from "axios";
import { THEME } from "../theme";
import { Plus, ArrowLeft, Trash, Clock } from "@phosphor-icons/react";

export default function Layouts({ token, onBack, onSelect }) {
  const [layouts, setLayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/layouts", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setLayouts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const handleCreate = async () => {
    try {
      const res = await axios.post("/api/layouts", { name: "Untitled" }, { headers: { Authorization: `Bearer ${token}` } });
      onSelect(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this layout?")) return;
    try {
      await axios.delete(`/api/layouts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setLayouts(layouts.filter((l) => l.id !== id));
    } catch (err) {
      alert("Failed to delete layout. Please try again.");
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", cursor: "pointer", color: THEME.primary,
          padding: "6px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 6,
          fontFamily: "Segoe UI", fontSize: 14,
        }}>
          <ArrowLeft size={16} /> Back
        </button>
        <h2 style={{ color: THEME.primary, fontFamily: "Segoe UI", fontSize: 22, fontWeight: 700, margin: 0 }}>My Layouts</h2>
      </div>

      <button onClick={handleCreate} style={{
        display: "flex", alignItems: "center", gap: 10, padding: "14px 20px",
        background: THEME.accent, border: "none", borderRadius: 10, cursor: "pointer",
        color: THEME.primary, fontFamily: "Segoe UI", fontSize: 14, fontWeight: 600,
        marginBottom: 24,
      }}>
        <Plus size={18} /> New Layout
      </button>

      {loading ? (
        <div style={{ color: "#8D6E63", fontFamily: "Segoe UI" }}>Loading...</div>
      ) : layouts.length === 0 ? (
        <div style={{ color: "#8D6E63", fontFamily: "Segoe UI", fontSize: 14 }}>No layouts yet. Create one above.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {layouts.map((layout) => (
            <div key={layout.id} onClick={() => onSelect(layout)} style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: "16px 20px", background: THEME.background,
              border: `1px solid ${THEME.border}`, borderRadius: 10,
              cursor: "pointer", transition: "border-color 0.15s",
            }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = THEME.accent}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = THEME.border}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: THEME.primary, fontFamily: "Segoe UI" }}>{layout.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 12, color: "#8D6E63", fontFamily: "Segoe UI" }}>
                  <Clock size={11} /> {formatDate(layout.updated_at)} · {layout.components?.length || 0} components
                </div>
              </div>
              <button onClick={(e) => handleDelete(layout.id, e)} style={{
                background: "none", border: "none", cursor: "pointer", color: THEME.bad,
                padding: 8, borderRadius: 6, display: "flex",
              }}>
                <Trash size={16} weight="regular" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
