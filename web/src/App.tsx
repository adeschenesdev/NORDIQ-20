import { useState, useEffect } from "react";
import { useIndexData } from "./hooks/useIndexData";
import { IndexHeader } from "./components/IndexHeader";
import { HistoryChart } from "./components/HistoryChart";
import type { Period } from "./components/HistoryChart";
import { ConstituentTable } from "./components/ConstituentTable";
import { SectorChart } from "./components/SectorChart";
import { PortfolioSimulator } from "./components/PortfolioSimulator";
import { RebalancingDashboard } from "./components/RebalancingDashboard";
import { ComparisonChart } from "./components/ComparisonChart";
import { AboutModal } from "./components/AboutModal";

const INDICES = [
  { key: "live", label: "NORDIQ-20", name: "NORDIQ-20", subtitle: "Indice canadien", url: "./data.json" },
  { key: "revised", label: "NORDIQ-20 Révisé", name: "NORDIQ-20 Révisé", subtitle: "Indice canadien", url: "./data-revised.json" },
  { key: "na", label: "NORDAM-30", name: "NORDAM-30", subtitle: "Indice nord-américain", url: "./data-na.json" },
  { key: "nordmax", label: "NORDMAX-20", name: "NORDMAX-20", subtitle: "Rendement maximal", url: "./data-nordmax.json" },
  { key: "backtest", label: "Backtest 5 ans", name: "NORDIQ-20", subtitle: "Backtest 5 ans", url: "./data-backtest.json" },
] as const;

type IndexKey = (typeof INDICES)[number]["key"] | "comparison";

export default function App() {
  const [activeIndex, setActiveIndex] = useState<IndexKey>("live");
  const active = INDICES.find((i) => i.key === activeIndex);
  const dataUrl = active?.url ?? "./data.json";
  const { data, error, loading } = useIndexData(dataUrl);
  const [variant, setVariant] = useState<"pr" | "tr">("pr");
  const [period, setPeriod] = useState<Period>("1A");
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const lastEntry = data?.history[data.history.length - 1];
  useEffect(() => {
    if (lastEntry && active) {
      const val = variant === "pr" ? lastEntry.pr : lastEntry.tr;
      document.title = `${active.name} ${variant.toUpperCase()}: ${val.toFixed(2)} pts`;
    } else if (activeIndex === "comparison") {
      document.title = "Comparaison des indices";
    }
  }, [lastEntry, variant, active, activeIndex]);

  const tabBar = (
    <div className="flex flex-wrap gap-2 mb-6">
      {INDICES.map(({ key, label }) => (
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
      <button
        onClick={() => setActiveIndex("comparison")}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
          activeIndex === "comparison"
            ? "bg-blue-600 text-white"
            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
        }`}
      >
        📊 Comparaison
      </button>
    </div>
  );

  if (activeIndex === "comparison") {
    return (
      <div data-theme={theme} className="min-h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {tabBar}
          <ComparisonChart theme={theme} onThemeToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} />
          <footer className="mt-8 text-center text-xs text-slate-400 dark:text-slate-600">
            <p>Comparaison des indices partageant la base 1000 au 1ᵉʳ juin 2026 (le backtest 5 ans est exclu — échelle différente).</p>
          </footer>
        </div>
      </div>
    );
  }

  if (!active) return null; // hors « comparison », active est toujours défini

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
        {activeIndex === "revised" && (
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800/60 text-blue-800 dark:text-blue-300 rounded-2xl px-5 py-4 mb-6 text-sm">
            <p className="font-semibold mb-1">🔄 Composition révisée (à titre comparatif)</p>
            <p>
              Variante de NORDIQ-20 à <strong>20 titres</strong>, sélectionnés par un score mixte
              <strong> rendement YTD 2026 + rendement total 3 ans</strong>, avec une refonte sectorielle
              (Finance et Matériaux allégés, secteur Santé introduit). Lancée le 1ᵉʳ juin 2026 à 1000
              points, en parallèle de l'indice principal, pour comparer les deux approches.
            </p>
          </div>
        )}
        {activeIndex === "na" && (
          <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800/60 text-purple-800 dark:text-purple-300 rounded-2xl px-5 py-4 mb-6 text-sm">
            <p className="font-semibold mb-1">🌎 NORDAM-30 — indice nord-américain (Canada + USA)</p>
            <p>
              <strong>30 titres</strong> canadiens et américains sélectionnés par le même score mixte
              <strong> rendement YTD 2026 + rendement total 3 ans</strong>. Tous les cours sont
              <strong> convertis en CAD</strong> (taux USD/CAD historique), donc la performance inclut le
              change. Lancé le 1ᵉʳ juin 2026 à 1000 points, à titre comparatif.
            </p>
          </div>
        )}
        {activeIndex === "nordmax" && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 rounded-2xl px-5 py-4 mb-6 text-sm">
            <p className="font-semibold mb-1">🚀 NORDMAX-20 — recherche de rendement maximal</p>
            <p>
              <strong>20 titres</strong> nord-américains (en CAD) choisis pour <strong>maximiser le
              rendement</strong> : score penché court terme (<strong>70 % YTD + 30 % 3 ans</strong>),
              pondération concentrée sur les meilleurs, contrainte sectorielle volontairement
              <strong> lâche</strong>. Plus agressif et plus volatil. À titre illustratif uniquement.
            </p>
          </div>
        )}
        <IndexHeader
          history={data.history}
          name={active.name}
          subtitle={active.subtitle}
          variant={variant}
          onVariantChange={setVariant}
          onAboutClick={() => setShowAbout(true)}
          theme={theme}
          onThemeToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        />
        <HistoryChart history={data.history} name={active.name} variant={variant} period={period} onPeriodChange={setPeriod} />
        <div className="grid grid-cols-1 gap-6">
          <ConstituentTable
            history={data.history}
            config={data.config}
            constituents={data.constituents ?? []}
            variant={variant}
            period={period}
            prices={data.prices ?? {}}
            sectorFilter={selectedSector}
          />
          <SectorChart constituents={data.constituents ?? []} onSectorClick={setSelectedSector} selectedSector={selectedSector} />
          <RebalancingDashboard config={data.config} constituents={data.constituents ?? []} prices={data.prices ?? {}} history={data.history} variant={variant} />
          <PortfolioSimulator config={data.config} constituents={data.constituents ?? []} prices={data.prices ?? {}} />
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
