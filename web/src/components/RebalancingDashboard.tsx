import type { IndexConfig, HistoryEntry } from "../hooks/useIndexData";
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
  history: HistoryEntry[];
  variant: "pr" | "tr";
}

const DRIFT_THRESHOLD = 0.02;

export function RebalancingDashboard({ config, prices, history, variant }: Props) {
  const last = history[history.length - 1];
  if (!last) return null;

  const indexValue = variant === "pr" ? last.pr : last.tr;
  const lastDate = Object.keys(prices).sort().at(-1);

  const rows = constituents.map((c) => {
    const targetWeight = config.weights[c.ticker] ?? c.weight;
    const units = config.units[c.ticker] ?? 0;
    const price = lastDate ? prices[lastDate]?.[c.ticker] : undefined;
    const divisor = variant === "pr" ? config.divisor : (config.trDivisor ?? config.divisor);
    const effectiveWeight = price && indexValue > 0 ? (units * price) / (divisor * indexValue) : null;
    const drift = effectiveWeight != null ? effectiveWeight - targetWeight : null;
    const driftAbs = drift != null ? Math.abs(drift) : null;
    const needsRebalance = driftAbs != null && driftAbs > DRIFT_THRESHOLD;
    return { ...c, targetWeight, effectiveWeight, drift, driftAbs, needsRebalance };
  }).sort((a, b) => (b.driftAbs ?? 0) - (a.driftAbs ?? 0));

  const overweighted = rows.filter((r) => (r.drift ?? 0) > DRIFT_THRESHOLD);
  const underweighted = rows.filter((r) => (r.drift ?? 0) < -DRIFT_THRESHOLD);
  const needsAction = overweighted.length + underweighted.length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-slate-800 dark:text-slate-200 font-semibold text-lg">Tableau de bord de rééquilibrage</h2>
        {needsAction > 0 ? (
          <span className="text-xs bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-500/30 px-3 py-1 rounded-full">
            {needsAction} titre{needsAction > 1 ? "s" : ""} à rééquilibrer
          </span>
        ) : (
          <span className="text-xs bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-500/30 px-3 py-1 rounded-full">
            Portefeuille équilibré
          </span>
        )}
      </div>
      <p className="text-slate-400 dark:text-slate-500 text-xs mb-5">
        Dérive &gt; {(DRIFT_THRESHOLD * 100).toFixed(0)}% → rééquilibrage suggéré · Poids effectif = unités × cours / valeur indice
      </p>

      <div className="space-y-2">
        {rows.map((r) => {
          const drift = r.drift ?? 0;
          const effective = r.effectiveWeight ?? r.targetWeight;
          const barWidth = Math.min(Math.abs(drift) / DRIFT_THRESHOLD, 1) * 100;
          return (
            <div key={r.ticker} className="grid grid-cols-[1fr_auto_auto_120px] md:grid-cols-[1fr_80px_80px_160px] items-center gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-blue-500 text-xs bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded shrink-0">{r.ticker}</span>
                <span className="text-slate-600 dark:text-slate-300 text-sm truncate hidden sm:block">{r.name}</span>
              </div>
              <span className="text-right text-slate-400 dark:text-slate-400 text-xs tabular-nums">{(r.targetWeight * 100).toFixed(0)}%</span>
              <span className={`text-right text-xs tabular-nums font-medium ${r.needsRebalance ? (drift > 0 ? "text-yellow-600 dark:text-yellow-400" : "text-blue-600 dark:text-blue-400") : "text-slate-600 dark:text-slate-300"}`}>
                {(effective * 100).toFixed(1)}%
              </span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${r.needsRebalance ? (drift > 0 ? "bg-yellow-400" : "bg-blue-400") : "bg-slate-400 dark:bg-slate-500"}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className={`text-xs tabular-nums w-14 text-right ${r.needsRebalance ? (drift > 0 ? "text-yellow-600 dark:text-yellow-400" : "text-blue-600 dark:text-blue-400") : "text-slate-400 dark:text-slate-500"}`}>
                  {drift >= 0 ? "+" : ""}{(drift * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 mt-5 text-xs text-slate-400 dark:text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />Surpondéré</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />Sous-pondéré</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 inline-block" />Dans la cible</span>
      </div>
    </div>
  );
}
