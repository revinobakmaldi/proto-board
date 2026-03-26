import React from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, ComposedChart, FunnelChart, Funnel, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  ChartLineUp, ChartBar, ChartLine, ChartPie, Table, ChartLineDown,
  Lightbulb, Stairs, ChartBarHorizontal, FunnelSimple, GridFour,
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

// ── Column Chart ──────────────────────────────────────────
const BAR_DATA = () => [
  { name: "Jan", value: rand(50, 300) },
  { name: "Feb", value: rand(50, 300) },
  { name: "Mar", value: rand(50, 300) },
  { name: "Apr", value: rand(50, 300) },
  { name: "May", value: rand(50, 300) },
  { name: "Jun", value: rand(50, 300) },
];

export const ColumnChartData = () => ({ type: "column", data: BAR_DATA() });

export const ColumnChartComponent = ({ data }) => {
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

// ── Area Chart ─────────────────────────────────────────────
const AREA_DATA = () => [
  { name: "Jan", actual: rand(40, 200), previous: rand(40, 200) },
  { name: "Feb", actual: rand(40, 200), previous: rand(40, 200) },
  { name: "Mar", actual: rand(40, 200), previous: rand(40, 200) },
  { name: "Apr", actual: rand(40, 200), previous: rand(40, 200) },
  { name: "May", actual: rand(40, 200), previous: rand(40, 200) },
  { name: "Jun", actual: rand(40, 200), previous: rand(40, 200) },
];

export const AreaChartData = () => ({ type: "area", data: AREA_DATA() });

export const AreaChartComponent = ({ data }) => {
  if (!data || !data.data) return <div style={{ height: "100%", background: THEME.background, borderRadius: 8, border: `1px solid ${THEME.border}` }} />;
  return (
    <div style={{ background: THEME.background, borderRadius: 8, padding: 16, border: `1px solid ${THEME.border}`, height: "100%" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: THEME.primary, marginBottom: 12, fontFamily: "Segoe UI" }}>
        Volume Trend
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data.data}>
          <defs>
            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={THEME.teal} stopOpacity={0.7} />
              <stop offset="95%" stopColor={THEME.teal} stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={THEME.accent} stopOpacity={0.4} />
              <stop offset="95%" stopColor={THEME.accent} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: THEME.primary, fontFamily: "Segoe UI" }} />
          <YAxis tick={{ fontSize: 11, fill: THEME.primary, fontFamily: "Segoe UI" }} />
          <Tooltip contentStyle={{ fontSize: 12, fontFamily: "Segoe UI", borderRadius: 6, border: `1px solid ${THEME.border}` }} />
          <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Segoe UI" }} />
          <Area type="monotone" dataKey="previous" stroke={THEME.accent} strokeWidth={1.5} strokeDasharray="5 5" fill="url(#colorPrevious)" name="Previous" />
          <Area type="monotone" dataKey="actual" stroke={THEME.teal} strokeWidth={2} fill="url(#colorActual)" name="Actual" />
        </AreaChart>
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

// ── Insight Card ───────────────────────────────────────────
const INSIGHT_TITLES = [
  "Revenue Drop in West Region",
  "Top SKU Driving Growth",
  "Outlet Efficiency Alert",
  "Weekend Sales Spike Detected",
  "Distribution Gap Identified",
];
const INSIGHT_BODIES = [
  "West region revenue declined 18% vs last month, driven primarily by 3 underperforming outlets. Immediate review recommended.",
  "Chicken Bucket is responsible for 42% of total revenue growth this quarter, outpacing all other SKUs by 2.3x.",
  "5 outlets are operating below 70% achievement for 3 consecutive weeks. Staffing and supply issues may be a factor.",
  "Saturday revenue is 67% higher than weekday average. Consider increasing stock allocation and staffing on weekends.",
  "Coverage in East Java dropped from 94% to 78% in 4 weeks. Route optimization is needed for 12 affected stores.",
];
const INSIGHT_TYPES = [
  { label: "Alert", color: "#dc2626", bg: "#fef2f2" },
  { label: "Opportunity", color: "#16a34a", bg: "#f0fdf4" },
  { label: "Watch", color: "#d97706", bg: "#fffbeb" },
  { label: "Info", color: "#2563eb", bg: "#eff6ff" },
];

export const InsightCardData = () => {
  const i = rand(0, INSIGHT_TITLES.length - 1);
  const t = INSIGHT_TYPES[rand(0, INSIGHT_TYPES.length - 1)];
  return { title: INSIGHT_TITLES[i], body: INSIGHT_BODIES[i], type: t.label, color: t.color, bg: t.bg };
};

