import React from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  ChartLineUp, ChartBar, ChartLine, ChartPie, Table,
} from "@phosphor-icons/react";
import { THEME, DATA_COLORS } from "../theme";

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

// ── KPI Card ──────────────────────────────────────────────
const KPI_DATA = () => {
  const labels = ["Total Revenue", "Units Sold", "Stores Active", "Avg. Order Value", "Quality", "Satisfaction"];
  const base = rand(100000, 5000000);
  const target = base * randFloat(0.85, 1.15);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const current = days.map(() => rand(50, 300));
  const targetLine = days.map(() => rand(50, 300));
  return {
    label: labels[rand(0, labels.length - 1)],
    value: base,
    target,
    achievement: (base / target) * 100,
    vsTarget: ((base - target) / target) * 100,
    vsLastWeek: randFloat(-20, 30),
    trend: "up",
    current,
    targetLine,
    days,
  };
};

export const KPICardData = KPI_DATA;

export const KPICard = ({ data }) => {
  if (!data) return <div style={{ height: "100%", background: THEME.background, borderRadius: 8 }} />;
  const { label, value, target, achievement, vsTarget, vsLastWeek, current, targetLine, days } = data;
  const isGood = achievement >= 100;
  const goodColor = isGood ? "#16a34a" : "#dc2626";
  const trendUp = vsLastWeek >= 0;
  const cardStyle = {
    background: "#fff", borderRadius: 10, border: `1px solid ${THEME.border}`,
    boxShadow: "0 2px 8px rgba(78,52,46,0.08)", height: "100%",
    display: "flex", flexDirection: "column", fontFamily: "Segoe UI, sans-serif",
    overflow: "hidden",
  };
  const fmt = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toFixed(0);
  };
  const maxVal = Math.max(...current, ...targetLine);
  const chartH = 50;
  const chartPad = 4;

  const toY = (v) => chartH - chartPad - ((v / maxVal) * (chartH - chartPad * 2));
  const toX = (i) => i * ((200 - 24) / (days.length - 1));

  const polylineCurrent = current.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const polylineTarget = targetLine.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");

  return (
    <div style={cardStyle}>
      {/* Header section */}
      <div style={{ padding: "14px 14px 12px", flex: 1 }}>
        {/* Label row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{label}</span>
          <span style={{ fontSize: 11, color: "#d1d5db" }}>›</span>
        </div>
        {/* Metrics row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          {/* Main value */}
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#4E342E", lineHeight: 1 }}>{fmt(value)}</div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
              {achievement.toFixed(1)}% of target
            </div>
          </div>
          {/* Right side comparisons */}
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 4 }}>
            {/* vs Target */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: goodColor, display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: "#6b7280" }}>vs Target</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: goodColor }}>
                {vsTarget >= 0 ? "+" : ""}{vsTarget.toFixed(1)}%
              </span>
            </div>
            {/* vs Last Week */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
              <span style={{
                fontSize: 9, fontWeight: 700, color: "#fff",
                background: trendUp ? "#3b82f6" : "#ef4444",
                borderRadius: 3, padding: "1px 4px",
              }}>
                {trendUp ? "↑" : "↓"} {Math.abs(vsLastWeek).toFixed(1)}%
              </span>
              <span style={{ fontSize: 10, color: "#6b7280" }}>last wk</span>
            </div>
          </div>
        </div>
      </div>
      {/* Divider */}
      <div style={{ height: 1, background: "#f3f4f6", margin: "0 14px" }} />
      {/* Mini chart */}
      <div style={{ padding: "8px 14px 12px" }}>
        <svg width="100%" height={chartH} viewBox={`0 0 200 ${chartH}`} style={{ overflow: "visible" }}>
          {/* Grid lines */}
          {[0, 0.5, 1].map((pct) => (
            <line key={pct} x1="0" y1={chartH * pct} x2="200" y2={chartH * pct}
              stroke="#f3f4f6" strokeWidth="1" />
          ))}
          {/* Target line (dashed gray) */}
          <polyline points={polylineTarget} fill="none" stroke="#d1d5db" strokeWidth="1.5"
            strokeDasharray="4 3" strokeLinejoin="round" />
          {/* Current line (gold solid) */}
          <polyline points={polylineCurrent} fill="none" stroke="#d4af37" strokeWidth="2"
            strokeLinejoin="round" />
          {/* Current endpoint dot */}
          <circle cx={toX(current.length - 1)} cy={toY(current[current.length - 1])}
            r="3.5" fill="#d4af37" />
          {/* X-axis labels */}
          {days.map((d, i) => (
            <text key={d} x={toX(i)} y={chartH + 10} textAnchor="middle"
              fontSize="8" fill="#9ca3af" fontFamily="Segoe UI, sans-serif">{d}</text>
          ))}
        </svg>
      </div>
    </div>
  );
};

