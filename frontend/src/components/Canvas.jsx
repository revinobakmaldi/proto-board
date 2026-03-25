import React, { useRef, useState, useCallback } from "react";
import { renderComponent } from "./componentRegistry";
import { THEME } from "../theme";
import { Trash, CopySimple } from "@phosphor-icons/react";

const GRID = 8;
const MIN_W = 100;
const MIN_H = 80;

const snap = (v) => Math.round(v / GRID) * GRID;

const pointerPos = (e) => {
  if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  return { x: e.clientX, y: e.clientY };
};

const Canvas = React.forwardRef(function Canvas({ components, onUpdate, onDelete, onDuplicate }, fwdRef) {
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const activeTouchId = useRef(null);
  const canvasRef = useRef(null);
  const canvasRect = useRef(null);

  // Merge internal ref + forwarded ref so parent can grab the DOM node
  const setRef = useCallback((el) => {
    canvasRef.current = el;
    if (typeof fwdRef === "function") fwdRef(el);
    else if (fwdRef) fwdRef.current = el;
  }, [fwdRef]);

  const updateCanvasRect = useCallback(() => {
    if (canvasRef.current) canvasRect.current = canvasRef.current.getBoundingClientRect();
  }, []);

  const handlePointerDown = useCallback((e, comp) => {
    e.stopPropagation();
    updateCanvasRect();
    setSelected(comp.id);
    setIsInteracting(true);
    const rect = canvasRect.current;
    const pos = pointerPos(e);
    setDragOffset({ x: pos.x - rect.left - comp.x, y: pos.y - rect.top - comp.y });
    setDragging(comp.id);
  }, [updateCanvasRect]);

  const handleResizePointerDown = useCallback((e, comp, dir) => {
    e.stopPropagation();
    if (e.changedTouches?.[0]) activeTouchId.current = e.changedTouches[0].identifier;
    updateCanvasRect();
    setSelected(comp.id);
    setIsInteracting(true);
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
      onUpdate(dragging, {
        x: snap(Math.max(0, pos.x - rect.left - dragOffset.x)),
        y: snap(Math.max(0, pos.y - rect.top - dragOffset.y)),
      });
    }
    if (resizing) {
      const pos = pointerPos(e);
      const dx = pos.x - resizing.startX, dy = pos.y - resizing.startY;
      let x = resizing.origX, y = resizing.origY, w = resizing.origW, h = resizing.origH;
      if (resizing.dir.includes("e")) w = snap(Math.max(MIN_W, resizing.origW + dx));
      if (resizing.dir.includes("s")) h = snap(Math.max(MIN_H, resizing.origH + dy));
      if (resizing.dir.includes("w")) {
        const nw = snap(Math.max(MIN_W, resizing.origW - dx));
        x = snap(resizing.origX + resizing.origW - nw); w = nw;
      }
      if (resizing.dir.includes("n")) {
        const nh = snap(Math.max(MIN_H, resizing.origH - dy));
        y = snap(resizing.origY + resizing.origH - nh); h = nh;
      }
      onUpdate(resizing.id, { x, y, w, h });
    }
  }, [dragging, resizing, dragOffset, onUpdate, updateCanvasRect]);

  const handlePointerUp = useCallback(() => {
    setDragging(null);
    setResizing(null);
    setIsInteracting(false);
    activeTouchId.current = null;
  }, []);

  const handleTouchStart = useCallback((e, comp) => {
    if (activeTouchId.current !== null) return;
    activeTouchId.current = e.changedTouches[0].identifier;
    handlePointerDown(e, comp);
  }, [handlePointerDown]);

  const handleTouchMove = useCallback((e) => {
    const active = [...e.changedTouches].find(t => t.identifier === activeTouchId.current);
    if (!active) return;
    if (dragging || resizing) e.preventDefault();
    handlePointerMove(e);
  }, [dragging, resizing, handlePointerMove]);

  const handleTouchEnd = useCallback((e) => {
    const active = [...e.changedTouches].find(t => t.identifier === activeTouchId.current);
    if (!active) return;
    handlePointerUp();
  }, [handlePointerUp]);

  return (
    <div
      ref={setRef}
      onMouseMove={dragging || resizing ? handlePointerMove : undefined}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => setSelected(null)}
      style={{
        position: "relative",
        flex: 1,
        overflow: "auto",
        background: THEME.surface,
        userSelect: isInteracting ? "none" : "auto",
        WebkitUserSelect: isInteracting ? "none" : "auto",
        touchAction: "none",
      }}
    >
      {/* Dotted grid */}
      <div style={{
        position: "relative",
        minWidth: "100%",
        minHeight: "100%",
        backgroundImage: `radial-gradient(circle, ${THEME.border} 1.5px, transparent 1.5px)`,
        backgroundSize: `${GRID}px ${GRID}px`,
      }}>
        {components.map((comp) => {
          const isSelected = selected === comp.id;
          const isDragging = dragging === comp.id;
          const isHovered = hoveredId === comp.id;
          const showHandles = isSelected || isHovered;
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
                userSelect: "none",
              }}
              onMouseDown={(e) => { e.stopPropagation(); handlePointerDown(e, comp); }}
              onTouchStart={(e) => handleTouchStart(e, comp)}
              onClick={(e) => { e.stopPropagation(); setSelected(comp.id); }}
              onMouseEnter={() => setHoveredId(comp.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Content */}
              <div style={{ width: "100%", height: "100%", pointerEvents: "none" }}>
                {renderComponent(comp.type, comp.data)}
              </div>

              {/* Selection border */}
              {showHandles && (
                <div style={{
                  position: "absolute", inset: -2,
                  border: `2px dashed ${THEME.accent}`,
                  borderRadius: 6, pointerEvents: "none",
                }} />
              )}

              {/* Delete button — top-right corner, shown when selected */}
              {isSelected && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(comp.id); }}
                  title="Remove"
                  style={{
                    position: "absolute",
                    top: -14,
                    right: -14,
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: THEME.bad,
                    border: "2px solid #fff",
                    color: "#fff",
                    fontSize: 14,
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 30,
                    padding: 0,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                  }}
                >
                  ×
                </button>
              )}

              {/* Toolbar below */}
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
                  ].map((a, i) => (
                    <button key={i} onClick={a.onClick} title={a.label} style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "#fff", padding: "4px 6px", borderRadius: 4, display: "flex", alignItems: "center",
                    }}>
                      {a.icon}
                    </button>
                  ))}
                </div>
              )}

              {/* Corner handles */}
              {showHandles && ["se", "sw", "ne", "nw"].map((dir) => {
                const r = 8;
                const pos = {
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
                      position: "absolute", width: 8, height: 8,
                      background: THEME.accent, borderRadius: 2,
                      border: "1px solid rgba(255,255,255,0.5)",
                      cursor: { se: "nwse-resize", sw: "nesw-resize", ne: "nesw-resize", nw: "nwse-resize" }[dir],
                      zIndex: 21,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                      ...pos,
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default Canvas;