export const InsightCard = ({ data }) => {
  if (!data) return <div style={{ height: "100%", background: THEME.background, borderRadius: 8, border: `1px solid ${THEME.border}` }} />;
  const { title, body, type, color, bg } = data;
  return (
    <div style={{
      background: "#fff", borderRadius: 10, border: `1px solid ${THEME.border}`,
      borderLeft: `4px solid ${color}`, height: "100%",
      display: "flex", flexDirection: "column", fontFamily: "Segoe UI, sans-serif",
      overflow: "hidden", boxShadow: "0 2px 8px rgba(78,52,46,0.08)",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: bg,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Lightbulb size={16} weight="duotone" color={color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color, background: bg,
              borderRadius: 4, padding: "2px 6px", textTransform: "uppercase", letterSpacing: "0.05em",
            }}>{type}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: THEME.primary, lineHeight: 1.3 }}>{title}</div>
        </div>
      </div>
      {/* Divider */}
      <div style={{ height: 1, background: "#f3f4f6", margin: "0 16px" }} />
      {/* Body */}
      <div style={{ padding: "12px 16px", flex: 1 }}>
        <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>{body}</p>
      </div>
    </div>
  );
};

// ── Waterfall Chart ────────────────────────────────────────
export const WaterfallChartData = () => {
  const base = rand(400, 600);
  const items = [
    { name: "Start", value: base, type: "total" },
    { name: "QSR", value: rand(20, 80), type: "pos" },
    { name: "Retail", value: -rand(10, 50), type: "neg" },
    { name: "Online", value: rand(10, 60), type: "pos" },
    { name: "Wholesale", value: -rand(5, 40), type: "neg" },
    { name: "End", value: null, type: "total" },
  ];
  let running = base;
  const rows = items.map((item) => {
    if (item.type === "total" && item.name === "Start") {
      return { name: item.name, base: 0, value: base, type: "total" };
    }
    if (item.type === "total" && item.name === "End") {
      return { name: item.name, base: 0, value: running, type: "total" };
    }
    const prev = running;
    running += item.value;
    return {
      name: item.name,
      base: item.value >= 0 ? prev : running,
      value: Math.abs(item.value),
      type: item.value >= 0 ? "pos" : "neg",
    };
  });
  return { type: "waterfall", data: rows };
};

export const WaterfallChart = ({ data }) => {
  if (!data || !data.data) return <div style={{ height: "100%", background: THEME.background, borderRadius: 8, border: `1px solid ${THEME.border}` }} />;
  const colorMap = { pos: THEME.good, neg: THEME.bad, total: THEME.accent };
  const rows = data.data.map(d => ({ ...d, fill: colorMap[d.type] }));
  return (
    <div style={{ background: THEME.background, borderRadius: 8, padding: 16, border: `1px solid ${THEME.border}`, height: "100%" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: THEME.primary, marginBottom: 12, fontFamily: "Segoe UI" }}>
        Revenue Variance Bridge
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={rows} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: THEME.primary, fontFamily: "Segoe UI" }} />
          <YAxis tick={{ fontSize: 10, fill: THEME.primary, fontFamily: "Segoe UI" }} />
          <Tooltip
            contentStyle={{ fontSize: 12, fontFamily: "Segoe UI", borderRadius: 6, border: `1px solid ${THEME.border}` }}
            formatter={(val, name) => name === "value" ? [val, "Amount"] : [null, null]}
            filterNull
          />
          <Bar dataKey="base" stackId="a" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="value" stackId="a" radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {rows.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div style={{ display: "flex", gap: 12, marginTop: 6, justifyContent: "center" }}>
        {[["Positive", THEME.good], ["Negative", THEME.bad], ["Total", THEME.accent]].map(([label, color]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#6b7280", fontFamily: "Segoe UI" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: "inline-block" }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Combo Chart (Bar + Line) ───────────────────────────────
const COMBO_DATA = () => [
  { name: "Jan", revenue: rand(200, 600), growth: randFloat(-5, 25) },
  { name: "Feb", revenue: rand(200, 600), growth: randFloat(-5, 25) },
  { name: "Mar", revenue: rand(200, 600), growth: randFloat(-5, 25) },
  { name: "Apr", revenue: rand(200, 600), growth: randFloat(-5, 25) },
  { name: "May", revenue: rand(200, 600), growth: randFloat(-5, 25) },
  { name: "Jun", revenue: rand(200, 600), growth: randFloat(-5, 25) },
];

export const ComboChartData = () => ({ type: "combo", data: COMBO_DATA() });

export const ComboChartComponent = ({ data }) => {
  if (!data || !data.data) return <div style={{ height: "100%", background: THEME.background, borderRadius: 8, border: `1px solid ${THEME.border}` }} />;
  return (
    <div style={{ background: THEME.background, borderRadius: 8, padding: 16, border: `1px solid ${THEME.border}`, height: "100%" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: THEME.primary, marginBottom: 12, fontFamily: "Segoe UI" }}>
        Revenue vs Growth Rate
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={data.data}>
          <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: THEME.primary, fontFamily: "Segoe UI" }} />
          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: THEME.primary, fontFamily: "Segoe UI" }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: THEME.teal, fontFamily: "Segoe UI" }} unit="%" />
          <Tooltip contentStyle={{ fontSize: 12, fontFamily: "Segoe UI", borderRadius: 6, border: `1px solid ${THEME.border}` }} />
          <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Segoe UI" }} />
          <Bar yAxisId="left" dataKey="revenue" fill={THEME.accent} radius={[4, 4, 0, 0]} name="Revenue" opacity={0.85} />
          <Line yAxisId="right" type="monotone" dataKey="growth" stroke={THEME.teal} strokeWidth={2.5} dot={{ r: 4, fill: THEME.teal }} name="Growth %" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// ── Variance Chart ─────────────────────────────────────────
const VARIANCE_DATA = () => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  return months.map(name => {
    const target = rand(150, 300);
    const actual = rand(100, 350);
    return { name, actual, target, variance: actual - target };
  });
};

