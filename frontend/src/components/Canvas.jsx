import React, { useRef, useState, useCallback } from "react";
import { renderComponent } from "./componentRegistry";
import { THEME } from "../theme";
import { Trash, CopySimple } from "@phosphor-icons/react";

const GRID = 8;
const MIN_W = 100;
const MIN_H = 80;

const snap = (v) => Math.round(v / GRID) * GRID;

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
  const activeTouchId = useRef(null);

  const canvasRect = useRef(null);

  const updateCanvasRect = useCallback(() => {
    if (canvasRef.current) {
      canvasRect.current = canvasRef.current.getBoundingClientRect();
    }
  }, []);

  const handlePointerDown = useCallback((e, comp) => {
    e.stopPropagation();
    updateCanvasRect();
    setSelected(comp.id);
    const rect = canvasRect.current;
    const pos = pointerPos(e);
    setDragOffset({ x: pos.x - rect.left - comp.x, y: pos.y - rect.top - comp.y });
    setDragging(comp.id);
  }, [updateCanvasRect]);

  const handleResizePointerDown = useCallback((e, comp, dir) => {
    e.stopPropagation();
    updateCanvasRect();
    setSelected(comp.id);
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
      onUpdate(dragging, { x, y });
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
      onUpdate(resizing.id, { x, y, w, h });
    }
  }, [dragging, resizing, dragOffset, onUpdate, updateCanvasRect]);

  const handlePointerUp = useCallback(() => {
    setDragging(null);
    setResizing(null);
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
        touchAction: "none",
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
            }}
            onMouseDown={(e) => { e.stopPropagation(); handlePointerDown(e, comp); }}
            onTouchStart={(e) => handleTouchStart(e, comp)}
            onClick={(e) => { e.stopPropagation(); setSelected(comp.id); }}
          >
            {/* Component content */}
            <div style={{ width: "100%", height: "100%", pointerEvents: "none" }}>
              {renderComponent(comp.type, comp.data)}
            </div>

            {/* Selection border — dashed to hint at resize affordance */}
            {isSelected && (
              <div style={{
                position: "absolute", inset: -2,
                border: `2px dashed ${THEME.accent}`,
                borderRadius: 6, pointerEvents: "none",
              }} />
            )}

            {/* Toolbar — BELOW the component (not above) */}
            {isSelected && (
              <div style={{
                position: "absolute", top: "calc(100% + 10px)", left: 0,
                display: "flex", gap: 4,
                background: THEME.primary, borderRadius: 6,
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

            {/* Corner resize handles only — 4 corners, 28px hit targets */}
            {isSelected && ["se", "sw", "ne", "nw"].map((dir) => {
              const r = 8; // half of 16px handle size
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
                    background: THEME.accent,
                    borderRadius: 3,
                    cursor: {
                      se: "se-resize", sw: "sw-resize",
                      ne: "ne-resize", nw: "nw-resize",
                    }[dir],
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
  );
}
