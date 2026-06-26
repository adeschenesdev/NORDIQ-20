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

export interface IndexData {
  config: IndexConfig;
  history: HistoryEntry[];
  /** Cours de clôture bruts : prices[date][ticker] = close */
  prices: Record<string, Record<string, number>>;
  meta: { updatedAt: string; source: string };
}

// En dev : servi par le middleware Vite à /data.json
// En prod : data.json copié dans dist/ par le workflow CI
const DATA_URL = "./data.json";

export function useIndexData() {
  const [data, setData] = useState<IndexData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(DATA_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<IndexData>;
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  return { data, error, loading };
}