export const VarianceChartData = () => ({ type: "variance", data: VARIANCE_DATA() });

export const VarianceChartComponent = ({ data }) => {
  if (!data || !data.data) return <div style={{ height: "100%", background: THEME.background, borderRadius: 8, border: `1px solid ${THEME.border}` }} />;
  return (
    <div style={{ background: THEME.background, borderRadius: 8, padding: 16, border: `1px solid ${THEME.border}`, height: "100%" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: THEME.primary, marginBottom: 4, fontFamily: "Segoe UI" }}>
        Actual vs Target Variance
      </div>
      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10, fontFamily: "Segoe UI" }}>
        Green = above target · Red = below target
      </div>
      <ResponsiveContainer width="100%" height={170}>
        <ComposedChart data={data.data}>
          <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: THEME.primary, fontFamily: "Segoe UI" }} />
          <YAxis tick={{ fontSize: 11, fill: THEME.primary, fontFamily: "Segoe UI" }} />
          <Tooltip contentStyle={{ fontSize: 12, fontFamily: "Segoe UI", borderRadius: 6, border: `1px solid ${THEME.border}` }} />
          <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Segoe UI" }} />
          <Bar dataKey="actual" name="Actual" radius={[3, 3, 0, 0]}>
            {data.data.map((entry, i) => (
              <Cell key={i} fill={entry.variance >= 0 ? THEME.good : THEME.bad} />
            ))}
          </Bar>
          <Line type="monotone" dataKey="target" stroke={THEME.accent} strokeWidth={2} strokeDasharray="6 3" dot={false} name="Target" />
          <ReferenceLine y={0} stroke={THEME.border} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// ── Horizontal Bar (Ranked) ────────────────────────────────
const RANK_NAMES = ["KFC Bandung", "McD Jakarta", "Starbucks SBY", "Chatime BDG", "HokBen SBY", "BurgerKing MDN", "J.CO Bali", "Excelso JKT"];

export const RankedBarData = () => {
  const items = [...RANK_NAMES].sort(() => Math.random() - 0.5).slice(0, 6).map(name => ({
    name, value: rand(100, 500),
  }));
  items.sort((a, b) => b.value - a.value);
  return { type: "ranked", data: items };
};

