import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from "recharts";
import type { IndexData } from "../hooks/useIndexData";

/** Indices comparés — ceux qui partagent la base 1000 au 2026-06-01 (le backtest est exclu : autre échelle). */
const SERIES = [
  { key: "live", label: "NORDIQ-20", url: "./data.json", color: "#3b82f6" },
  { key: "revised", label: "NORDIQ-20 Révisé", url: "./data-revised.json", color: "#6366f1" },
  { key: "na", label: "NORDAM-30", url: "./data-na.json", color: "#a855f7" },
  { key: "nordmax", label: "NORDMAX-20", url: "./data-nordmax.json", color: "#f43f5e" },
] as const;

type SeriesKey = (typeof SERIES)[number]["key"];

interface Props {
  theme: "dark" | "light";
  onThemeToggle: () => void;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-CA", { day: "numeric", month: "short" });
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm shadow-xl">
      <p className="text-slate-500 mb-1">{label}</p>
      {payload
        .slice()
        .sort((a, b) => b.value - a.value)
        .map((p) => (
          <p key={p.name} style={{ color: p.color }} className="font-semibold tabular-nums">{p.name} : {p.value.toFixed(2)}</p>
        ))}
    </div>
  );
}

export function ComparisonChart({ theme, onThemeToggle }: Props) {
  const [variant, setVariant] = useState<"pr" | "tr">("pr");
  const [stores, setStores] = useState<Record<string, IndexData> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      SERIES.map((s) =>
        fetch(s.url)
          .then((r) => {
            if (!r.ok) throw new Error(`${s.label}: HTTP ${r.status}`);
            return r.json() as Promise<IndexData>;
          })
          .then((d) => [s.key, d] as const),
      ),
    )
      .then((entries) => {
        if (!cancelled) setStores(Object.fromEntries(entries));
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-red-500 text-sm">Données indisponibles : {error}</div>;
  }
  if (!stores) {
    return <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-slate-400 text-center">Chargement de la comparaison…</div>;
  }

  // Fusion par date : { date, live, revised, na, nordmax }
  const byDate = new Map<string, Record<string, number | string>>();
  for (const s of SERIES) {
    for (const h of stores[s.key].history) {
      const row = byDate.get(h.date) ?? { date: h.date };
      row[s.key] = variant === "pr" ? h.pr : h.tr;
      byDate.set(h.date, row);
    }
  }
  const data = Array.from(byDate.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));

  const axis = theme === "dark" ? "#64748b" : "#94a3b8";
  const grid = theme === "dark" ? "#1e293b" : "#e2e8f0";

  // Cartes résumé : dernière valeur + variation depuis 1000
  const summary = SERIES.map((s) => {
    const hist = stores[s.key].history;
    const last = hist[hist.length - 1];
    const val = last ? (variant === "pr" ? last.pr : last.tr) : 0;
    return { ...s, val, pct: val - 1000 ? ((val - 1000) / 1000) * 100 : 0 };
  }).sort((a, b) => b.val - a.val);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-slate-800 dark:text-slate-200 font-semibold text-lg">
          Comparaison des indices — base 1000 au 1ᵉʳ juin 2026
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {(["pr", "tr"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVariant(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  variant === v ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {v.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={onThemeToggle}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
            title={theme === "dark" ? "Mode clair" : "Mode sombre"}
          >
            {theme === "dark" ? "☀" : "🌙"}
          </button>
        </div>
      </div>

      {/* Cartes résumé */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {summary.map((s) => (
          <div key={s.key} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: s.color }} />
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{s.label}</span>
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{s.val.toFixed(2)}</div>
            <div className={`text-xs font-medium tabular-nums ${s.pct >= 0 ? "text-green-500" : "text-red-500"}`}>
              {s.pct >= 0 ? "+" : ""}{s.pct.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} />
          <XAxis dataKey="date" tickFormatter={formatDate} stroke={axis} fontSize={12} minTickGap={30} />
          <YAxis stroke={axis} fontSize={12} domain={["auto", "auto"]} width={48} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <ReferenceLine y={1000} stroke={axis} strokeDasharray="4 4" />
          {SERIES.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key as SeriesKey}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
