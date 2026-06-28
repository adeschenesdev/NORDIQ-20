/**
 * Conversion de change pour les indices multi-devises (ex. nord-américain CAD + USD).
 *
 * Les titres TSX (.TO, .V, .CN, .NE) sont en CAD ; les autres (US) en USD.
 * On convertit les prix US en CAD avec la paire Yahoo « USDCAD=X » (CAD pour 1 USD),
 * pour que l'indice soit entièrement libellé en CAD.
 */
import { fetchHistory } from "./fetch.js";
import yf from "./yf.js";

const CAD_SUFFIX = /\.(TO|V|CN|NE)$/i;

/** True si le ticker est coté en CAD (suffixe TSX/TSXV/CSE/NEO). */
export function isCadTicker(ticker: string): boolean {
  return CAD_SUFFIX.test(ticker);
}

/** True si au moins un ticker est en USD (déclenche la conversion). */
export function hasUsdTickers(tickers: string[]): boolean {
  return tickers.some((t) => !isCadTicker(t));
}

/** Série historique du taux USD→CAD (CAD pour 1 USD), indexée par date. */
export async function fetchUsdCadSeries(from: Date, to: Date): Promise<Record<string, number>> {
  const rows = await fetchHistory("USDCAD=X", from, to);
  const map: Record<string, number> = {};
  for (const r of rows) map[r.date] = r.close;
  return map;
}

/** Taux USD→CAD du jour (quote temps réel / dernière clôture). */
export async function fetchUsdCadToday(): Promise<number> {
  const q = await yf.quote("USDCAD=X", {}, { validateResult: false });
  return q.regularMarketPrice ?? q.regularMarketPreviousClose ?? 0;
}

/**
 * Convertit en place les prix des tickers US (USD → CAD) dans la map date→ticker→{close,adjClose}.
 * No-op s'il n'y a aucun ticker US. Reporte le dernier taux connu pour les dates sans cotation FX.
 */
export async function convertHistoryToCad(
  byDate: Map<string, Record<string, { close: number; adjClose: number }>>,
  tickers: string[],
  from: Date,
  to: Date,
): Promise<void> {
  const usdTickers = tickers.filter((t) => !isCadTicker(t));
  if (usdTickers.length === 0) return;

  console.log("  [fx] récupération du taux USD/CAD…");
  const fx = await fetchUsdCadSeries(from, to);
  const fxDates = Object.keys(fx).sort();
  if (fxDates.length === 0) {
    console.warn("  [fx] série USDCAD indisponible — prix US laissés en USD !");
    return;
  }

  let lastRate = fx[fxDates[0]];
  for (const date of Array.from(byDate.keys()).sort()) {
    if (fx[date] != null) lastRate = fx[date];
    const day = byDate.get(date)!;
    for (const t of usdTickers) {
      if (day[t]) {
        day[t].close *= lastRate;
        day[t].adjClose *= lastRate;
      }
    }
  }
  console.log(`  [fx] ${usdTickers.length} titres US convertis en CAD.`);
}
