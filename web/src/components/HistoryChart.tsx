import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { HistoryEntry } from "../hooks/useIndexData";

interface Props {
  history: HistoryEntry[];
  variant: "pr" | "tr";
  period: Period;
  onPeriodChange: (p: Period) => void;
}

export type Period = "3M" | "6M" | "1A" | "3A" | "5A" | "MAX";

const PERIODS: Period[] = ["3M", "6M", "1A", "3A", "5A", "MAX"];

function cutoffDate(period: Period): string | null {
  if (period === "MAX") return null;
  const d = new Date();
  switch (period) {
    case "3M": d.setMonth(d.getMonth() - 3); break;
    case "6M": d.setMonth(d.getMonth() - 6); break;
    case "1A": d.setFullYear(d.getFullYear() - 1); break;
    case "3A": d.setFullYear(d.getFullYear() - 3); break;
    case "5A": d.setFullYear(d.getFullYear() - 5); break;
  }
  return d.toISOString().slice(0, 10);
}

function formatDate(dateStr: string, period: Period) {
  const d = new Date(dateStr + "T00:00:00");
  if (period === "3M" || period === "6M") {
    return d.toLocaleDateString("fr-CA", { day: "numeric", month: "short" });
  }
  return d.toLocaleDateString("fr-CA", { month: "short", year: "2-digit" });
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-white font-bold text-base">{payload[0].value.toFixed(2)} pts</p>
    </div>
  );
}

export function HistoryChart({ history, variant, period, onPeriodChange }: Props) {
  const cutoff = cutoffDate(period);
  const filtered = cutoff ? history.filter((h) => h.date >= cutoff) : history;

  const data = filtered.map((h) => ({
    date: h.date,
    value: variant === "pr" ? h.pr : h.tr,
  }));

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.05 || 10;

  const tickCount = 7;
  const step = Math.max(1, Math.floor(data.length / tickCount));
  const ticks = data.filter((_, i) => i % step === 0 || i === data.length - 1).map((d) => d.date);

  // Rendement sur la période sélectionnée
  const first = data[0];
  const last = data[data.length - 1];
  const perfPct = first && last ? ((last.value - first.value) / first.value) * 100 : null;

  return (
    <div className="bg-slate-800 rounded-2xl p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-slate-200 font-semibold text-lg">
            Historique ICQ-20 {variant.toUpperCase()}
          </h2>
          {perfPct !== null && (
            <p className={`text-sm font-medium mt-0.5 ${perfPct >= 0 ? "text-green-400" : "text-red-400"}`}>
              {perfPct >= 0 ? "+" : ""}{perfPct.toFixed(2)}% sur la période
            </p>
          )}
        </div>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                period === p
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            ticks={ticks}
            tickFormatter={(v) => formatDate(v, period)}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={{ stroke: "#334155" }}
            tickLine={false}
          />
          <YAxis
            domain={[min - padding, max + padding]}
            tickFormatter={(v: number) => v.toFixed(0)}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          {period === "MAX" && (
            <ReferenceLine
              y={1000}
              stroke="#475569"
              strokeDasharray="4 4"
              label={{ value: "Base 1000", fill: "#64748b", fontSize: 11 }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#3b82f6" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
