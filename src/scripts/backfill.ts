/**
 * npm run backfill [-- --from YYYY-MM-DD]
 *
 * Reconstruit l'historique complet de l'ICQ-20 depuis t0.
 * Si data.json existe déjà avec une config, il ne réinitialise PAS le diviseur
 * (sauf si --reset est passé). Les dates déjà présentes sont écrasées (idempotent).
 */
import constituentsConfig from "../../data/constituents.json" with { type: "json" };
import { fetchAllHistory } from "../data/fetch.js";
import { loadStore, saveStore, upsertEntry } from "../data/store.js";
import { initializeIndex, calculateIndex } from "../engine/index.js";
import type { Constituent } from "../engine/index.js";

const constituents = constituentsConfig.constituents as Constituent[];
const tickers = constituents.map((c) => c.ticker);

// Lecture des arguments
const args = process.argv.slice(2);
const fromArg = args[find(args, "--from") + 1];
const resetFlag = args.includes("--reset");

function find(arr: string[], val: string) {
  return arr.indexOf(val);
}

// Date de début par défaut : 2022-01-03 (premier jour ouvrable disponible)
const DEFAULT_T0 = "2022-01-03";
const fromDate = new Date(fromArg ?? DEFAULT_T0);
const toDate = new Date();
toDate.setHours(23, 59, 59);

console.log(`\n=== ICQ-20 Backfill ===`);
console.log(`Période : ${fromDate.toISOString().slice(0, 10)} → aujourd'hui`);
console.log(`Constituants : ${tickers.length}\n`);

const store = loadStore();
let needsInit = resetFlag || !store.config.t0 || !store.config.divisor;

// --reset : vider l'historique et les prix existants pour repartir proprement
if (resetFlag) {
  store.history = [];
  store.prices = {};
}

// Récupération de l'historique complet
console.log("Récupération des données Yahoo Finance…\n");
const byDate = await fetchAllHistory(tickers, fromDate, toDate);

const sortedDates = Array.from(byDate.keys()).sort();
if (sortedDates.length === 0) {
  console.error("Aucune donnée reçue. Vérifiez les tickers et la connexion.");
  process.exit(1);
}

// Initialisation du diviseur à t0 (premier jour avec données complètes)
if (needsInit) {
  const t0 = sortedDates[0];
  const pricesT0 = byDate.get(t0)!;
  const t0PR: Record<string, number> = {};
  const t0TR: Record<string, number> = {};
  for (const ticker of tickers) {
    if (pricesT0[ticker]) {
      t0PR[ticker] = pricesT0[ticker].close;
      t0TR[ticker] = pricesT0[ticker].adjClose;
    }
  }

  // Vérifier qu'on a tous les prix à t0
  const missing = tickers.filter((t) => !t0PR[t]);
  if (missing.length > 0) {
    console.warn(`Tickers sans prix à t0 (${t0}) : ${missing.join(", ")} — ils seront ignorés au premier jour.`);
  }

  const config = initializeIndex(
    constituents.filter((c) => t0PR[c.ticker]),
    t0PR,
    t0,
    1000,
    t0TR,
  );
  store.config = config;
  console.log(`Diviseur initialisé : D = ${config.divisor.toFixed(8)}`);
  console.log(`Date de référence : ${t0}\n`);
}

// Calcul jour par jour
let lastPR: Record<string, number> = {};
let lastTR: Record<string, number> = {};
let processed = 0;

for (const date of sortedDates) {
  const dayData = byDate.get(date)!;
  const pricesPR: Record<string, number> = {};
  const pricesTR: Record<string, number> = {};

  for (const ticker of tickers) {
    if (dayData[ticker]) {
      pricesPR[ticker] = dayData[ticker].close;
      pricesTR[ticker] = dayData[ticker].adjClose;
    }
  }

  try {
    const result = calculateIndex(store.config, pricesPR, date, pricesTR, lastPR, lastTR);
    upsertEntry(store, { date, pr: result.pr, tr: result.tr }, result.pricesPR);
    lastPR = result.pricesPR;
    lastTR = result.pricesTR;
    processed++;
    if (processed % 50 === 0 || processed === sortedDates.length) {
      process.stdout.write(`\r  ${processed}/${sortedDates.length} jours traités…`);
    }
  } catch (err) {
    console.warn(`\n  [backfill] ${date} ignoré : ${err instanceof Error ? err.message : err}`);
  }
}

console.log(`\n\nSauvegarde de data.json…`);
saveStore(store);

const first = store.history[0];
const last = store.history[store.history.length - 1];
console.log(`\n✓ Backfill terminé.`);
console.log(`  ${store.history.length} jours en historique`);
console.log(`  Valeur à t0   : ${first?.pr.toFixed(2)} PR / ${first?.tr.toFixed(2)} TR`);
console.log(`  Valeur actuelle : ${last?.pr.toFixed(2)} PR / ${last?.tr.toFixed(2)} TR`);