// ── Bar Chart ─────────────────────────────────────────────
const BAR_DATA = () => [
  { name: "Jan", value: rand(50, 300) },
  { name: "Feb", value: rand(50, 300) },
  { name: "Mar", value: rand(50, 300) },
  { name: "Apr", value: rand(50, 300) },
  { name: "May", value: rand(50, 300) },
  { name: "Jun", value: rand(50, 300) },
];

export const BarChartData = () => ({ type: "bar", data: BAR_DATA() });

export const BarChartComponent = ({ data }) => {
  if (!data || !data.data) return <div style={{ height: "100%", background: THEME.background, borderRadius: 8, border: `1px solid ${THEME.border}` }} />;
  return (
    <div style={{ background: THEME.background, borderRadius: 8, padding: 16, border: `1px solid ${THEME.border}`, height: "100%" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: THEME.primary, marginBottom: 12, fontFamily: "Segoe UI" }}>
        Monthly Performance
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data.data}>
          <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: THEME.primary, fontFamily: "Segoe UI" }} />
          <YAxis tick={{ fontSize: 11, fill: THEME.primary, fontFamily: "Segoe UI" }} />
          <Tooltip contentStyle={{ fontSize: 12, fontFamily: "Segoe UI", borderRadius: 6, border: `1px solid ${THEME.border}` }} />
          <Bar dataKey="value" fill={THEME.accent} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ── Line Chart ─────────────────────────────────────────────
const LINE_DATA = () => [
  { name: "Jan", actual: rand(40, 200), target: rand(40, 200) },
  { name: "Feb", actual: rand(40, 200), target: rand(40, 200) },
  { name: "Mar", actual: rand(40, 200), target: rand(40, 200) },
  { name: "Apr", actual: rand(40, 200), target: rand(40, 200) },
  { name: "May", actual: rand(40, 200), target: rand(40, 200) },
  { name: "Jun", actual: rand(40, 200), target: rand(40, 200) },
];

export const LineChartData = () => ({ type: "line", data: LINE_DATA() });

export const LineChartComponent = ({ data }) => {
  if (!data || !data.data) return <div style={{ height: "100%", background: THEME.background, borderRadius: 8, border: `1px solid ${THEME.border}` }} />;
  return (
    <div style={{ background: THEME.background, borderRadius: 8, padding: 16, border: `1px solid ${THEME.border}`, height: "100%" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: THEME.primary, marginBottom: 12, fontFamily: "Segoe UI" }}>
        Sales Trend
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data.data}>
          <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: THEME.primary, fontFamily: "Segoe UI" }} />
          <YAxis tick={{ fontSize: 11, fill: THEME.primary, fontFamily: "Segoe UI" }} />
          <Tooltip contentStyle={{ fontSize: 12, fontFamily: "Segoe UI", borderRadius: 6, border: `1px solid ${THEME.border}` }} />
          <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Segoe UI" }} />
          <Line type="monotone" dataKey="actual" stroke={THEME.teal} strokeWidth={2} dot={{ r: 4 }} name="Actual" />
          <Line type="monotone" dataKey="target" stroke={THEME.accent} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="Target" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// ── Pie Chart ─────────────────────────────────────────────
const PIE_DATA = () => [
  { name: "QSR", value: rand(30, 60) },
  { name: "Retail", value: rand(20, 40) },
  { name: "Wholesale", value: rand(10, 30) },
  { name: "Online", value: rand(5, 20) },
];

export const PieChartData = () => ({ type: "pie", data: PIE_DATA() });

