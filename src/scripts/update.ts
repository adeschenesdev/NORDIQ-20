/**
 * npm run update
 *
 * Récupère les cours de clôture du jour, calcule PR et TR,
 * ajoute la ligne dans data.json (idempotent par date).
 * Si data.json n'existe pas encore, indique de lancer backfill d'abord.
 */
import constituentsConfig from "../../data/constituents.json" with { type: "json" };
import { fetchTodayPrices } from "../data/fetch.js";
import { loadStore, saveStore, upsertEntry } from "../data/store.js";
import { calculateIndex } from "../engine/index.js";
import type { Constituent } from "../engine/index.js";

const constituents = constituentsConfig.constituents as Constituent[];
const tickers = constituents.map((c) => c.ticker);

const store = loadStore();

if (!store.config.t0 || !store.config.divisor) {
  console.error("data.json introuvable ou non initialisé. Lancez d'abord : npm run backfill");
  process.exit(1);
}

console.log("=== ICQ-20 Update ===");
console.log("Récupération des cours…\n");

const todayPrices = await fetchTodayPrices(tickers);
const today = new Date().toISOString().slice(0, 10);

const pricesPR: Record<string, number> = {};
const pricesTR: Record<string, number> = {};

for (const ticker of tickers) {
  const p = todayPrices[ticker];
  if (p) {
    pricesPR[ticker] = p.close;
    pricesTR[ticker] = p.adjClose;
  }
}

// Cours précédents comme fallback
const lastEntry = store.history[store.history.length - 1];
const lastPR: Record<string, number> = {};
const lastTR: Record<string, number> = {};

// On n'a pas de prix par ticker dans l'historique agrégé —
// les cours manquants du jour seront signalés mais ne bloqueront pas.
// Pour un report fiable, utiliser le backfill.

try {
  const result = calculateIndex(store.config, pricesPR, today, pricesTR, lastPR, lastTR);
  upsertEntry(store, { date: today, pr: result.pr, tr: result.tr });
  saveStore(store);

  const prev = lastEntry;
  const deltaPR = prev ? result.pr - prev.pr : 0;
  const deltaPct = prev ? (deltaPR / prev.pr) * 100 : 0;

  console.log(`✓ ${today}`);
  console.log(`  ICQ-20 PR : ${result.pr.toFixed(2)}  (${deltaPR >= 0 ? "+" : ""}${deltaPR.toFixed(2)} pts, ${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(2)}%)`);
  console.log(`  ICQ-20 TR : ${result.tr.toFixed(2)}`);
} catch (err) {
  console.error(`Erreur de calcul : ${err instanceof Error ? err.message : err}`);
  process.exit(1);
}
