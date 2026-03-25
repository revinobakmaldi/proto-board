import React, { useRef, useState, useCallback, useEffect } from "react";
import { renderComponent } from "./componentRegistry";
import { THEME } from "../theme";
import { Trash, CopySimple } from "@phosphor-icons/react";

const CANVAS_W = 1440;
const CANVAS_H = 2560;
const SIDEBAR_W = 240;
const HEADER_H = 200;
const GRID = 8;
const MIN_W = 100;
const MIN_H = 80;

const snap = (v) => Math.round(v / GRID) * GRID;

const pointerPos = (e) => {
  if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  return { x: e.clientX, y: e.clientY };
};

// Clamp a component position to stay within the red zone
const clampRedZone = (comp) => ({
  x: Math.max(0, Math.min(comp.x, CANVAS_W - comp.w)),
  y: Math.max(0, Math.min(comp.y, CANVAS_H - comp.h)),
});

export default function Canvas({ components, onUpdate, onDelete, onDuplicate, layoutName }) {
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDraggingOrResizing, setIsDraggingOrResizing] = useState(false);
  const canvasRef = useRef(null);
  const activeTouchId = useRef(null);
  const canvasRect = useRef(null);

  // Responsive scale to fit viewport
  useEffect(() => {
    const updateScale = () => {
      if (!canvasRef.current) return;
      const container = canvasRef.current.parentElement;
      const scaleX = (container.clientWidth - 16) / CANVAS_W;
      const scaleY = (container.clientHeight - 16) / CANVAS_H;
      setScale(Math.min(scaleX, scaleY, 1));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const updateCanvasRect = useCallback(() => {
    if (canvasRef.current) {
      canvasRect.current = canvasRef.current.getBoundingClientRect();
    }
  }, []);

  const handlePointerDown = useCallback((e, comp) => {
    e.stopPropagation();
    updateCanvasRect();
    setSelected(comp.id);
    setIsDraggingOrResizing(true);
    const rect = canvasRect.current;
    const pos = pointerPos(e);
    setDragOffset({ x: pos.x - rect.left - comp.x, y: pos.y - rect.top - comp.y });
    setDragging(comp.id);
  }, [updateCanvasRect]);

  const handleResizePointerDown = useCallback((e, comp, dir) => {
    e.stopPropagation();
    if (e.changedTouches && e.changedTouches.length > 0) {
      activeTouchId.current = e.changedTouches[0].identifier;
    }
    updateCanvasRect();
    setSelected(comp.id);
    setIsDraggingOrResizing(true);
    const pos = pointerPos(e);
    setResizing({ id: comp.id, dir, startX: pos.x, startY: pos.y, origX: comp.x, origY: comp.y, origW: comp.w, origH: comp.h });
  }, [updateCanvasRect]);

  const handlePointerMove = useCallback((e) => {
    if (dragging || resizing) e.preventDefault();
    updateCanvasRect();
    const rect = canvasRect.current;
    if (!rect) return;

    if (dragging) {
      const pos = pointerPos(e);
      const x = snap(Math.max(0, pos.x - rect.left - dragOffset.x));
      const y = snap(Math.max(0, pos.y - rect.top - dragOffset.y));
      onUpdate(dragging, clampRedZone({ x, y, w: 0, h: 0 }));
    }
    if (resizing) {
      const pos = pointerPos(e);
      const dx = pos.x - resizing.startX;
      const dy = pos.y - resizing.startY;
      let x = resizing.origX, y = resizing.origY;
      let w = resizing.origW, h = resizing.origH;

      if (resizing.dir.includes("e")) w = snap(Math.max(MIN_W, resizing.origW + dx));
      if (resizing.dir.includes("s")) h = snap(Math.max(MIN_H, resizing.origH + dy));
      if (resizing.dir.includes("w")) {
        const newW = snap(Math.max(MIN_W, resizing.origW - dx));
        x = snap(resizing.origX + resizing.origW - newW);
        w = newW;
      }
      if (resizing.dir.includes("n")) {
        const newH = snap(Math.max(MIN_H, resizing.origH - dy));
        y = snap(resizing.origY + resizing.origH - newH);
        h = newH;
      }
      onUpdate(resizing.id, clampRedZone({ x, y, w, h }));
    }
  }, [dragging, resizing, dragOffset, onUpdate, updateCanvasRect]);

  const handlePointerUp = useCallback(() => {
    setDragging(null);
    setResizing(null);
    setIsDraggingOrResizing(false);
    activeTouchId.current = null;
  }, []);

  const handleTouchStart = useCallback((e, comp) => {
    if (activeTouchId.current !== null) return;
    activeTouchId.current = e.changedTouches[0].identifier;
    handlePointerDown(e, comp);
  }, [handlePointerDown]);

  const handleTouchMove = useCallback((e) => {
    const active = Array.from(e.changedTouches).find(t => t.identifier === activeTouchId.current);
    if (!active) return;
    if (dragging || resizing) e.preventDefault();
    handlePointerMove(e);
  }, [dragging, resizing, handlePointerMove]);

  const handleTouchEnd = useCallback((e) => {
    const active = Array.from(e.changedTouches).find(t => t.identifier === activeTouchId.current);
    if (!active) return;
    handlePointerUp();
  }, [handlePointerUp]);

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div
      ref={canvasRef}
      style={{
        width: CANVAS_W,
        height: CANVAS_H,
        background: "#F5F5F5",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        userSelect: isDraggingOrResizing ? "none" : "auto",
        WebkitUserSelect: isDraggingOrResizing ? "none" : "auto",
        touchAction: "none",
      }}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => setSelected(null)}
    >
      {/* ── SIDEBAR ─────────────────────────────── */}
      <div style={{
        position: "absolute",
        left: 0, top: 0,
        width: SIDEBAR_W,
        height: CANVAS_H,
        background: "#fff",
        borderRight: "1px solid #e5e5e5",
        display: "flex",
        flexDirection: "column",
        zIndex: 2,
      }}>
        {/* Logo area */}
        <div style={{ padding: "20px 16px", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ fontSize: 11, color: "#FF2600", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 6 }}>COMPANY LOGO</div>
          <div style={{ fontSize: 12, color: "#888" }}>{layoutName || "Dashboard"}</div>
        </div>

        {/* Nav items */}
        <div style={{ padding: "12px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
          {["Summary", "Revenue", "Operational"].map((item, i) => (
            <div key={item} style={{
              padding: "10px 12px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: i === 1 ? 600 : 400,
              color: i === 1 ? "#fff" : "#4E342E",
              background: i === 1 ? "#3D3331" : "transparent",
              cursor: "default",
            }}>
              {item}
            </div>
          ))}
        </div>

        {/* Metadata at bottom */}
        <div style={{ marginTop: "auto", padding: "16px", borderTop: "1px solid #f0f0f0", fontSize: 10, color: "#aaa", lineHeight: 1.8 }}>
          <div>Data Last Updated</div>
          <div style={{ color: "#888", fontWeight: 500 }}>{today}</div>
          <div style={{ marginTop: 6 }}>This Week Period</div>
          <div style={{ color: "#888", fontWeight: 500 }}>2026-03-10 — 2026-03-16</div>
          <div style={{ marginTop: 6 }}>Last Week Period</div>
          <div style={{ color: "#888", fontWeight: 500 }}>2026-03-03 — 2026-03-09</div>
        </div>
      </div>

      {/* ── HEADER ──────────────────────────────── */}
      <div style={{
        position: "absolute",
        left: SIDEBAR_W,
        top: 0,
        width: CANVAS_W - SIDEBAR_W,
        height: HEADER_H,
        background: "#fff",
        borderBottom: "1px solid #e5e5e5",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        zIndex: 2,
      }}>
        {/* Page title */}
        <div style={{ fontSize: 22, fontWeight: 700, color: "#3D3331", fontFamily: "Segoe UI, sans-serif" }}>
          {layoutName || "Executive Revenue Overview"}
        </div>
        {/* Filter status */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#aaa" }}>Summary Filter Aktif</div>
            <div style={{ fontSize: 12, color: "#FF2600", fontWeight: 600 }}>No active filters</div>
          </div>
          {/* Funnel icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
        </div>
      </div>

      {/* ── RED ZONE (editable canvas) ─────────── */}
      <div style={{
        position: "absolute",
        left: SIDEBAR_W,
        top: HEADER_H,
        width: CANVAS_W - SIDEBAR_W,
        height: CANVAS_H - HEADER_H,
        background: "#FF2600",
        overflow: "auto",
      }}>
        {/* Dotted grid inside red zone */}
        <div style={{
          position: "relative",
          width: CANVAS_W - SIDEBAR_W,
          height: CANVAS_H - HEADER_H,
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)`,
          backgroundSize: `${GRID}px ${GRID}px`,
        }}>
          {/* Components */}
          {components.map((comp) => {
            const isSelected = selected === comp.id;
            const isDragging = dragging === comp.id;
            return (
              <div
                key={comp.id}
                style={{
                  position: "absolute",
                  left: comp.x,
                  top: comp.y,
                  width: comp.w,
                  height: comp.h,
                  cursor: isDragging ? "grabbing" : "grab",
                  zIndex: isSelected ? 10 : 1,
                }}
                onMouseDown={(e) => { e.stopPropagation(); handlePointerDown(e, comp); }}
                onTouchStart={(e) => handleTouchStart(e, comp)}
                onClick={(e) => { e.stopPropagation(); setSelected(comp.id); }}
              >
                {/* Component content */}
                <div style={{ width: "100%", height: "100%", pointerEvents: "none" }}>
                  {renderComponent(comp.type, comp.data)}
                </div>

                {/* Selection border */}
                {isSelected && (
                  <div style={{
                    position: "absolute", inset: -2,
                    border: `2px dashed #fff`,
                    borderRadius: 6, pointerEvents: "none",
                  }} />
                )}

                {/* Toolbar below component */}
                {isSelected && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 10px)", left: 0,
                    display: "flex", gap: 4,
                    background: "#3D3331", borderRadius: 6,
                    padding: "4px 8px", zIndex: 20, whiteSpace: "nowrap",
                  }}>
                    {[
                      { icon: <CopySimple size={16} weight="regular" />, label: "Duplicate", onClick: () => onDuplicate(comp.id) },
                      { icon: <Trash size={16} weight="regular" />, label: "Delete", onClick: () => onDelete(comp.id) },
                    ].map((action, i) => (
                      <button key={i} onClick={action.onClick} title={action.label} style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#fff", padding: "4px 6px", borderRadius: 4,
                        display: "flex", alignItems: "center",
                      }}>
                        {action.icon}
                      </button>
                    ))}
                  </div>
                )}

                {/* Corner resize handles */}
                {isSelected && ["se", "sw", "ne", "nw"].map((dir) => {
                  const r = 8;
                  const cornerStyle = {
                    se: { right: -r, bottom: -r },
                    sw: { left: -r, bottom: -r },
                    ne: { right: -r, top: -r },
                    nw: { left: -r, top: -r },
                  }[dir];
                  return (
                    <div
                      key={dir}
                      onMouseDown={(e) => { e.stopPropagation(); handleResizePointerDown(e, comp, dir); }}
                      onTouchStart={(e) => { e.stopPropagation(); handleResizePointerDown(e, comp, dir); }}
                      style={{
                        position: "absolute",
                        width: 16, height: 16,
                        background: "#fff",
                        borderRadius: 3,
                        cursor: { se: "se-resize", sw: "sw-resize", ne: "ne-resize", nw: "nw-resize" }[dir],
                        zIndex: 21,
                        ...cornerStyle,
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