export const PieChartComponent = ({ data }) => {
  if (!data || !data.data) return <div style={{ height: "100%", background: THEME.background, borderRadius: 8, border: `1px solid ${THEME.border}` }} />;
  return (
    <div style={{ background: THEME.background, borderRadius: 8, padding: 16, border: `1px solid ${THEME.border}`, height: "100%" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: THEME.primary, marginBottom: 12, fontFamily: "Segoe UI" }}>
        Channel Mix
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data.data} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
            {data.data.map((_, i) => (
              <Cell key={i} fill={DATA_COLORS[i % DATA_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ fontSize: 12, fontFamily: "Segoe UI", borderRadius: 6, border: `1px solid ${THEME.border}` }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// ── Data Table ─────────────────────────────────────────────
const STORES = ["KFC Bandung", "McD Jakarta", "Starbucks SBY", "Chatime Bandung", "HokBen Surabaya", "BurgerKing Medan"];
const PRODUCTS = ["Americano", "Chicken Bucket", "Rice Bowl", "Beef Burger", "Milk Tea", "Nuggets"];

export const TableData = () => ({
  rows: Array.from({ length: 6 }, () => ({
    store: STORES[rand(0, STORES.length - 1)],
    product: PRODUCTS[rand(0, PRODUCTS.length - 1)],
    sales: rand(100, 5000),
    target: rand(100, 5000),
    achievement: randFloat(70, 120),
  })),
});

export const TableComponent = ({ data }) => {
  if (!data || !data.rows) return <div style={{ height: "100%", background: THEME.background, borderRadius: 8, border: `1px solid ${THEME.border}` }} />;
  return (
    <div style={{ background: THEME.background, borderRadius: 8, border: `1px solid ${THEME.border}`, height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${THEME.border}`, fontSize: 14, fontWeight: 600, color: THEME.primary, fontFamily: "Segoe UI" }}>
        Store Performance
      </div>
      <div style={{ overflow: "auto", height: "calc(100% - 44px)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "Segoe UI" }}>
          <thead>
            <tr style={{ background: THEME.surface }}>
              {["Store", "Product", "Sales (K)", "Target (K)", "Achv."].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: THEME.primary, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                <td style={{ padding: "8px 12px", color: THEME.primary }}>{row.store || "—"}</td>
                <td style={{ padding: "8px 12px", color: THEME.primary }}>{row.product || "—"}</td>
                <td style={{ padding: "8px 12px", color: THEME.primary }}>{(row.sales / 1000).toFixed(1)}</td>
                <td style={{ padding: "8px 12px", color: THEME.primary }}>{(row.target / 1000).toFixed(1)}</td>
                <td style={{ padding: "8px 12px", color: (row.achievement || 0) >= 100 ? THEME.good : (row.achievement || 0) >= 85 ? THEME.neutral : THEME.bad, fontWeight: 600 }}>
                  {(row.achievement || 0).toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Component Registry ─────────────────────────────────────
export const COMPONENT_TYPES = [
  { type: "kpi", label: "KPI Card", defaultSize: { w: 280, h: 200 }, defaultDataFn: KPICardData },
  { type: "bar", label: "Bar Chart", defaultSize: { w: 380, h: 240 }, defaultDataFn: BarChartData },
  { type: "line", label: "Line Chart", defaultSize: { w: 380, h: 240 }, defaultDataFn: LineChartData },
  { type: "pie", label: "Pie Chart", defaultSize: { w: 300, h: 240 }, defaultDataFn: PieChartData },
  { type: "table", label: "Data Table", defaultSize: { w: 500, h: 280 }, defaultDataFn: TableData },
];

export const COMPONENT_ICONS = {
  kpi:   <ChartLineUp size={18} weight="duotone" />,
  bar:   <ChartBar size={18} weight="duotone" />,
  line:  <ChartLine size={18} weight="duotone" />,
  pie:   <ChartPie size={18} weight="duotone" />,
  table: <Table size={18} weight="duotone" />,
};

export const renderComponent = (type, data) => {
  // Guard: if data is undefined or malformed, render a safe placeholder
  if (!data) {
    return <div style={{ height: "100%", background: THEME.surface, borderRadius: 8, border: `1px dashed ${THEME.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#8D6E63", fontFamily: "Segoe UI", fontSize: 12 }}>
      Loading...
    </div>;
  }
  switch (type) {
    case "kpi": return <KPICard data={data} />;
    case "bar": return <BarChartComponent data={data} />;
    case "line": return <LineChartComponent data={data} />;
    case "pie": return <PieChartComponent data={data} />;
    case "table": return <TableComponent data={data} />;
    default: return null;
  }
};
