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
  meta: {
    updatedAt: string;
    source: string;
  };
}

const EMPTY_STORE: DataStore = {
  config: {
    t0: "",
    divisor: 0,
    units: {},
    weights: {},
  },
  history: [],
  meta: {
    updatedAt: "",
    source: "yahoo-finance2 (source non officielle, à titre éducatif uniquement)",
  },
};

export function loadStore(): DataStore {
  if (!existsSync(DATA_PATH)) return { ...EMPTY_STORE };
  try {
    return JSON.parse(readFileSync(DATA_PATH, "utf-8")) as DataStore;
  } catch {
    console.warn("[store] data.json invalide, réinitialisation.");
    return { ...EMPTY_STORE };
  }
}

export function saveStore(store: DataStore): void {
  const dir = dirname(DATA_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  store.meta.updatedAt = new Date().toISOString();
  writeFileSync(DATA_PATH, JSON.stringify(store, null, 2), "utf-8");
}

/** Ajoute ou met à jour une entrée par date (idempotent). */
export function upsertEntry(store: DataStore, entry: HistoryEntry): void {
  const idx = store.history.findIndex((h) => h.date === entry.date);
  if (idx >= 0) {
    store.history[idx] = entry;
  } else {
    store.history.push(entry);
    store.history.sort((a, b) => a.date.localeCompare(b.date));
  }
}

/** Retourne le dernier cours connu pour chaque ticker à partir de l'historique. */
export function getLastPrices(
  store: DataStore,
): { pr: Record<string, number>; tr: Record<string, number> } | null {
  if (store.history.length === 0) return null;
  // Les prix par ticker ne sont pas stockés dans l'historique agrégé —
  // cette fonction est un helper pour signaler l'absence de données brutes.
  return null;
}
