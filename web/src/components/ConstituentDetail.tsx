import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { Period } from "./HistoryChart";

interface Constituent {
  ticker: string;
  name: string;
  sector: string;
  weight: number;
}

interface Props {
  constituent: Constituent;
  prices: Record<string, Record<string, number>>;
  period: Period;
  indexValue: number;
  onClose: () => void;
}

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

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("fr-CA", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function pctBadge(v: number) {
  const up = v >= 0;
  return (
    <span className={`font-semibold ${up ? "text-green-400" : "text-red-400"}`}>
      {up ? "+" : ""}{v.toFixed(2)}%
    </span>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs shadow-xl">
      <p className="text-slate-400">{label}</p>
      <p className="text-white font-bold">{fmt(payload[0].value)} $</p>
    </div>
  );
}

export function ConstituentDetail({ constituent, prices, period, indexValue, onClose }: Props) {
  const { ticker, name, sector, weight } = constituent;
  const cutoff = cutoffDate(period);

  // Série de prix filtrée par période
  const allDates = Object.keys(prices).sort();
  const filteredDates = cutoff ? allDates.filter((d) => d >= cutoff) : allDates;
  const chartData = filteredDates
    .map((d) => ({ date: d, value: prices[d]?.[ticker] }))
    .filter((d) => d.value != null) as { date: string; value: number }[];

  const currentPrice = chartData[chartData.length - 1]?.value;
  const firstPrice = chartData[0]?.value;
  const perfPeriod = firstPrice && currentPrice ? ((currentPrice - firstPrice) / firstPrice) * 100 : null;

  // Variation YTD
  const ytdCutoff = `${new Date().getFullYear()}-01-01`;
  const ytdFirst = allDates
    .filter((d) => d >= ytdCutoff)
    .map((d) => prices[d]?.[ticker])
    .find((v) => v != null);
  const perfYTD = ytdFirst && currentPrice ? ((currentPrice - ytdFirst) / ytdFirst) * 100 : null;

  // Variation depuis t0 (tout l'historique)
  const t0Price = allDates.map((d) => prices[d]?.[ticker]).find((v) => v != null);
  const perfT0 = t0Price && currentPrice ? ((currentPrice - t0Price) / t0Price) * 100 : null;

  const contribution = weight * indexValue;

  const yahooUrl = `https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}`;

  return (
    <div className="bg-slate-750 border border-slate-600 rounded-2xl p-5 mb-4 animate-fade-in" style={{ background: "#1a2538" }}>
      {/* En-tête */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-slate-100 font-bold text-lg">{name}</h3>
            <span className="font-mono text-blue-400 text-xs bg-blue-950/50 px-2 py-0.5 rounded">
              {ticker}
            </span>
          </div>
          <p className="text-slate-400 text-sm">{sector} · Poids cible : {(weight * 100).toFixed(1)}%</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={yahooUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
          >
            Yahoo Finance ↗
          </a>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-xl leading-none"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-slate-800 rounded-xl p-3">
          <p className="text-slate-500 text-xs mb-1">Cours actuel</p>
          <p className="text-slate-100 font-bold text-base">
            {currentPrice != null ? `${fmt(currentPrice)} $` : "—"}
          </p>
        </div>
        <div className="bg-slate-800 rounded-xl p-3">
          <p className="text-slate-500 text-xs mb-1">Rendement période</p>
          <p className="text-base font-bold">{perfPeriod != null ? pctBadge(perfPeriod) : "—"}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-3">
          <p className="text-slate-500 text-xs mb-1">Rendement YTD</p>
          <p className="text-base font-bold">{perfYTD != null ? pctBadge(perfYTD) : "—"}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-3">
          <p className="text-slate-500 text-xs mb-1">Rendement depuis t0</p>
          <p className="text-base font-bold">{perfT0 != null ? pctBadge(perfT0) : "—"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-slate-800 rounded-xl p-3 md:col-span-1">
          <p className="text-slate-500 text-xs mb-1">Contribution (pts)</p>
          <p className="text-slate-100 font-bold text-base">{fmt(contribution)} pts</p>
          <p className="text-slate-500 text-xs mt-1">{(weight * 100).toFixed(1)}% × {fmt(indexValue)} pts</p>
        </div>
      </div>

      {/* Mini-graphique */}
      {chartData.length > 1 ? (
        <div>
          <p className="text-slate-500 text-xs mb-2">Cours (CAD) — période sélectionnée</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3f55" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                tickFormatter={(v: string) => v.slice(0, 7)}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={55}
                tickFormatter={(v: number) => fmt(v, 0)}
                domain={["auto", "auto"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#22c55e"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: "#22c55e" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-slate-600 text-sm text-center py-4">
          Données insuffisantes pour la période sélectionnée.
          Lancez <code className="bg-slate-800 px-1 rounded">npm run backfill</code> avec une date antérieure.
        </p>
      )}
    </div>
  );
}
