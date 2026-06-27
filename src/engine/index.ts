/**
 * Moteur de calcul NORDIQ-20 — méthode du diviseur (v2.1)
 *
 * Formule : NORDIQ20_t = (Σ_i q_i · P_i(t)) / D
 * où q_i = w_i / P_i(t0)  et  D = Σ q_i · P_i(t0) / 1000
 *
 * Cette approche garantit :
 *   - Valeur = 1000 à t0
 *   - Poids effectifs = poids cibles à t0
 *   - Continuité lors d'un rééquilibrage (D est ajusté, l'indice ne saute pas)
 */

export interface Constituent {
  ticker: string;
  name: string;
  sector: string;
  weight: number;
}

/** État figé à un rééquilibrage : quantités et diviseurs PR/TR */
export interface IndexConfig {
  t0: string;
  divisor: number;
  trDivisor: number;
  units: Record<string, number>;
  weights: Record<string, number>;
}

/** Résultat du calcul pour une date donnée */
export interface IndexValue {
  date: string;
  pr: number;
  tr: number;
  pricesPR: Record<string, number>;
  pricesTR: Record<string, number>;
}

/**
 * Initialise l'IndexConfig à t0 à partir des prix de référence.
 * @param constituents   Liste des constituants avec leurs poids cibles
 * @param pricesT0       Cours de clôture bruts à t0 (PR)
 * @param baseValue      Valeur de base (1000)
 */
export function initializeIndex(
  constituents: Constituent[],
  pricesT0: Record<string, number>,
  t0: string,
  baseValue = 1000,
  adjPricesT0?: Record<string, number>,
): IndexConfig {
  const units: Record<string, number> = {};
  let portfolioValue = 0;
  let trPortfolioValue = 0;

  for (const c of constituents) {
    const price = pricesT0[c.ticker];
    if (!price || price <= 0) {
      throw new Error(`Prix manquant ou invalide pour ${c.ticker} à t0`);
    }
    // q_i = w_i / P_i(t0)  →  Σ q_i · P_i(t0) = Σ w_i = 1
    units[c.ticker] = c.weight / price;
    portfolioValue += units[c.ticker] * price;
    // Pour TR, on utilise les adjClose à t0 (peut différer de close à cause des dividendes historiques)
    const adjPrice = adjPricesT0?.[c.ticker] ?? price;
    trPortfolioValue += units[c.ticker] * adjPrice;
  }

  // D_PR = portfolioValue / baseValue  →  NORDIQ20_PR(t0) = baseValue
  const divisor = portfolioValue / baseValue;
  // D_TR est calculé indépendamment pour que NORDIQ20_TR(t0) = baseValue aussi
  const trDivisor = trPortfolioValue / baseValue;

  const weights: Record<string, number> = {};
  for (const c of constituents) {
    weights[c.ticker] = c.weight;
  }

  return { t0, divisor, trDivisor, units, weights };
}

/**
 * Calcule la valeur de l'indice à une date t.
 * @param config     Configuration (units, divisor)
 * @param pricesPR   Cours bruts (Price Return)
 * @param pricesTR   Cours ajustés dividendes (Total Return) — optionnel, = pricesPR si absent
 * @param date       Date ISO (YYYY-MM-DD)
 * @param lastPrices Derniers cours connus, utilisés si un prix est manquant ce jour
 */
export function calculateIndex(
  config: IndexConfig,
  pricesPR: Record<string, number>,
  date: string,
  pricesTR?: Record<string, number>,
  lastPricesPR?: Record<string, number>,
  lastPricesTR?: Record<string, number>,
): IndexValue {
  const effectivePR = { ...pricesPR };
  const effectiveTR = { ...(pricesTR ?? pricesPR) };
  const missingTickers: string[] = [];

  for (const ticker of Object.keys(config.units)) {
    if (!effectivePR[ticker] || effectivePR[ticker] <= 0) {
      const fallback = lastPricesPR?.[ticker];
      if (fallback && fallback > 0) {
        effectivePR[ticker] = fallback;
        effectiveTR[ticker] = lastPricesTR?.[ticker] ?? lastPricesPR?.[ticker] ?? fallback;
        missingTickers.push(ticker);
      } else {
        throw new Error(`Prix manquant pour ${ticker} à ${date} et aucun cours précédent disponible`);
      }
    }
  }

  if (missingTickers.length > 0) {
    console.warn(`[engine] ${date} — cours reportés pour : ${missingTickers.join(", ")}`);
  }

  let sumPR = 0;
  let sumTR = 0;
  for (const [ticker, q] of Object.entries(config.units)) {
    sumPR += q * effectivePR[ticker];
    sumTR += q * (effectiveTR[ticker] ?? effectivePR[ticker]);
  }

  return {
    date,
    pr: sumPR / config.divisor,
    tr: sumTR / (config.trDivisor ?? config.divisor),
    pricesPR: effectivePR,
    pricesTR: effectiveTR,
  };
}

/**
 * Rééquilibre l'indice : recalcule units et divisor à partir des nouveaux
 * constituants et des prix courants, de sorte que la valeur de l'indice
 * ne change pas (continuité garantie).
 *
 * @param currentValue   Valeur de l'indice juste avant le rééquilibrage
 * @param newConstituents Nouveau panier de constituants
 * @param currentPrices   Cours courants (jour du rééquilibrage)
 * @param t0              Date du rééquilibrage (nouvelle référence)
 */
export function rebalanceIndex(
  currentValue: number,
  newConstituents: Constituent[],
  currentPrices: Record<string, number>,
  t0: string,
): IndexConfig {
  const units: Record<string, number> = {};
  let newPortfolioValue = 0;

  for (const c of newConstituents) {
    const price = currentPrices[c.ticker];
    if (!price || price <= 0) {
      throw new Error(`Prix manquant pour ${c.ticker} lors du rééquilibrage`);
    }
    units[c.ticker] = c.weight / price;
    newPortfolioValue += units[c.ticker] * price;
  }

  // D_nouveau = Σ q_i_nouveau · P_i / currentValue  →  indice reste = currentValue
  const divisor = newPortfolioValue / currentValue;

  const weights: Record<string, number> = {};
  for (const c of newConstituents) {
    weights[c.ticker] = c.weight;
  }

  // trDivisor identique au divisor lors d'un rééquilibrage (on utilise les mêmes prix courants)
  return { t0, divisor, trDivisor: divisor, units, weights };
}

/** Calcule le poids effectif de chaque titre dans l'indice à une date donnée */
export function computeEffectiveWeights(
  config: IndexConfig,
  prices: Record<string, number>,
): Record<string, number> {
  const totalValue = Object.entries(config.units).reduce(
    (sum, [ticker, q]) => sum + q * (prices[ticker] ?? 0),
    0,
  );

  const effectiveWeights: Record<string, number> = {};
  for (const [ticker, q] of Object.entries(config.units)) {
    effectiveWeights[ticker] = totalValue > 0 ? (q * (prices[ticker] ?? 0)) / totalValue : 0;
  }
  return effectiveWeights;
}
