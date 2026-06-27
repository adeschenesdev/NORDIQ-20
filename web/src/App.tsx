import { useState, useEffect } from "react";
import { useIndexData } from "./hooks/useIndexData";
import { IndexHeader } from "./components/IndexHeader";
import { HistoryChart } from "./components/HistoryChart";
import type { Period } from "./components/HistoryChart";
import { ConstituentTable } from "./components/ConstituentTable";
import { SectorChart } from "./components/SectorChart";
import { PortfolioSimulator } from "./components/PortfolioSimulator";
import { RebalancingDashboard } from "./components/RebalancingDashboard";
import { AboutModal } from "./components/AboutModal";

type IndexKey = "live" | "backtest";

export default function App() {
  const [activeIndex, setActiveIndex] = useState<IndexKey>("live");
  const dataUrl = activeIndex === "backtest" ? "./data-backtest.json" : "./data.json";
  const { data, error, loading } = useIndexData(dataUrl);
  const [variant, setVariant] = useState<"pr" | "tr">("pr");
  const [period, setPeriod] = useState<Period>("1A");
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const lastEntry = data?.history[data.history.length - 1];
  useEffect(() => {
    if (lastEntry) {
      const val = variant === "pr" ? lastEntry.pr : lastEntry.tr;
      document.title = `NORDIQ-20 ${variant.toUpperCase()}: ${val.toFixed(2)} pts`;
    }
  }, [lastEntry, variant]);

  const tabBar = (
    <div className="flex gap-2 mb-6">
      {(
        [
          ["live", "NORDIQ-20"],
          ["backtest", "Backtest 5 ans"],
        ] as const
      ).map(([key, label]) => (
        <button
          key={key}
          onClick={() => setActiveIndex(key)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeIndex === key
              ? "bg-blue-600 text-white"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div data-theme={theme} className="min-h-screen bg-slate-100 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {tabBar}
          <div className="text-slate-400 dark:text-slate-400 py-20 text-center">Chargement des données…</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div data-theme={theme} className="min-h-screen bg-slate-100 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {tabBar}
          <div className="text-center py-20">
            <p className="text-xl font-bold mb-2 text-red-500">Données indisponibles</p>
            <p className="text-sm text-slate-500">{error ?? "data.json introuvable"}</p>
          </div>
        </div>
      </div>
    );
  }

  const updatedAt = data.meta?.updatedAt
    ? new Date(data.meta.updatedAt).toLocaleString("fr-CA", { dateStyle: "long", timeStyle: "short" })
    : "—";

  return (
    <div data-theme={theme} className="min-h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-200">
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {tabBar}
        {activeIndex === "backtest" && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 rounded-2xl px-5 py-4 mb-6 text-sm">
            <p className="font-semibold mb-1">⚠ Historique reconstitué (backtest)</p>
            <p>
              Cette vue applique <strong>rétroactivement</strong> les 19 constituants actuels depuis 2021.
              Les sociétés ayant été choisies en sachant lesquelles ont réussi, la performance passée est
              embellie par le <strong>biais du survivant</strong>. À titre illustratif uniquement : ce n'est
              pas la performance réelle qu'aurait eue l'indice à l'époque.
            </p>
          </div>
        )}
        <IndexHeader
          history={data.history}
          variant={variant}
          onVariantChange={setVariant}
          onAboutClick={() => setShowAbout(true)}
          theme={theme}
          onThemeToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        />
        <HistoryChart history={data.history} variant={variant} period={period} onPeriodChange={setPeriod} />
        <div className="grid grid-cols-1 gap-6">
          <ConstituentTable
            history={data.history}
            config={data.config}
            variant={variant}
            period={period}
            prices={data.prices ?? {}}
            sectorFilter={selectedSector}
          />
          <SectorChart onSectorClick={setSelectedSector} selectedSector={selectedSector} />
          <RebalancingDashboard config={data.config} prices={data.prices ?? {}} history={data.history} variant={variant} />
          <PortfolioSimulator config={data.config} prices={data.prices ?? {}} />
        </div>
        <footer className="mt-8 text-center text-xs text-slate-400 dark:text-slate-600 space-y-1">
          <p>
            Dernière mise à jour : {updatedAt} · Source : {data.meta?.source ?? "yahoo-finance2"}
            {" · "}
            <button onClick={() => setShowAbout(true)} className="underline hover:text-slate-600 dark:hover:text-slate-400">À propos</button>
          </p>
          <p className="text-slate-300 dark:text-slate-700 opacity-70">
            ⚠ Ceci n'est pas un conseil de placement. Le NORDIQ-20 est un indice expérimental à titre éducatif uniquement.
          </p>
          <p className="text-slate-300 dark:text-slate-700 opacity-70">
            Les données proviennent de yahoo-finance2, une source non officielle et non affiliée à Yahoo Finance.
          </p>
        </footer>
      </div>
    </div>
  );
}
