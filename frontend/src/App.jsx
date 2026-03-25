import React, { useState, useCallback, useEffect } from "react";
import axios from "axios";
import Auth from "./pages/Auth";
import Layouts from "./pages/Layouts";
import Canvas from "./components/Canvas";
import { COMPONENT_TYPES } from "./components/componentRegistry";
import { THEME } from "./theme";

let nextId = 1;
const genId = () => nextId++;

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [view, setView] = useState("editor"); // "editor" | "layouts"
  const [currentLayout, setCurrentLayout] = useState(null);
  const [layoutName, setLayoutName] = useState("Untitled");
  const [components, setComponents] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Auto-select first layout if logged in with no current layout
  useEffect(() => {
    if (token && !currentLayout && view === "editor") {
      axios.get("/api/layouts", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          if (res.data.length > 0) {
            loadLayout(res.data[0]);
          } else {
            createNewLayout();
          }
        })
        .catch(() => { setToken(null); localStorage.removeItem("token"); });
    }
  }, [token]);

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
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = useCallback(async () => {
    if (!currentLayout || isSaving) return;
    setIsSaving(true);
    setIsSaved(false);
    try {
      await axios.put(`/api/layouts/${currentLayout.id}`, {
        name: layoutName,
        components,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setIsSaved(true);
      setLastSavedAt(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
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
    setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
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
    setToken(null);
    setCurrentLayout(null);
    setComponents([]);
    localStorage.removeItem("token");
  };

  const saveLabel = isSaving ? "Saving..." : isSaved ? "Saved ✓" : "Save";
  const saveColor = isSaving ? "#aaa" : isSaved ? "#16a34a" : "#fff";

  // Auth
  if (!token) {
    return <Auth onLogin={(tok) => { setToken(tok); }} />;
  }

  // Layout list
  if (view === "layouts") {
    return <Layouts token={token} onBack={() => setView("editor")} onSelect={loadLayout} />;
  }

  // Editor
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#1a1a1a", fontFamily: "Segoe UI", overflow: "hidden" }}>

      {/* ── Floating Toolbar ─────────────────────── */}
      <div style={{
        height: 52,
        background: "#3D3331",
        display: "flex", alignItems: "center",
        padding: "0 16px", gap: 12, flexShrink: 0, zIndex: 100,
      }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
          Proto<span style={{ color: THEME.accent }}>Board</span>
        </div>

        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)" }} />

        {/* Add component */}
        <button
          onClick={() => setPickerOpen((v) => !v)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px",
            background: pickerOpen ? THEME.accent : "rgba(255,255,255,0.12)",
            border: "none", borderRadius: 6,
            color: pickerOpen ? THEME.primary : "#fff",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 16 }}>+</span> Add Component
        </button>

        {/* Save status */}
        {isSaved && lastSavedAt && (
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
            Saved {Math.floor((Date.now() - lastSavedAt) / 60000)}m ago
          </span>
        )}

        <div style={{ flex: 1 }} />

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            padding: "6px 14px",
            background: isSaved ? "#16a34a" : THEME.accent,
            border: "none", borderRadius: 6,
            color: isSaved ? "#fff" : THEME.primary,
            fontSize: 13, fontWeight: 600, cursor: isSaving ? "not-allowed" : "pointer",
            opacity: isSaving ? 0.7 : 1,
          }}
        >
          {saveLabel}
        </button>

        <button
          onClick={() => setView("layouts")}
          style={{
            padding: "6px 12px",
            background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 6,
            color: "#fff", fontSize: 13, cursor: "pointer",
          }}
        >
          Layouts
        </button>

        <button
          onClick={handleLogout}
          style={{
            padding: "6px 12px",
            background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 6,
            color: "#fff", fontSize: 13, cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {/* ── Component Picker ─────────────────────── */}
      {pickerOpen && (
        <div style={{
          position: "absolute", top: 52, left: 16,
          background: "#fff",
          border: `1px solid ${THEME.border}`,
          borderRadius: 10,
          padding: "8px",
          zIndex: 200,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          display: "flex", flexDirection: "column", gap: 4,
          minWidth: 200,
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
                textAlign: "left",
                fontFamily: "Segoe UI",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = THEME.accent; e.currentTarget.style.background = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = THEME.border; e.currentTarget.style.background = THEME.surface; }}
            >
              <span style={{ color: THEME.primary }}>{comp.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: THEME.primary }}>{comp.label}</div>
                <div style={{ fontSize: 10, color: "#8D6E63" }}>{comp.defaultSize.w}×{comp.defaultSize.h}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Canvas ────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
        <Canvas
          components={components}
          onUpdate={handleUpdateComponent}
          onDelete={handleDeleteComponent}
          onDuplicate={handleDuplicateComponent}
          layoutName={layoutName}
        />
      </div>
    </div>
  );
}
