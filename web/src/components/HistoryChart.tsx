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
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
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

export function HistoryChart({ history, variant }: Props) {
  const data = history.map((h) => ({
    date: h.date,
    value: variant === "pr" ? h.pr : h.tr,
  }));

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.05;

  // Sous-échantillonnage pour l'axe X (évite la surcharge)
  const tickCount = 8;
  const step = Math.max(1, Math.floor(data.length / tickCount));
  const ticks = data.filter((_, i) => i % step === 0 || i === data.length - 1).map((d) => d.date);

  return (
    <div className="bg-slate-800 rounded-2xl p-6 mb-6">
      <h2 className="text-slate-200 font-semibold text-lg mb-4">
        Historique ICQ-20 {variant.toUpperCase()}
      </h2>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            ticks={ticks}
            tickFormatter={formatDate}
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
          <ReferenceLine y={1000} stroke="#475569" strokeDasharray="4 4" label={{ value: "Base 1000", fill: "#64748b", fontSize: 11 }} />
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
