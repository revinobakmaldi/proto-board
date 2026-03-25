import React, { useState } from "react";
import { THEME } from "../theme";
import { FloppyDisk, Export, FolderOpen, SignOut, List, X } from "@phosphor-icons/react";
import { toPng } from "html-to-image";

export default function Header({ layoutName, onNameChange, onSave, onExport, onLayouts, onLogout, isSaving, isSaved, lastSavedAt, sidebarOpen, onToggleSidebar, isMobile }) {
  const [editing, setEditing] = useState(false);

  const handleExport = () => {
    const el = document.querySelector(".canvas-area");
    if (!el) return;
    toPng(el, { backgroundColor: THEME.surface, pixelRatio: 2 })
      .then((dataUrl) => {
        const a = document.createElement("a");
        a.download = `${layoutName.replace(/\s+/g, "-").toLowerCase()}.png`;
        a.href = dataUrl;
        a.click();
      })
      .catch(console.error);
  };

  // Save button label + color
  const primary = !isSaved;
  const saveLabel = isSaving ? "Saving..." : isSaved ? "Saved ✓" : "Save";
  const saveBg = isSaved ? "#4caf50" : primary ? THEME.accent : "rgba(255,255,255,0.12)";
  const saveColor = isSaved ? "#fff" : primary ? THEME.primary : "#fff";

  return (
    <div style={{
      background: THEME.primary,
      display: "flex", alignItems: "center", padding: "8px 12px", gap: 8, flexShrink: 0, flexWrap: "wrap",
    }}>
      {/* Sidebar toggle on mobile */}
      {isMobile && (
        <button
          onClick={onToggleSidebar}
          style={{
            background: sidebarOpen ? THEME.accent : "rgba(255,255,255,0.15)",
            border: "none", borderRadius: 6, padding: "6px 8px",
            color: sidebarOpen ? THEME.primary : "#fff", cursor: "pointer", display: "flex",
          }}
        >
          {sidebarOpen ? <X size={18} weight="regular" /> : <List size={18} weight="regular" />}
        </button>
      )}

      {/* Logo */}
      <div style={{ color: "#fff", fontFamily: "Segoe UI", fontWeight: 700, fontSize: 15 }}>
        Proto<span style={{ color: THEME.accent }}>Board</span>
      </div>

      {/* Layout name */}
      {editing ? (
        <input
          autoFocus
          value={layoutName}
          onChange={(e) => onNameChange(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
          style={{
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 6, padding: "4px 10px", color: "#fff", fontSize: 14,
            fontFamily: "Segoe UI", outline: "none", maxWidth: isMobile ? 120 : 200,
          }}
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          style={{ color: "#fff", fontSize: 14, fontFamily: "Segoe UI", cursor: "pointer", opacity: 0.9 }}
        >
          {layoutName || "Untitled"} ✎
        </span>
      )}

      <div style={{ flex: 1 }} />

      {/* Save status indicator */}
      {isSaved && lastSavedAt && (
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontFamily: "Segoe UI" }}>
          Saved {formatRelative(lastSavedAt)}
        </span>
      )}

      <ToolbarButton icon={<FolderOpen size={18} weight="regular" />} label="Layouts" onClick={onLayouts} />
      <ToolbarButton icon={<FloppyDisk size={18} weight="regular" />} label={saveLabel} onClick={onSave} primary={primary} saveBg={saveBg} saveColor={saveColor} saving={isSaving} />
      <ToolbarButton icon={<Export size={18} weight="regular" />} label="Export PNG" onClick={handleExport} />
      <ToolbarButton icon={<SignOut size={18} weight="regular" />} label="Logout" onClick={onLogout} />
    </div>
  );
}

function formatRelative(date) {
  const diff = Math.floor((Date.now() - date) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function ToolbarButton({ icon, label, onClick, primary, saveBg, saveColor, saving }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 12px",
        background: saveBg || (primary ? THEME.accent : "rgba(255,255,255,0.12)"),
        border: "none", borderRadius: 6,
        color: saveColor || (primary ? THEME.primary : "#fff"),
        fontSize: 13, fontFamily: "Segoe UI", fontWeight: primary ? 600 : 400,
        cursor: saving ? "not-allowed" : "pointer", transition: "opacity 0.15s",
        opacity: saving ? 0.7 : 1,
      }}
      onMouseEnter={(e) => { if (!saving) e.currentTarget.style.opacity = 0.85; }}
      onMouseLeave={(e) => e.currentTarget.style.opacity = saving ? 0.7 : 1}
    >
      {icon} {label}
    </button>
  );
}