export const RankedBarComponent = ({ data }) => {
  if (!data || !data.data) return <div style={{ height: "100%", background: THEME.background, borderRadius: 8, border: `1px solid ${THEME.border}` }} />;
  const max = Math.max(...data.data.map(d => d.value));
  return (
    <div style={{ background: THEME.background, borderRadius: 8, border: `1px solid ${THEME.border}`, height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px 8px", fontSize: 14, fontWeight: 600, color: THEME.primary, fontFamily: "Segoe UI" }}>
        Top Outlets by Revenue
      </div>
      <div style={{ padding: "0 16px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
        {data.data.map((item, i) => {
          const pct = (item.value / max) * 100;
          const isTop = i === 0;
          return (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: THEME.primary, fontFamily: "Segoe UI", fontWeight: isTop ? 700 : 400 }}>
                  {i + 1}. {item.name}
                </span>
                <span style={{ fontSize: 11, color: isTop ? THEME.accent : "#6b7280", fontFamily: "Segoe UI", fontWeight: 600 }}>
                  {item.value}K
                </span>
              </div>
              <div style={{ height: 6, background: THEME.surface, borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 3,
                  width: `${pct}%`,
                  background: isTop ? THEME.accent : i < 3 ? THEME.teal : THEME.border,
                  transition: "width 0.3s ease",
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Funnel Chart ───────────────────────────────────────────
export const FunnelChartData = () => {
  const stages = ["Awareness", "Interest", "Consideration", "Purchase"];
  const top = rand(800, 1200);
  let current = top;
  const rows = stages.map((name, i) => {
    const value = i === 0 ? top : Math.floor(current * randFloat(0.4, 0.75));
    current = value;
    return { name, value, fill: DATA_COLORS[i] };
  });
  return { type: "funnel", data: rows };
};

export const FunnelChartComponent = ({ data }) => {
  if (!data || !data.data) return <div style={{ height: "100%", background: THEME.background, borderRadius: 8, border: `1px solid ${THEME.border}` }} />;
  const top = data.data[0]?.value || 1;
  return (
    <div style={{ background: THEME.background, borderRadius: 8, padding: 16, border: `1px solid ${THEME.border}`, height: "100%" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: THEME.primary, marginBottom: 12, fontFamily: "Segoe UI" }}>
        Customer Conversion Funnel
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <FunnelChart>
          <Tooltip contentStyle={{ fontSize: 12, fontFamily: "Segoe UI", borderRadius: 6, border: `1px solid ${THEME.border}` }} />
          <Funnel dataKey="value" data={data.data} isAnimationActive={false}>
            {data.data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            <LabelList dataKey="name" position="right" style={{ fontSize: 11, fontFamily: "Segoe UI", fill: THEME.primary }} />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
      {/* Conversion rates */}
      <div style={{ display: "flex", justifyContent: "space-around", marginTop: 4 }}>
        {data.data.map((item, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: DATA_COLORS[i], fontFamily: "Segoe UI" }}>
              {((item.value / top) * 100).toFixed(0)}%
            </div>
            <div style={{ fontSize: 9, color: "#9ca3af", fontFamily: "Segoe UI" }}>{item.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Heatmap ────────────────────────────────────────────────
const HEATMAP_ROWS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HEATMAP_COLS = ["W1", "W2", "W3", "W4"];

export const HeatmapData = () => ({
  type: "heatmap",
  rows: HEATMAP_ROWS,
  cols: HEATMAP_COLS,
  values: HEATMAP_ROWS.map(() => HEATMAP_COLS.map(() => rand(20, 200))),
});

export const HeatmapComponent = ({ data }) => {
  if (!data || !data.values) return <div style={{ height: "100%", background: THEME.background, borderRadius: 8, border: `1px solid ${THEME.border}` }} />;
  const { rows, cols, values } = data;
  const allVals = values.flat();
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const getColor = (v) => {
    const t = (v - minVal) / (maxVal - minVal);
    // low = light cream → high = deep brown/teal
    const r = Math.round(245 - t * (245 - 78));
    const g = Math.round(240 - t * (240 - 202));
    const b = Math.round(235 - t * (235 - 193));
    return `rgb(${r},${g},${b})`;
  };
  const cellW = 52;
  const cellH = 26;
  return (
    <div style={{ background: THEME.background, borderRadius: 8, padding: 16, border: `1px solid ${THEME.border}`, height: "100%", overflow: "hidden" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: THEME.primary, marginBottom: 12, fontFamily: "Segoe UI" }}>
        Sales Heatmap — Day × Week
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 2, fontFamily: "Segoe UI" }}>
          <thead>
            <tr>
              <th style={{ width: 36, fontSize: 10 }} />
              {cols.map(c => (
                <th key={c} style={{ width: cellW, fontSize: 10, color: "#9ca3af", fontWeight: 600, textAlign: "center", paddingBottom: 4 }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row}>
                <td style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, paddingRight: 6, textAlign: "right" }}>{row}</td>
                {cols.map((col, ci) => {
                  const v = values[ri][ci];
                  const t = (v - minVal) / (maxVal - minVal);
                  const textColor = t > 0.55 ? "#fff" : THEME.primary;
                  return (
                    <td key={col} style={{
                      width: cellW, height: cellH, background: getColor(v),
                      borderRadius: 4, textAlign: "center", fontSize: 10,
                      fontWeight: 600, color: textColor, cursor: "default",
                    }} title={`${row} ${col}: ${v}`}>
                      {v}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Scale legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
        <span style={{ fontSize: 9, color: "#9ca3af", fontFamily: "Segoe UI" }}>Low</span>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: `linear-gradient(to right, ${getColor(minVal)}, ${getColor(maxVal)})` }} />
        <span style={{ fontSize: 9, color: "#9ca3af", fontFamily: "Segoe UI" }}>High</span>
      </div>
    </div>
  );
};

// ── Component Registry ─────────────────────────────────────
export const COMPONENT_TYPES = [
  { type: "kpi",      label: "KPI Card",        defaultSize: { w: 280, h: 200 }, defaultDataFn: KPICardData },
  { type: "column",   label: "Column Chart",     defaultSize: { w: 380, h: 240 }, defaultDataFn: ColumnChartData },
  { type: "line",     label: "Line Chart",       defaultSize: { w: 380, h: 240 }, defaultDataFn: LineChartData },
  { type: "pie",      label: "Pie Chart",        defaultSize: { w: 300, h: 240 }, defaultDataFn: PieChartData },
  { type: "table",    label: "Data Table",       defaultSize: { w: 500, h: 280 }, defaultDataFn: TableData },
  { type: "area",     label: "Area Chart",       defaultSize: { w: 380, h: 240 }, defaultDataFn: AreaChartData },
  { type: "insight",  label: "Insight Card",     defaultSize: { w: 340, h: 200 }, defaultDataFn: InsightCardData },
  { type: "waterfall",label: "Waterfall Chart",  defaultSize: { w: 420, h: 260 }, defaultDataFn: WaterfallChartData },
  { type: "combo",    label: "Combo Chart",      defaultSize: { w: 420, h: 260 }, defaultDataFn: ComboChartData },
  { type: "variance", label: "Variance Chart",   defaultSize: { w: 400, h: 260 }, defaultDataFn: VarianceChartData },
  { type: "ranked",   label: "Ranked Bar",       defaultSize: { w: 300, h: 280 }, defaultDataFn: RankedBarData },
  { type: "funnel",   label: "Funnel Chart",     defaultSize: { w: 340, h: 280 }, defaultDataFn: FunnelChartData },
  { type: "heatmap",  label: "Heatmap",          defaultSize: { w: 360, h: 280 }, defaultDataFn: HeatmapData },
];

export const COMPONENT_ICONS = {
  kpi:       <ChartLineUp size={18} weight="duotone" />,
  column:    <ChartBar size={18} weight="duotone" />,
  line:      <ChartLine size={18} weight="duotone" />,
  pie:       <ChartPie size={18} weight="duotone" />,
  table:     <Table size={18} weight="duotone" />,
  area:      <ChartLineDown size={18} weight="duotone" />,
  insight:   <Lightbulb size={18} weight="duotone" />,
  waterfall: <Stairs size={18} weight="duotone" />,
  combo:     <ChartBar size={18} weight="duotone" />,
  variance:  <ChartLineUp size={18} weight="duotone" />,
  ranked:    <ChartBarHorizontal size={18} weight="duotone" />,
  funnel:    <FunnelSimple size={18} weight="duotone" />,
  heatmap:   <GridFour size={18} weight="duotone" />,
};

export const renderComponent = (type, data) => {
  if (!data) {
    return <div style={{ height: "100%", background: THEME.surface, borderRadius: 8, border: `1px dashed ${THEME.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#8D6E63", fontFamily: "Segoe UI", fontSize: 12 }}>
      Loading...
    </div>;
  }
  switch (type) {
    case "kpi":       return <KPICard data={data} />;
    case "column":    return <ColumnChartComponent data={data} />;
    case "line":      return <LineChartComponent data={data} />;
    case "pie":       return <PieChartComponent data={data} />;
    case "table":     return <TableComponent data={data} />;
    case "area":      return <AreaChartComponent data={data} />;
    case "insight":   return <InsightCard data={data} />;
    case "waterfall": return <WaterfallChart data={data} />;
    case "combo":     return <ComboChartComponent data={data} />;
    case "variance":  return <VarianceChartComponent data={data} />;
    case "ranked":    return <RankedBarComponent data={data} />;
    case "funnel":    return <FunnelChartComponent data={data} />;
    case "heatmap":   return <HeatmapComponent data={data} />;
    default:          return null;
  }
};
