import yf from "./yf.js";

const DELAY_MS = 400;
const MAX_RETRIES = 3;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const delay = DELAY_MS * 2 ** (attempt - 1);
      console.warn(`[fetch] ${label} — échec tentative ${attempt}/${MAX_RETRIES}, retry dans ${delay}ms`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

/** Cours de clôture brut et ajusté pour un ticker à une date donnée. */
export interface DayPrice {
  date: string;
  close: number;
  adjClose: number;
}

/**
 * Récupère l'historique de clôture d'un ticker entre deux dates (incluses).
 * Retourne un tableau trié par date croissante.
 */
export async function fetchHistory(
  ticker: string,
  from: Date,
  to: Date,
): Promise<DayPrice[]> {
  await sleep(DELAY_MS);
  const rows = await withRetry(
    () =>
      yf.historical(ticker, {
        period1: from,
        period2: to,
        interval: "1d",
        includeAdjustedClose: true,
      }),
    ticker,
  );

  return rows
    .filter((r) => r.close != null)
    .map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      close: r.close,
      adjClose: (r as { adjClose?: number }).adjClose ?? r.close,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Cours du jour (quote temps réel / dernière clôture). */
export interface TodayPrice {
  ticker: string;
  close: number;
  adjClose: number;
  currency: string;
}

export async function fetchTodayPrices(tickers: string[]): Promise<Record<string, TodayPrice>> {
  const result: Record<string, TodayPrice> = {};
  for (const ticker of tickers) {
    await sleep(DELAY_MS);
    try {
      const q = await withRetry(
        () => yf.quote(ticker, {}, { validateResult: false }),
        ticker,
      );
      const close =
        q.regularMarketPreviousClose ?? q.regularMarketPrice ?? 0;
      result[ticker] = {
        ticker,
        close,
        adjClose: close,
        currency: q.currency ?? "CAD",
      };
    } catch (err) {
      console.error(`[fetch] ${ticker} — échec quote : ${err instanceof Error ? err.message : err}`);
    }
  }
  return result;
}

/**
 * Récupère l'historique de tous les tickers pour une plage de dates.
 * Retourne une map : date → ticker → { close, adjClose }.
 * Les prix manquants pour une date donnée ne sont pas inclus (le store gère le report).
 */
export async function fetchAllHistory(
  tickers: string[],
  from: Date,
  to: Date,
): Promise<Map<string, Record<string, { close: number; adjClose: number }>>> {
  const byDate = new Map<string, Record<string, { close: number; adjClose: number }>>();

  for (const ticker of tickers) {
    console.log(`  [fetch] historique ${ticker}…`);
    try {
      const rows = await fetchHistory(ticker, from, to);
      for (const row of rows) {
        if (!byDate.has(row.date)) byDate.set(row.date, {});
        byDate.get(row.date)![ticker] = { close: row.close, adjClose: row.adjClose };
      }
    } catch (err) {
      console.error(`[fetch] ${ticker} — échec historique : ${err instanceof Error ? err.message : err}`);
    }
  }

  return byDate;
}
