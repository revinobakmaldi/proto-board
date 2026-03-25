import React, { useState, useCallback, useEffect } from "react";
import axios from "axios";
import Auth from "./pages/Auth";
import Layouts from "./pages/Layouts";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Canvas from "./components/Canvas";
import { THEME } from "./theme";

let nextId = 1;
const genId = () => nextId++;

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [view, setView] = useState("editor"); // "editor" | "layouts"
  const [currentLayout, setCurrentLayout] = useState(null);
  const [layoutName, setLayoutName] = useState("Untitled");
  const [components, setComponents] = useState([]);
  const [tokenFn, setTokenFn] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Track mobile/desktop — only runs client-side after mount
  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

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

  const handleLogin = (tok) => {
    setToken(tok);
    setTokenFn(tok);
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentLayout(null);
    setComponents([]);
    localStorage.removeItem("token");
  };

  // Auth
  if (!token) {
    return <Auth onLogin={handleLogin} />;
  }

  // Layout list
  if (view === "layouts") {
    return <Layouts token={token} onBack={() => setView("editor")} onSelect={loadLayout} />;
  }

  // Editor
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: THEME.surface, fontFamily: "Segoe UI" }}>
      <Header
        layoutName={layoutName}
        onNameChange={setLayoutName}
        onSave={handleSave}
        onLayouts={() => setView("layouts")}
        onLogout={handleLogout}
        isSaving={isSaving}
        isSaved={isSaved}
        lastSavedAt={lastSavedAt}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        isMobile={isMobile}
      />
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        {/* Sidebar: hidden on mobile unless toggled open */}
        <div style={{
          width: isMobile ? (sidebarOpen ? 200 : 0) : 200,
          flexShrink: 0,
          transition: "width 0.2s ease",
          overflow: "hidden",
          position: "relative",
        }}>
          {(!isMobile || sidebarOpen) && (
            <Sidebar onAdd={(comp) => { handleAddComponent(comp); if (isMobile) setSidebarOpen(false); }} />
          )}
        </div>
        {/* Canvas area */}
        <div
          className="canvas-area"
          style={{
            flex: 1,
            position: "relative",
            overflow: "auto",
            minWidth: 0,
          }}
        >
          <Canvas
            components={components}
            onUpdate={handleUpdateComponent}
            onDelete={handleDeleteComponent}
            onDuplicate={handleDuplicateComponent}
          />
        </div>
      </div>
    </div>
  );
}
