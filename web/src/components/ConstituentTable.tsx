import { useState } from "react";
import type { HistoryEntry, IndexConfig, Constituent } from "../hooks/useIndexData";
import { ConstituentDetail } from "./ConstituentDetail";
import type { Period } from "./HistoryChart";
import { exportConstituentsCSV } from "../utils/csvExport";

interface Props {
  history: HistoryEntry[];
  config: IndexConfig;
  constituents: Constituent[];
  variant: "pr" | "tr";
  period: Period;
  prices: Record<string, Record<string, number>>;
  sectorFilter?: string | null;
}

export function ConstituentTable({ history, config, constituents, variant, period, prices, sectorFilter }: Props) {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const last = history[history.length - 1];

  if (!last) return null;

  const indexValue = variant === "pr" ? last.pr : last.tr;

  const sortedDates = Object.keys(prices).sort();
  const lastDate = sortedDates.at(-1) ?? last.date;
  const prevDate = sortedDates.at(-2);

  const rows = constituents.map((c) => {
    const weight = config.weights[c.ticker] ?? c.weight;
    const contrib = weight * indexValue;
    const currentPrice = prices[lastDate]?.[c.ticker];
    const prevPrice = prevDate ? prices[prevDate]?.[c.ticker] : undefined;
    const dayChange = currentPrice && prevPrice ? ((currentPrice - prevPrice) / prevPrice) * 100 : null;
    return { ...c, weight, contrib, currentPrice, dayChange };
  });

  rows.sort((a, b) => b.weight - a.weight);
  const filteredRows = sectorFilter ? rows.filter((r) => r.sector === sectorFilter) : rows;
  const selectedConstituent = constituents.find((c) => c.ticker === selectedTicker) ?? null;

  function handleRowClick(ticker: string) {
    setSelectedTicker((prev) => (prev === ticker ? null : ticker));
  }

  function handleExportCSV() {
    exportConstituentsCSV(rows.map((r) => ({
      ticker: r.ticker,
      name: r.name,
      sector: r.sector,
      currentPrice: r.currentPrice,
      dayChange: r.dayChange,
      weight: r.weight,
      contrib: r.contrib,
    })), lastDate);
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 overflow-x-auto shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-slate-800 dark:text-slate-200 font-semibold text-lg">
          Constituants {sectorFilter && <span className="text-blue-500 text-base">— {sectorFilter}</span>}
        </h2>
        <button
          onClick={handleExportCSV}
          className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors"
        >
          ↓ CSV
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
            <th className="text-left py-2 pr-4 font-medium">Société</th>
            <th className="text-left py-2 pr-4 font-medium">Ticker</th>
            <th className="text-left py-2 pr-4 font-medium hidden md:table-cell">Secteur</th>
            <th className="text-right py-2 pr-4 font-medium">Cours</th>
            <th className="text-right py-2 pr-4 font-medium hidden sm:table-cell">Δ jour</th>
            <th className="text-right py-2 pr-4 font-medium">Poids</th>
            <th className="text-right py-2 font-medium">Contrib. (pts)</th>
          </tr>
        </thead>
        <tbody>
          {filteredRows.map((r) => {
            const isSelected = selectedTicker === r.ticker;
            return (
              <tr
                key={r.ticker}
                onClick={() => handleRowClick(r.ticker)}
                className={`border-b border-slate-100 dark:border-slate-700/50 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                    : "hover:bg-slate-50 dark:hover:bg-slate-700/30"
                }`}
              >
                <td className="py-2 pr-4 text-slate-800 dark:text-slate-200 font-medium">
                  <span className="flex items-center gap-1">
                    {isSelected && <span className="text-blue-500 text-xs">▶</span>}
                    {r.name}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <span className="font-mono text-blue-500 text-xs bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                    {r.ticker}
                  </span>
                </td>
                <td className="py-2 pr-4 text-slate-500 dark:text-slate-400 hidden md:table-cell">{r.sector}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-slate-700 dark:text-slate-200">
                  {r.currentPrice != null
                    ? r.currentPrice.toLocaleString("fr-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : "—"}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums hidden sm:table-cell">
                  {r.dayChange != null ? (
                    <span className={r.dayChange >= 0 ? "text-green-500" : "text-red-500"}>
                      {r.dayChange >= 0 ? "+" : ""}{r.dayChange.toFixed(2)}%
                    </span>
                  ) : "—"}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums text-slate-700 dark:text-slate-200">
                  {(r.weight * 100).toFixed(0)}%
                </td>
                <td className="py-2 text-right tabular-nums text-slate-700 dark:text-slate-200">
                  {r.contrib.toFixed(1)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {selectedConstituent && (
        <div className="mt-4">
          <ConstituentDetail
            constituent={selectedConstituent}
            prices={prices}
            period={period}
            indexValue={indexValue}
            onClose={() => setSelectedTicker(null)}
          />
        </div>
      )}
    </div>
  );
}
