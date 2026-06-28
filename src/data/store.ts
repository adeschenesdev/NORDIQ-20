import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { IndexConfig, Constituent } from "../engine/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../data");

/**
 * Chemin du fichier de données pour un indice donné.
 * Sans nom → data/data.json (indice live, canonique).
 * Avec nom → data/data-<name>.json (ex. data-backtest.json).
 */
export function dataPathFor(name?: string): string {
  return join(DATA_DIR, name ? `data-${name}.json` : "data.json");
}

const DATA_PATH = dataPathFor();

/**
 * Chemin du fichier de constituants pour un indice donné.
 * La « composition » est le nom sans suffixe de période : `revised-backtest` et
 * `revised` partagent `constituents-revised.json` ; `backtest` et le défaut partagent
 * `constituents.json`. Repli sur `constituents.json` si le fichier nommé est absent.
 */
export function constituentsPathFor(name?: string): string {
  const composition = (name ?? "").replace(/-?backtest$/, "");
  const file = composition ? `constituents-${composition}.json` : "constituents.json";
  const candidate = join(DATA_DIR, file);
  return existsSync(candidate) ? candidate : join(DATA_DIR, "constituents.json");
}

/** Charge la liste des constituants pour un indice (selon sa composition). */
export function loadConstituents(name?: string): Constituent[] {
  const path = constituentsPathFor(name);
  const raw = JSON.parse(readFileSync(path, "utf-8")) as { constituents: Constituent[] };
  return raw.constituents;
}

export interface HistoryEntry {
  date: string;
  pr: number;
  tr: number;
}

export interface DataStore {
  config: IndexConfig;
  /** Métadonnées des constituants (ticker, name, sector, weight) — rend le web autonome. */
  constituents: Constituent[];
  history: HistoryEntry[];
  /** Cours de clôture bruts par date et par ticker : prices[date][ticker] = close */
  prices: Record<string, Record<string, number>>;
  meta: {
    updatedAt: string;
    source: string;
  };
}

const EMPTY_STORE: DataStore = {
  config: {
    t0: "",
    divisor: 0,
    trDivisor: 0,
    units: {},
    weights: {},
  },
  constituents: [],
  history: [],
  prices: {},
  meta: {
    updatedAt: "",
    source: "yahoo-finance2 (source non officielle, à titre éducatif uniquement)",
  },
};

export function loadStore(dataPath: string = DATA_PATH): DataStore {
  if (!existsSync(dataPath)) return structuredClone(EMPTY_STORE);
  try {
    const raw = JSON.parse(readFileSync(dataPath, "utf-8")) as DataStore;
    // Compatibilité ascendante : data.json antérieur sans champ prices/constituents
    if (!raw.prices) raw.prices = {};
    if (!raw.constituents) raw.constituents = [];
    return raw;
  } catch {
    console.warn("[store] data.json invalide, réinitialisation.");
    return structuredClone(EMPTY_STORE);
  }
}

export function saveStore(store: DataStore, dataPath: string = DATA_PATH): void {
  const dir = dirname(dataPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  store.meta.updatedAt = new Date().toISOString();
  writeFileSync(dataPath, JSON.stringify(store, null, 2), "utf-8");
}

/** Ajoute ou met à jour une entrée par date (idempotent). */
export function upsertEntry(
  store: DataStore,
  entry: HistoryEntry,
  dayPrices?: Record<string, number>,
): void {
  const idx = store.history.findIndex((h) => h.date === entry.date);
  if (idx >= 0) {
    store.history[idx] = entry;
  } else {
    store.history.push(entry);
    store.history.sort((a, b) => a.date.localeCompare(b.date));
  }
  if (dayPrices) {
    store.prices[entry.date] = dayPrices;
  }
}
