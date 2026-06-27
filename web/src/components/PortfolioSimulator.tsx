import { useState } from "react";
import type { IndexConfig } from "../hooks/useIndexData";
import constituentsRaw from "../../../data/constituents.json";

interface Constituent {
  ticker: string;
  name: string;
  sector: string;
  weight: number;
}

const constituents = (constituentsRaw as { constituents: Constituent[] }).constituents;

interface Props {
  config: IndexConfig;
  prices: Record<string, Record<string, number>>;
}

function fmt(n: number) {
  return n.toLocaleString("fr-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PortfolioSimulator({ config, prices }: Props) {
  const [budget, setBudget] = useState(10000);

  const lastDate = Object.keys(prices).sort().at(-1);

  const rows = constituents.map((c) => {
    const weight = config.weights[c.ticker] ?? c.weight;
    const price = lastDate ? prices[lastDate]?.[c.ticker] : undefined;
    const allocated = budget * weight;
    const shares = price ? Math.floor(allocated / price) : 0;
    const cost = price ? shares * price : 0;
    const realWeight = budget > 0 && cost > 0 ? cost / budget : 0;
    const weightDiff = realWeight - weight;
    return { ...c, weight, price, allocated, shares, cost, realWeight, weightDiff };
  }).sort((a, b) => b.weight - a.weight);

  const totalInvested = rows.reduce((s, r) => s + r.cost, 0);
  const cashLeft = budget - totalInvested;
  const titresSansPosition = rows.filter((r) => r.shares === 0).length;

  return (
    <div className="bg-slate-800 rounded-2xl p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <h2 className="text-slate-200 font-semibold text-lg">Simulateur de portefeuille</h2>
        <div className="flex items-center gap-2">
          <label className="text-slate-400 text-sm">Budget :</label>
          <input
            type="number"
            value={budget}
            min={100}
            step={1000}
            onChange={(e) => setBudget(Math.max(0, Number(e.target.value)))}
            className="bg-slate-700 text-slate-100 text-sm rounded-lg px-3 py-1.5 w-32 tabular-nums border border-slate-600 focus:outline-none focus:border-blue-500"
          />
          <span className="text-slate-400 text-sm">$</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700">
              <th className="text-left py-2 pr-4 font-medium">Société</th>
              <th className="text-left py-2 pr-4 font-medium hidden md:table-cell">Ticker</th>
              <th className="text-right py-2 pr-4 font-medium">Poids cible</th>
              <th className="text-right py-2 pr-4 font-medium">Cours</th>
              <th className="text-right py-2 pr-4 font-medium">Actions</th>
              <th className="text-right py-2 pr-4 font-medium">Coût</th>
              <th className="text-right py-2 font-medium hidden sm:table-cell">Écart poids</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.ticker}
                className={`border-b border-slate-700/50 ${r.shares === 0 ? "opacity-50" : ""}`}
              >
                <td className="py-2 pr-4 text-slate-200 font-medium">
                  {r.shares === 0 && <span className="text-red-400 text-xs mr-1">✗</span>}
                  {r.name}
                </td>
                <td className="py-2 pr-4 hidden md:table-cell">
                  <span className="font-mono text-blue-400 text-xs bg-blue-950/50 px-2 py-0.5 rounded">{r.ticker}</span>
                </td>
                <td className="py-2 pr-4 text-right tabular-nums text-slate-300">{(r.weight * 100).toFixed(0)}%</td>
                <td className="py-2 pr-4 text-right tabular-nums text-slate-300">
                  {r.price != null ? `${fmt(r.price)} $` : "—"}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums text-slate-100 font-semibold">{r.shares}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-slate-200">
                  {r.cost > 0 ? `${fmt(r.cost)} $` : "—"}
                </td>
                <td className="py-2 text-right tabular-nums hidden sm:table-cell">
                  {r.shares > 0 ? (
                    <span className={Math.abs(r.weightDiff) > 0.02 ? "text-yellow-400" : "text-slate-400"}>
                      {r.weightDiff >= 0 ? "+" : ""}{(r.weightDiff * 100).toFixed(1)}%
                    </span>
                  ) : <span className="text-red-400 text-xs">insuffisant</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-700 rounded-xl p-3">
          <p className="text-slate-400 text-xs mb-1">Total investi</p>
          <p className="text-slate-100 font-bold">{fmt(totalInvested)} $</p>
        </div>
        <div className="bg-slate-700 rounded-xl p-3">
          <p className="text-slate-400 text-xs mb-1">Cash résiduel</p>
          <p className={`font-bold ${cashLeft > 0 ? "text-slate-100" : "text-red-400"}`}>{fmt(cashLeft)} $</p>
        </div>
        <div className="bg-slate-700 rounded-xl p-3">
          <p className="text-slate-400 text-xs mb-1">% du budget investi</p>
          <p className="text-slate-100 font-bold">{budget > 0 ? ((totalInvested / budget) * 100).toFixed(1) : "0"}%</p>
        </div>
        <div className="bg-slate-700 rounded-xl p-3">
          <p className="text-slate-400 text-xs mb-1">Titres sans position</p>
          <p className={`font-bold ${titresSansPosition > 0 ? "text-red-400" : "text-green-400"}`}>{titresSansPosition}</p>
        </div>
      </div>
      {titresSansPosition > 0 && (
        <p className="text-slate-500 text-xs mt-3">
          ✗ = budget insuffisant pour acheter au moins 1 action. Augmentez le budget ou utilisez un courtier offrant des fractions d'actions.
        </p>
      )}
    </div>
  );
}
