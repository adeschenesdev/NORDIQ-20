/**
 * npm run rebalance
 *
 * Recalcule les unités q_i et le diviseur D à partir des cours courants
 * et des poids définis dans constituents.json.
 * La valeur de l'indice reste continue (pas de saut).
 */
import constituentsConfig from "../../data/constituents.json" with { type: "json" };
import { fetchTodayPrices } from "../data/fetch.js";
import { loadStore, saveStore, dataPathFor } from "../data/store.js";
import { rebalanceIndex } from "../engine/index.js";
import type { Constituent } from "../engine/index.js";

const constituents = constituentsConfig.constituents as Constituent[];
const tickers = constituents.map((c) => c.ticker);

const args = process.argv.slice(2);
const nameIdx = args.indexOf("--name");
const nameArg = nameIdx >= 0 ? args[nameIdx + 1] : undefined;
const dataPath = dataPathFor(nameArg);

const store = loadStore(dataPath);

if (!store.config.t0 || !store.history.length) {
  console.error("data.json vide. Lancez d'abord : npm run backfill");
  process.exit(1);
}

const lastEntry = store.history[store.history.length - 1];
console.log(`=== NORDIQ-20 Rééquilibrage ===`);
console.log(`Valeur actuelle : ${lastEntry.pr.toFixed(2)} PR (${lastEntry.date})\n`);
console.log("Récupération des cours courants…\n");

const todayPrices = await fetchTodayPrices(tickers);
const today = new Date().toISOString().slice(0, 10);

const currentPrices: Record<string, number> = {};
for (const ticker of tickers) {
  const p = todayPrices[ticker];
  if (p) currentPrices[ticker] = p.close;
}

const missing = tickers.filter((t) => !currentPrices[t]);
if (missing.length > 0) {
  console.error(`Prix manquants pour : ${missing.join(", ")}. Impossible de rééquilibrer.`);
  process.exit(1);
}

const newConfig = rebalanceIndex(lastEntry.pr, constituents, currentPrices, today);

console.log("Nouveau diviseur :", newConfig.divisor.toFixed(8));
console.log("Nouvelles unités :");
for (const [ticker, q] of Object.entries(newConfig.units)) {
  console.log(`  ${ticker.padEnd(12)} q = ${q.toFixed(8)}`);
}

store.config = newConfig;
saveStore(store, dataPath);

console.log(`\n✓ Rééquilibrage effectué le ${today}. data.json mis à jour.`);
