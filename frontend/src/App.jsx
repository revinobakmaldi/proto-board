import React, { useState, useCallback, useEffect, useRef } from "react";
import axios from "axios";
import { toPng } from "html-to-image";
import Auth from "./pages/Auth";
import Layouts from "./pages/Layouts";
import Canvas from "./components/Canvas";
import { COMPONENT_TYPES, COMPONENT_ICONS } from "./components/componentRegistry";
import { THEME } from "./theme";

let nextId = 1;
const genId = () => nextId++;

// ── Shared confirmation dialog ─────────────────────────────────────────────
function ConfirmDialog({ title, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff", borderRadius: 12,
        padding: "28px 32px", minWidth: 300, maxWidth: 380,
        boxShadow: "0 16px 48px rgba(0,0,0,0.25)",
        fontFamily: "Segoe UI, sans-serif",
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: THEME.primary, marginBottom: 8 }}>
          {title}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button onClick={onCancel} style={{
            padding: "8px 18px",
            background: THEME.surface, border: `1px solid ${THEME.border}`,
            borderRadius: 7, fontSize: 13, fontWeight: 600,
            color: THEME.primary, cursor: "pointer",
            fontFamily: "Segoe UI",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            padding: "8px 18px",
            background: THEME.bad, border: "none",
            borderRadius: 7, fontSize: 13, fontWeight: 600,
            color: "#fff", cursor: "pointer",
            fontFamily: "Segoe UI",
          }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [view, setView] = useState("editor");
  const [currentLayout, setCurrentLayout] = useState(null);
  const [layoutName, setLayoutName] = useState("Untitled");
  const [components, setComponents] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const canvasAreaRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (token && !currentLayout && view === "editor") {
      axios.get("/api/layouts", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          if (res.data.length > 0) loadLayout(res.data[0]);
          else createNewLayout();
        })
        .catch(() => { setToken(null); localStorage.removeItem("token"); });
    }
  }, [token]);

  // ── Ctrl+S / Cmd+S keyboard shortcut ────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  const loadLayout = (layout) => {
    setCurrentLayout(layout);
    setLayoutName(layout.name);
    setComponents(layout.components || []);
    setIsSaved(true);
    setLastSavedAt(layout.updated_at ? new Date(layout.updated_at) : new Date());
    setView("editor");
  };

  const createNewLayout = async () => {
    try {
      const res = await axios.post("/api/layouts", { name: "Untitled" }, { headers: { Authorization: `Bearer ${token}` } });
      loadLayout(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSave = useCallback(async () => {
    if (!currentLayout || isSaving) return;
    setIsSaving(true);
    setIsSaved(false);
    try {
      await axios.put(`/api/layouts/${currentLayout.id}`, { name: layoutName, components }, { headers: { Authorization: `Bearer ${token}` } });
      setIsSaved(true);
      setLastSavedAt(new Date());
    } catch (err) { console.error(err); }
    finally { setIsSaving(false); }
  }, [currentLayout, layoutName, components, token, isSaving]);

  const handleAddComponent = useCallback((compType) => {
    const comp = {
      id: genId(),
      type: compType.type,
      x: 40 + Math.random() * 80,
      y: 40 + Math.random() * 80,
      w: compType.defaultSize.w,
      h: compType.defaultSize.h,
      data: compType.defaultDataFn(),
    };
    setIsSaved(false);
    setComponents((prev) => [...prev, comp]);
    setPickerOpen(false);
  }, []);

  const handleUpdateComponent = useCallback((id, updates) => {
    setIsSaved(false);
    setComponents((prev) => prev.map((c) => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const handleDeleteComponent = useCallback((id) => {
    setIsSaved(false);
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleDuplicateComponent = useCallback((id) => {
    const comp = components.find((c) => c.id === id);
    if (!comp) return;
    const newComp = { ...comp, id: genId(), x: comp.x + 20, y: comp.y + 20, data: { ...comp.data } };
    setIsSaved(false);
    setComponents((prev) => [...prev, newComp]);
  }, [components]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setToken(null); setCurrentLayout(null); setComponents([]);
    localStorage.removeItem("token");
  };

  const handleExport = useCallback(() => {
    const el = canvasAreaRef.current;
    if (!el) return;
    toPng(el, { backgroundColor: "#ffffff", pixelRatio: 2 })
      .then((dataUrl) => {
        const a = document.createElement("a");
        a.download = `${layoutName.replace(/\s+/g, "-").toLowerCase()}.png`;
        a.href = dataUrl;
        a.click();
      })
      .catch(console.error);
  }, [layoutName]);

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  if (!token) return <Auth onLogin={(tok) => setToken(tok)} />;
  if (view === "layouts") return <Layouts token={token} onBack={() => setView("editor")} onSelect={loadLayout} />;

  if (showLogoutConfirm) return (
    <ConfirmDialog
      title="Logout? Unsaved changes will be lost."
      onConfirm={confirmLogout}
      onCancel={() => setShowLogoutConfirm(false)}
    />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#1a1a1a", fontFamily: "Segoe UI", overflow: "hidden" }}>

      {/* ── Top toolbar ───────────────────────── */}
      <div style={{
        height: 52, background: "#3D3331",
        display: "flex", alignItems: "center",
        padding: "0 16px", gap: 12, flexShrink: 0, zIndex: 100, position: "relative",
      }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
          Proto<span style={{ color: THEME.accent }}>Board</span>
        </div>
        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)" }} />

        {/* Add component */}
        <button onClick={() => setPickerOpen((v) => !v)} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
          background: pickerOpen ? THEME.accent : "rgba(255,255,255,0.12)",
          border: "none", borderRadius: 6,
          color: pickerOpen ? THEME.primary : "#fff",
          fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          <span style={{ fontSize: 16 }}>+</span> Add Component
        </button>

        {isSaved && lastSavedAt && (
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
            Saved {Math.floor((Date.now() - lastSavedAt) / 60000)}m ago
          </span>
        )}

        <div style={{ flex: 1 }} />

        <button onClick={handleSave} disabled={isSaving} style={{
          padding: "6px 14px",
          background: isSaved ? "#16a34a" : THEME.accent,
          border: "none", borderRadius: 6,
          color: isSaved ? "#fff" : THEME.primary,
          fontSize: 13, fontWeight: 600, cursor: isSaving ? "not-allowed" : "pointer",
          opacity: isSaving ? 0.7 : 1,
        }}>
          {isSaving ? "Saving..." : isSaved ? "Saved ✓" : "Save"}
        </button>
        <button onClick={handleExport} style={{
          padding: "6px 12px",
          background: "rgba(255,255,255,0.12)",
          border: "none", borderRadius: 6,
          color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          Export PNG
        </button>
        <button onClick={() => setView("layouts")} style={{
          padding: "6px 12px", background: "rgba(255,255,255,0.12)",
          border: "none", borderRadius: 6, color: "#fff", fontSize: 13, cursor: "pointer",
        }}>Layouts</button>
        <button onClick={handleLogout} style={{
          padding: "6px 12px", background: "rgba(255,255,255,0.12)",
          border: "none", borderRadius: 6, color: "#fff", fontSize: 13, cursor: "pointer",
        }}>Logout</button>
      </div>

      {/* ── Main area (sidebar + canvas) ─────── */}
      <div ref={canvasAreaRef} className="canvas-area" style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>

        {/* Canvas (fills remaining space) */}
        <Canvas
          innerRef={canvasRef}
          components={components}
          onUpdate={handleUpdateComponent}
          onDelete={handleDeleteComponent}
          onDuplicate={handleDuplicateComponent}
        />

        {/* Sidebar overlay */}
        <div style={{
          position: "absolute", left: 0, top: 0,
          width: 240, height: "100%",
          background: "#fff",
          borderRight: "1px solid #e5e5e5",
          display: "flex", flexDirection: "column",
          zIndex: 10,
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
        }}>
          {/* Logo */}
          <div style={{ padding: "20px 16px", borderBottom: "1px solid #f0f0f0" }}>
            <div style={{ fontSize: 11, color: "#FF2600", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 6 }}>COMPANY LOGO</div>
            <div style={{ fontSize: 12, color: "#888" }}>{layoutName}</div>
          </div>
          {/* Nav */}
          <div style={{ padding: "12px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
            {["Summary", "Revenue", "Operational"].map((item, i) => (
              <div key={item} style={{
                padding: "10px 12px", borderRadius: 8, fontSize: 13,
                fontWeight: i === 1 ? 600 : 400,
                color: i === 1 ? "#fff" : "#4E342E",
                background: i === 1 ? "#3D3331" : "transparent", cursor: "default",
              }}>{item}</div>
            ))}
          </div>
          {/* Metadata */}
          <div style={{ marginTop: "auto", padding: "16px", borderTop: "1px solid #f0f0f0", fontSize: 10, color: "#aaa", lineHeight: 1.8 }}>
            <div>Data Last Updated</div>
            <div style={{ color: "#888", fontWeight: 500 }}>{today}</div>
            <div style={{ marginTop: 6 }}>This Week Period</div>
            <div style={{ color: "#888", fontWeight: 500 }}>2026-03-10 — 2026-03-16</div>
            <div style={{ marginTop: 6 }}>Last Week Period</div>
            <div style={{ color: "#888", fontWeight: 500 }}>2026-03-03 — 2026-03-09</div>
          </div>
        </div>

        {/* Header overlay */}
        <div style={{
          position: "absolute", left: 240, top: 0, right: 0,
          height: 64, background: "#fff",
          borderBottom: "1px solid #e5e5e5",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 32px", zIndex: 10,
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#3D3331" }}>
            {layoutName}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#aaa" }}>Summary Filter Aktif</div>
              <div style={{ fontSize: 12, color: "#FF2600", fontWeight: 600 }}>No active filters</div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </div>
        </div>

        {/* ── Component Picker ──────────────────── */}
        {pickerOpen && (
          <div style={{
            position: "absolute", top: 60, left: 16,
            background: "#fff",
            border: `1px solid ${THEME.border}`,
            borderRadius: 10, padding: "8px",
            zIndex: 200,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            display: "flex", flexDirection: "column", gap: 4, minWidth: 200,
          }}>
            <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, padding: "4px 8px 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Components
            </div>
            {COMPONENT_TYPES.map((comp) => (
              <button
                key={comp.type}
                onClick={() => handleAddComponent(comp)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px",
                  background: THEME.surface,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: 8, cursor: "pointer",
                  textAlign: "left", fontFamily: "Segoe UI", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = THEME.accent; e.currentTarget.style.background = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = THEME.border; e.currentTarget.style.background = THEME.surface; }}
              >
                <span style={{ color: THEME.primary }}>{COMPONENT_ICONS[comp.type]}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: THEME.primary }}>{comp.label}</div>
                  <div style={{ fontSize: 10, color: "#8D6E63" }}>{comp.defaultSize.w}×{comp.defaultSize.h}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
