import { useState, useEffect } from "react";

export interface HistoryEntry {
  date: string;
  pr: number;
  tr: number;
}

export interface IndexConfig {
  t0: string;
  divisor: number;
  trDivisor: number;
  units: Record<string, number>;
  weights: Record<string, number>;
}

export interface Constituent {
  ticker: string;
  name: string;
  sector: string;
  weight: number;
}

export interface IndexData {
  config: IndexConfig;
  /** Métadonnées des constituants — permet d'afficher n'importe quelle composition. */
  constituents: Constituent[];
  history: HistoryEntry[];
  /** Cours de clôture bruts : prices[date][ticker] = close */
  prices: Record<string, Record<string, number>>;
  meta: { updatedAt: string; source: string };
}

// En dev : servi par le middleware Vite (data.json, data-backtest.json, …)
// En prod : fichiers copiés dans dist/ par le workflow CI
export function useIndexData(dataUrl: string = "./data.json") {
  const [data, setData] = useState<IndexData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(dataUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<IndexData>;
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dataUrl]);

  return { data, error, loading };
}
