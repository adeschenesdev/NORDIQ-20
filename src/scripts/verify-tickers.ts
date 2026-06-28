import yf from "../data/yf.js";
import { loadConstituents } from "../data/store.js";

const args = process.argv.slice(2);
const nameIdx = args.indexOf("--name");
const nameArg = nameIdx >= 0 ? args[nameIdx + 1] : undefined;

const tickers = loadConstituents(nameArg).map((c) => c.ticker);

console.log(`Vérification de ${tickers.length} tickers Yahoo Finance...\n`);

const results: { ticker: string; ok: boolean; price?: number; error?: string }[] = [];

for (const ticker of tickers) {
  try {
    const quote = await yf.quote(ticker, {}, { validateResult: false });
    const price = quote.regularMarketPrice;
    results.push({ ticker, ok: true, price });
    console.log(`  ✓ ${ticker.padEnd(12)} ${price?.toFixed(2)} CAD`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    results.push({ ticker, ok: false, error: message });
    console.error(`  ✗ ${ticker.padEnd(12)} ÉCHEC — ${message}`);
  }
  await new Promise((r) => setTimeout(r, 300));
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.filter((r) => r.ok).length}/${tickers.length} tickers résolus avec succès.`);
if (failed.length > 0) {
  console.error(`\nTickers en échec :`);
  failed.forEach((r) => console.error(`  - ${r.ticker}: ${r.error}`));
  process.exit(1);
}
