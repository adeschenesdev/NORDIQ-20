import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { IndexConfig } from "../engine/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "../../data/data.json");

export interface HistoryEntry {
  date: string;
  pr: number;
  tr: number;
}

export interface DataStore {
  config: IndexConfig;
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
  history: [],
  prices: {},
  meta: {
    updatedAt: "",
    source: "yahoo-finance2 (source non officielle, à titre éducatif uniquement)",
  },
};

export function loadStore(): DataStore {
  if (!existsSync(DATA_PATH)) return structuredClone(EMPTY_STORE);
  try {
    const raw = JSON.parse(readFileSync(DATA_PATH, "utf-8")) as DataStore;
    // Compatibilité ascendante : data.json antérieur sans champ prices
    if (!raw.prices) raw.prices = {};
    return raw;
  } catch {
    console.warn("[store] data.json invalide, réinitialisation.");
    return structuredClone(EMPTY_STORE);
  }
}

export function saveStore(store: DataStore): void {
  const dir = dirname(DATA_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  store.meta.updatedAt = new Date().toISOString();
  writeFileSync(DATA_PATH, JSON.stringify(store, null, 2), "utf-8");
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
