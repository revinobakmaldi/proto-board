import React, { useRef, useState, useCallback } from "react";
import { renderComponent } from "./componentRegistry";
import { THEME } from "../theme";
import { Trash, CopySimple } from "@phosphor-icons/react";

const GRID = 8;

const snap = (v) => Math.round(v / GRID) * GRID;

// Normalize mouse or touch event → { x, y }
const pointerPos = (e) => {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
};

export default function Canvas({ components, onUpdate, onDelete, onDuplicate }) {
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const activeTouchId = useRef(null); // track which touch is dragging

  const handlePointerDown = useCallback((e, comp) => {
    e.stopPropagation();
    setSelected(comp.id);
    const rect = canvasRef.current.getBoundingClientRect();
    const pos = pointerPos(e);
    setDragOffset({ x: pos.x - rect.left - comp.x, y: pos.y - rect.top - comp.y });
    setDragging(comp.id);
  }, []);

  const handleResizePointerDown = useCallback((e, comp, dir) => {
    e.stopPropagation();
    setSelected(comp.id);
    const pos = pointerPos(e);
    setResizing({ id: comp.id, dir, startX: pos.x, startY: pos.y, origW: comp.w, origH: comp.h });
  }, []);

  const handlePointerMove = useCallback((e) => {
    // Prevent page scroll while dragging on canvas
    if (dragging || resizing) e.preventDefault();

    if (dragging && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const pos = pointerPos(e);
      const x = snap(Math.max(0, pos.x - rect.left - dragOffset.x));
      const y = snap(Math.max(0, pos.y - rect.top - dragOffset.y));
      onUpdate(dragging, { x, y });
    }
    if (resizing) {
      const pos = pointerPos(e);
      const dx = pos.x - resizing.startX;
      const dy = pos.y - resizing.startY;
      let w = resizing.origW, h = resizing.origH;
      if (resizing.dir.includes("e")) w = snap(Math.max(100, resizing.origW + dx));
      if (resizing.dir.includes("s")) h = snap(Math.max(80, resizing.origH + dy));
      if (resizing.dir.includes("w")) w = snap(Math.max(100, resizing.origW - dx));
      if (resizing.dir.includes("n")) h = snap(Math.max(80, resizing.origH - dy));
      onUpdate(resizing.id, { w, h });
    }
  }, [dragging, resizing, dragOffset, onUpdate]);

  const handlePointerUp = useCallback(() => {
    setDragging(null);
    setResizing(null);
    activeTouchId.current = null;
  }, []);

  // Touch start — detect which touch started on a draggable element
  const handleTouchStart = useCallback((e, comp) => {
    if (activeTouchId.current !== null) return; // already dragging
    activeTouchId.current = e.changedTouches[0].identifier;
    handlePointerDown(e, comp);
  }, [handlePointerDown]);

  // Touch move — only respond to the finger that's dragging
  const handleTouchMove = useCallback((e) => {
    const active = Array.from(e.changedTouches).find(t => t.identifier === activeTouchId.current);
    if (!active) return;
    if (dragging || resizing) e.preventDefault();
    handlePointerMove(e);
  }, [dragging, resizing, handlePointerMove]);

  // Touch end — only clear if it's the finger that was dragging
  const handleTouchEnd = useCallback((e) => {
    const active = Array.from(e.changedTouches).find(t => t.identifier === activeTouchId.current);
    if (!active) return;
    handlePointerUp();
  }, [handlePointerUp]);

  return (
    <div
      ref={canvasRef}
      style={{
        flex: 1,
        background: THEME.surface,
        backgroundImage: `radial-gradient(circle, ${THEME.border} 1px, transparent 1px)`,
        backgroundSize: `${GRID}px ${GRID}px`,
        position: "relative",
        overflow: "auto",
        cursor: dragging ? "grabbing" : "default",
        minHeight: "100%",
        touchAction: dragging || resizing ? "none" : "auto",
      }}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => setSelected(null)}
    >
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
              touchAction: "none",
            }}
            onMouseDown={(e) => { e.stopPropagation(); handlePointerDown(e, comp); }}
            onTouchStart={(e) => handleTouchStart(e, comp)}
            onTouchMove={(e) => handleTouchMove(e)}
            onClick={(e) => { e.stopPropagation(); setSelected(comp.id); }}
          >
            {/* Component content */}
            <div style={{ width: "100%", height: "100%", pointerEvents: "none" }}>
              {renderComponent(comp.type, comp.data)}
            </div>

            {/* Selection outline */}
            {isSelected && (
              <div style={{
                position: "absolute", inset: -2,
                border: `2px solid ${THEME.accent}`,
                borderRadius: 6, pointerEvents: "none",
              }} />
            )}

            {/* Toolbar */}
            {isSelected && (
              <div style={{
                position: "absolute", top: -40, left: 0,
                display: "flex", gap: 4,
                background: THEME.primary, borderRadius: 6,
                padding: "4px 8px", zIndex: 20,
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

            {/* Resize handles */}
            {isSelected && ["se", "sw", "ne", "nw", "e", "s", "w", "n"].map((dir) => {
              const baseStyle = {
                se: { right: -7, bottom: -7, cursor: "se-resize" },
                sw: { left: -7, bottom: -7, cursor: "sw-resize" },
                ne: { right: -7, top: -7, cursor: "ne-resize" },
                nw: { left: -7, top: -7, cursor: "nw-resize" },
                e: { right: -7, top: "50%", transform: "translateY(-50%)", cursor: "e-resize" },
                s: { bottom: -7, left: "50%", transform: "translateX(-50%)", cursor: "s-resize" },
                w: { left: -7, top: "50%", transform: "translateY(-50%)", cursor: "w-resize" },
                n: { top: -7, left: "50%", transform: "translateX(-50%)", cursor: "n-resize" },
              }[dir];
              return (
                <div
                  key={dir}
                  onMouseDown={(e) => { e.stopPropagation(); handleResizePointerDown(e, comp, dir); }}
                  onTouchStart={(e) => { e.stopPropagation(); handleResizePointerDown(e, comp, dir); }}
                  style={{ position: "absolute", width: 20, height: 20, background: THEME.accent, borderRadius: 3, ...baseStyle, zIndex: 21 }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
