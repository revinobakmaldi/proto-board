import React from "react";
import { COMPONENT_TYPES } from "./componentRegistry";
import { THEME } from "../theme";
import { Layout, ChartLineUp, ChartBar, ChartLine, ChartPie, Table } from "@phosphor-icons/react";

const COMPONENT_ICONS = {
  kpi:    <ChartLineUp size={18} weight="duotone" />,
  bar:    <ChartBar size={18} weight="duotone" />,
  line:   <ChartLine size={18} weight="duotone" />,
  pie:    <ChartPie size={18} weight="duotone" />,
  table:  <Table size={18} weight="duotone" />,
};

export default function Sidebar({ onAdd }) {
  return (
    <div style={{
      width: 200,
      background: THEME.background,
      borderRight: `1px solid ${THEME.border}`,
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
    }}>
      <div style={{
        padding: "12px 16px",
        borderBottom: `1px solid ${THEME.border}`,
        fontSize: 12, fontWeight: 600, color: THEME.primary,
        fontFamily: "Segoe UI", textTransform: "uppercase", letterSpacing: "0.05em",
      }}>
        Components
      </div>
      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {COMPONENT_TYPES.map((comp) => (
          <button
            key={comp.type}
            onClick={() => onAdd(comp)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px",
              background: THEME.surface,
              border: `1px solid ${THEME.border}`,
              borderRadius: 8,
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s",
              fontFamily: "Segoe UI",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = THEME.accent;
              e.currentTarget.style.background = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = THEME.border;
              e.currentTarget.style.background = THEME.surface;
            }}
          >
            <span style={{ color: THEME.primary }}>{COMPONENT_ICONS[comp.type]}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: THEME.primary }}>{comp.label}</div>
              <div style={{ fontSize: 10, color: "#8D6E63" }}>{comp.defaultSize.w}×{comp.defaultSize.h}</div>
            </div>
          </button>
        ))}
      </div>
      <div style={{ padding: 12, borderTop: `1px solid ${THEME.border}`, fontSize: 10, color: "#8D6E63", fontFamily: "Segoe UI" }}>
        <Layout size={12} weight="regular" style={{ display: "inline", marginRight: 4 }} />
        Click to add → drag to move
      </div>
    </div>
  );
}
