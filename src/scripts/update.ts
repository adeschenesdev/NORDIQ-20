/**
 * npm run update
 *
 * Récupère les cours de clôture du jour, calcule PR et TR,
 * ajoute la ligne dans data.json (idempotent par date).
 * Si data.json n'existe pas encore, indique de lancer backfill d'abord.
 */
import { fetchTodayPrices } from "../data/fetch.js";
import { loadStore, saveStore, upsertEntry, dataPathFor, loadConstituents } from "../data/store.js";
import { calculateIndex } from "../engine/index.js";

const args = process.argv.slice(2);
const nameIdx = args.indexOf("--name");
const nameArg = nameIdx >= 0 ? args[nameIdx + 1] : undefined;
const dataPath = dataPathFor(nameArg);

const constituents = loadConstituents(nameArg);
const tickers = constituents.map((c) => c.ticker);

const store = loadStore(dataPath);
store.constituents = constituents;

if (!store.config.t0 || !store.config.divisor) {
  console.error("data.json introuvable ou non initialisé. Lancez d'abord : npm run backfill");
  process.exit(1);
}

console.log("=== NORDIQ-20 Update ===");
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

const lastEntry = store.history[store.history.length - 1];

// Cours précédents comme fallback (depuis prices stockés)
const lastDate = lastEntry?.date;
const lastPR: Record<string, number> = lastDate ? (store.prices[lastDate] ?? {}) : {};
const lastTR: Record<string, number> = lastPR;

try {
  const result = calculateIndex(store.config, pricesPR, today, pricesTR, lastPR, lastTR);
  upsertEntry(store, { date: today, pr: result.pr, tr: result.tr }, result.pricesPR);
  saveStore(store, dataPath);

  const prev = lastEntry;
  const deltaPR = prev ? result.pr - prev.pr : 0;
  const deltaPct = prev ? (deltaPR / prev.pr) * 100 : 0;

  console.log(`✓ ${today}`);
  console.log(`  NORDIQ-20 PR : ${result.pr.toFixed(2)}  (${deltaPR >= 0 ? "+" : ""}${deltaPR.toFixed(2)} pts, ${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(2)}%)`);
  console.log(`  NORDIQ-20 TR : ${result.tr.toFixed(2)}`);

  // Synchronise automatiquement web/dist/<fichier> si le dossier existe (site IIS)
  try {
    const { copyFileSync, existsSync } = await import("fs");
    const { join, dirname, basename } = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const fileName = basename(dataPath);
    const dist = join(__dirname, "../../web/dist", fileName);
    if (existsSync(join(__dirname, "../../web/dist"))) {
      copyFileSync(dataPath, dist);
      console.log(`  ✓ web/dist/${fileName} synchronisé`);
    }
  } catch {
    // Pas bloquant si dist/ n'existe pas encore
  }
} catch (err) {
  console.error(`Erreur de calcul : ${err instanceof Error ? err.message : err}`);
  process.exit(1);
}
