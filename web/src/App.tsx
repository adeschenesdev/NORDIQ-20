import { useState } from "react";
import { useIndexData } from "./hooks/useIndexData";
import { IndexHeader } from "./components/IndexHeader";
import { HistoryChart } from "./components/HistoryChart";
import { ConstituentTable } from "./components/ConstituentTable";
import { SectorChart } from "./components/SectorChart";

export default function App() {
  const { data, error, loading } = useIndexData();
  const [variant, setVariant] = useState<"pr" | "tr">("pr");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Chargement des données…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400">
        <div className="text-center">
          <p className="text-xl font-bold mb-2">Données indisponibles</p>
          <p className="text-sm text-slate-500">{error ?? "data.json introuvable"}</p>
          <p className="text-sm text-slate-600 mt-2">
            Lancez <code className="bg-slate-800 px-1 rounded">npm run backfill</code> pour initialiser l'historique.
          </p>
        </div>
      </div>
    );
  }

  const updatedAt = data.meta?.updatedAt
    ? new Date(data.meta.updatedAt).toLocaleString("fr-CA", {
        dateStyle: "long",
        timeStyle: "short",
      })
    : "—";

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <IndexHeader
          history={data.history}
          variant={variant}
          onVariantChange={setVariant}
        />
        <HistoryChart history={data.history} variant={variant} />
        <div className="grid grid-cols-1 gap-6">
          <ConstituentTable
            history={data.history}
            config={data.config}
            variant={variant}
          />
          <SectorChart />
        </div>
        <footer className="mt-8 text-center text-xs text-slate-600 space-y-1">
          <p>
            Dernière mise à jour : {updatedAt} · Source : {data.meta?.source ?? "yahoo-finance2"}
          </p>
          <p className="text-slate-700">
            ⚠ Ceci n'est pas un conseil de placement. L'ICQ-20 est un indice expérimental à titre éducatif uniquement.
            Les performances passées ne garantissent pas les résultats futurs.
          </p>
          <p className="text-slate-700">
            Les données proviennent de yahoo-finance2, une source non officielle et non affiliée à Yahoo Finance.
            Utilisation à des fins personnelles uniquement, dans le respect des conditions d'utilisation de Yahoo.
          </p>
        </footer>
      </div>
    </div>
  );
}
