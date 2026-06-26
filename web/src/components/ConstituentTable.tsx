import type { HistoryEntry, IndexConfig } from "../hooks/useIndexData";
import constituentsRaw from "../../../data/constituents.json";

interface Constituent {
  ticker: string;
  name: string;
  sector: string;
  weight: number;
}

const constituents = (constituentsRaw as { constituents: Constituent[] }).constituents;

interface Props {
  history: HistoryEntry[];
  config: IndexConfig;
  variant: "pr" | "tr";
}

export function ConstituentTable({ history, config, variant }: Props) {
  const last = history[history.length - 1];

  if (!last) return null;

  const indexValue = variant === "pr" ? last.pr : last.tr;

  const rows = constituents.map((c) => {
    const weight = config.weights[c.ticker] ?? c.weight;
    // Contribution en points = poids × valeur de l'indice
    const contrib = weight * indexValue;

    return {
      ticker: c.ticker,
      name: c.name,
      sector: c.sector,
      weight,
      contrib,
    };
  });

  // Tri par poids décroissant
  rows.sort((a, b) => b.weight - a.weight);

  return (
    <div className="bg-slate-800 rounded-2xl p-6 mb-6 overflow-x-auto">
      <h2 className="text-slate-200 font-semibold text-lg mb-4">Constituants</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 border-b border-slate-700">
            <th className="text-left py-2 pr-4 font-medium">Société</th>
            <th className="text-left py-2 pr-4 font-medium">Ticker</th>
            <th className="text-left py-2 pr-4 font-medium hidden md:table-cell">Secteur</th>
            <th className="text-right py-2 pr-4 font-medium">Poids cible</th>
            <th className="text-right py-2 font-medium">Contribution (pts)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.ticker} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
              <td className="py-2 pr-4 text-slate-200 font-medium">{r.name}</td>
              <td className="py-2 pr-4">
                <span className="font-mono text-blue-400 text-xs bg-blue-950/50 px-2 py-0.5 rounded">
                  {r.ticker}
                </span>
              </td>
              <td className="py-2 pr-4 text-slate-400 hidden md:table-cell">{r.sector}</td>
              <td className="py-2 pr-4 text-right tabular-nums text-slate-200">
                {(r.weight * 100).toFixed(1)}%
              </td>
              <td className="py-2 text-right tabular-nums text-slate-200">
                {r.contrib.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
