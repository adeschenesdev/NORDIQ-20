/**
 * npm run screen
 *
 * Screening en LECTURE SEULE d'un univers de grandes capitalisations canadiennes (TSX).
 * Pour chaque titre : rendement YTD 2026 (close) et rendement total 3 ans (adjClose),
 * puis un score mixte 50/50 (rangs normalisés). Imprime un classement par secteur.
 * N'écrit aucun fichier — sert à proposer une composition révisée.
 *
 * Les titres marqués (★) sont des constituants actuels de NORDIQ-20.
 */
import { fetchHistory } from "../data/fetch.js";
import { isCadTicker, fetchUsdCadSeries } from "../data/fx.js";

// --na : univers nord-américain (TSX + US). --us : univers US seul. Les titres US sont convertis en CAD.
const NA = process.argv.includes("--na");
const US = process.argv.includes("--us");
const CONVERT = NA || US; // conversion USD→CAD requise dès qu'il y a des titres US

// --ytd-weight <0..1> : poids du rendement YTD dans le score mixte (défaut 0.5 ; 0.7 = penché court terme).
function argVal(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const W_YTD = Math.min(1, Math.max(0, parseFloat(argVal("--ytd-weight") ?? "0.5")));

interface Candidate {
  ticker: string;
  name: string;
  sector: string;
  incumbent?: boolean;
}

// Univers de candidats — grandes caps TSX par secteur GICS (notation Yahoo, suffixe .TO).
const UNIVERSE: Candidate[] = [
  // Finance
  { ticker: "RY.TO", name: "Banque Royale", sector: "Finance" },
  { ticker: "TD.TO", name: "Banque TD", sector: "Finance" },
  { ticker: "BNS.TO", name: "Banque Scotia", sector: "Finance" },
  { ticker: "BMO.TO", name: "Banque de Montréal", sector: "Finance" },
  { ticker: "CM.TO", name: "Banque CIBC", sector: "Finance" },
  { ticker: "NA.TO", name: "Banque Nationale", sector: "Finance", incumbent: true },
  { ticker: "MFC.TO", name: "Manuvie", sector: "Finance", incumbent: true },
  { ticker: "SLF.TO", name: "Sun Life", sector: "Finance" },
  { ticker: "GWO.TO", name: "Great-West Lifeco", sector: "Finance" },
  { ticker: "IFC.TO", name: "Intact Financière", sector: "Finance", incumbent: true },
  { ticker: "FFH.TO", name: "Fairfax Financial", sector: "Finance", incumbent: true },
  { ticker: "BN.TO", name: "Brookfield Corporation", sector: "Finance", incumbent: true },
  { ticker: "BAM.TO", name: "Brookfield Asset Mgmt", sector: "Finance" },
  { ticker: "IGM.TO", name: "IGM Financial", sector: "Finance" },
  { ticker: "X.TO", name: "Groupe TMX", sector: "Finance" },

  // Énergie
  { ticker: "ENB.TO", name: "Enbridge", sector: "Énergie" },
  { ticker: "TRP.TO", name: "TC Energy", sector: "Énergie" },
  { ticker: "CNQ.TO", name: "Canadian Natural Resources", sector: "Énergie", incumbent: true },
  { ticker: "SU.TO", name: "Suncor Énergie", sector: "Énergie" },
  { ticker: "IMO.TO", name: "Imperial Oil", sector: "Énergie", incumbent: true },
  { ticker: "CVE.TO", name: "Cenovus Energy", sector: "Énergie" },
  { ticker: "TOU.TO", name: "Tourmaline Oil", sector: "Énergie" },
  { ticker: "PPL.TO", name: "Pembina Pipeline", sector: "Énergie" },
  { ticker: "ARX.TO", name: "ARC Resources", sector: "Énergie" },

  // Matériaux
  { ticker: "AEM.TO", name: "Agnico Eagle Mines", sector: "Matériaux" },
  { ticker: "WPM.TO", name: "Wheaton Precious Metals", sector: "Matériaux" },
  { ticker: "FNV.TO", name: "Franco-Nevada", sector: "Matériaux" },
  { ticker: "NTR.TO", name: "Nutrien", sector: "Matériaux" },
  { ticker: "K.TO", name: "Kinross Gold", sector: "Matériaux", incumbent: true },
  { ticker: "AGI.TO", name: "Alamos Gold", sector: "Matériaux", incumbent: true },
  { ticker: "LUG.TO", name: "Lundin Gold", sector: "Matériaux", incumbent: true },
  { ticker: "TECK-B.TO", name: "Teck Resources", sector: "Matériaux" },
  { ticker: "FM.TO", name: "First Quantum Minerals", sector: "Matériaux" },
  { ticker: "CCO.TO", name: "Cameco", sector: "Matériaux" },
  { ticker: "IMG.TO", name: "Iamgold", sector: "Matériaux" },

  // Industrie
  { ticker: "CP.TO", name: "Canadian Pacific Kansas City", sector: "Industrie" },
  { ticker: "CNR.TO", name: "Canadien National", sector: "Industrie" },
  { ticker: "WSP.TO", name: "WSP Global", sector: "Industrie" },
  { ticker: "GFL.TO", name: "GFL Environmental", sector: "Industrie" },
  { ticker: "TFII.TO", name: "TFI International", sector: "Industrie" },
  { ticker: "HPS-A.TO", name: "Hammond Power Solutions", sector: "Industrie", incumbent: true },
  { ticker: "TVK.TO", name: "TerraVest Industries", sector: "Industrie", incumbent: true },
  { ticker: "STN.TO", name: "Stantec", sector: "Industrie" },
  { ticker: "RBA.TO", name: "RB Global", sector: "Industrie" },
  { ticker: "FTT.TO", name: "Finning International", sector: "Industrie" },

  // Technologies
  { ticker: "SHOP.TO", name: "Shopify", sector: "Technologies" },
  { ticker: "CLS.TO", name: "Celestica", sector: "Technologies", incumbent: true },
  { ticker: "GIB-A.TO", name: "CGI", sector: "Technologies" },
  { ticker: "OTEX.TO", name: "OpenText", sector: "Technologies" },
  { ticker: "DSG.TO", name: "Descartes Systems", sector: "Technologies" },
  { ticker: "MDA.TO", name: "MDA Space", sector: "Technologies", incumbent: true },
  { ticker: "KXS.TO", name: "Kinaxis", sector: "Technologies" },
  { ticker: "LSPD.TO", name: "Lightspeed Commerce", sector: "Technologies" },

  // Communication
  { ticker: "BCE.TO", name: "BCE", sector: "Communication" },
  { ticker: "T.TO", name: "Telus", sector: "Communication" },
  { ticker: "RCI-B.TO", name: "Rogers Communications", sector: "Communication" },
  { ticker: "QBR-B.TO", name: "Québecor", sector: "Communication", incumbent: true },
  { ticker: "CCA.TO", name: "Cogeco Communications", sector: "Communication" },

  // Services publics
  { ticker: "FTS.TO", name: "Fortis", sector: "Services publics" },
  { ticker: "EMA.TO", name: "Emera", sector: "Services publics" },
  { ticker: "H.TO", name: "Hydro One", sector: "Services publics", incumbent: true },
  { ticker: "CPX.TO", name: "Capital Power", sector: "Services publics" },
  { ticker: "NPI.TO", name: "Northland Power", sector: "Services publics" },

  // Consommation discrétionnaire
  { ticker: "QSR.TO", name: "Restaurant Brands Intl", sector: "Consommation discrétionnaire" },
  { ticker: "MG.TO", name: "Magna International", sector: "Consommation discrétionnaire" },
  { ticker: "GIL.TO", name: "Gildan Activewear", sector: "Consommation discrétionnaire" },
  { ticker: "BYD.TO", name: "Boyd Group Services", sector: "Consommation discrétionnaire" },
  { ticker: "DOL.TO", name: "Dollarama", sector: "Consommation discrétionnaire", incumbent: true },
  { ticker: "CTC-A.TO", name: "Canadian Tire", sector: "Consommation discrétionnaire" },
  { ticker: "LNR.TO", name: "Linamar", sector: "Consommation discrétionnaire" },

  // Consommation de base
  { ticker: "ATD.TO", name: "Alimentation Couche-Tard", sector: "Consommation de base" },
  { ticker: "L.TO", name: "Loblaw", sector: "Consommation de base", incumbent: true },
  { ticker: "MRU.TO", name: "Metro", sector: "Consommation de base" },
  { ticker: "WN.TO", name: "George Weston", sector: "Consommation de base" },
  { ticker: "SAP.TO", name: "Saputo", sector: "Consommation de base" },
  { ticker: "EMP-A.TO", name: "Empire", sector: "Consommation de base" },

  // Immobilier
  { ticker: "FSV.TO", name: "FirstService", sector: "Immobilier", incumbent: true },
  { ticker: "CIGI.TO", name: "Colliers International", sector: "Immobilier" },
  { ticker: "CAR-UN.TO", name: "Canadian Apartment REIT", sector: "Immobilier" },
  { ticker: "GRT-UN.TO", name: "Granite REIT", sector: "Immobilier" },
  { ticker: "REI-UN.TO", name: "RioCan REIT", sector: "Immobilier" },

  // Santé
  { ticker: "BHC.TO", name: "Bausch Health", sector: "Santé" },
  { ticker: "WELL.TO", name: "WELL Health Technologies", sector: "Santé" },
  { ticker: "EXE.TO", name: "Extendicare", sector: "Santé" },
  { ticker: "SIA.TO", name: "Sienna Senior Living", sector: "Santé" },
  { ticker: "CSH-UN.TO", name: "Chartwell Retirement", sector: "Santé" },
];

// Univers américain (NYSE/NASDAQ, cotés en USD → convertis en CAD). Utilisé avec --na.
const US_UNIVERSE: Candidate[] = [
  // Technologies
  { ticker: "AAPL", name: "Apple", sector: "Technologies" },
  { ticker: "MSFT", name: "Microsoft", sector: "Technologies" },
  { ticker: "NVDA", name: "NVIDIA", sector: "Technologies" },
  { ticker: "AVGO", name: "Broadcom", sector: "Technologies" },
  { ticker: "ORCL", name: "Oracle", sector: "Technologies" },
  { ticker: "CRM", name: "Salesforce", sector: "Technologies" },
  { ticker: "AMD", name: "Advanced Micro Devices", sector: "Technologies" },
  { ticker: "ADBE", name: "Adobe", sector: "Technologies" },
  { ticker: "ACN", name: "Accenture", sector: "Technologies" },
  { ticker: "PLTR", name: "Palantir", sector: "Technologies" },
  // Communication
  { ticker: "GOOGL", name: "Alphabet", sector: "Communication" },
  { ticker: "META", name: "Meta Platforms", sector: "Communication" },
  { ticker: "NFLX", name: "Netflix", sector: "Communication" },
  { ticker: "DIS", name: "Walt Disney", sector: "Communication" },
  { ticker: "TMUS", name: "T-Mobile US", sector: "Communication" },
  // Consommation discrétionnaire
  { ticker: "AMZN", name: "Amazon", sector: "Consommation discrétionnaire" },
  { ticker: "TSLA", name: "Tesla", sector: "Consommation discrétionnaire" },
  { ticker: "HD", name: "Home Depot", sector: "Consommation discrétionnaire" },
  { ticker: "MCD", name: "McDonald's", sector: "Consommation discrétionnaire" },
  { ticker: "BKNG", name: "Booking Holdings", sector: "Consommation discrétionnaire" },
  // Consommation de base
  { ticker: "WMT", name: "Walmart", sector: "Consommation de base" },
  { ticker: "COST", name: "Costco", sector: "Consommation de base" },
  { ticker: "PG", name: "Procter & Gamble", sector: "Consommation de base" },
  { ticker: "KO", name: "Coca-Cola", sector: "Consommation de base" },
  { ticker: "PEP", name: "PepsiCo", sector: "Consommation de base" },
  // Finance
  { ticker: "BRK-B", name: "Berkshire Hathaway", sector: "Finance" },
  { ticker: "JPM", name: "JPMorgan Chase", sector: "Finance" },
  { ticker: "V", name: "Visa", sector: "Finance" },
  { ticker: "MA", name: "Mastercard", sector: "Finance" },
  { ticker: "BAC", name: "Bank of America", sector: "Finance" },
  { ticker: "GS", name: "Goldman Sachs", sector: "Finance" },
  { ticker: "SPGI", name: "S&P Global", sector: "Finance" },
  // Santé
  { ticker: "LLY", name: "Eli Lilly", sector: "Santé" },
  { ticker: "UNH", name: "UnitedHealth", sector: "Santé" },
  { ticker: "JNJ", name: "Johnson & Johnson", sector: "Santé" },
  { ticker: "ABBV", name: "AbbVie", sector: "Santé" },
  { ticker: "MRK", name: "Merck", sector: "Santé" },
  { ticker: "TMO", name: "Thermo Fisher", sector: "Santé" },
  { ticker: "ISRG", name: "Intuitive Surgical", sector: "Santé" },
  // Industrie
  { ticker: "GE", name: "GE Aerospace", sector: "Industrie" },
  { ticker: "CAT", name: "Caterpillar", sector: "Industrie" },
  { ticker: "HON", name: "Honeywell", sector: "Industrie" },
  { ticker: "RTX", name: "RTX", sector: "Industrie" },
  { ticker: "DE", name: "Deere", sector: "Industrie" },
  { ticker: "BA", name: "Boeing", sector: "Industrie" },
  // Énergie
  { ticker: "XOM", name: "ExxonMobil", sector: "Énergie" },
  { ticker: "CVX", name: "Chevron", sector: "Énergie" },
  { ticker: "COP", name: "ConocoPhillips", sector: "Énergie" },
  // Matériaux
  { ticker: "LIN", name: "Linde", sector: "Matériaux" },
  { ticker: "SHW", name: "Sherwin-Williams", sector: "Matériaux" },
  { ticker: "FCX", name: "Freeport-McMoRan", sector: "Matériaux" },
  // Services publics
  { ticker: "NEE", name: "NextEra Energy", sector: "Services publics" },
  { ticker: "SO", name: "Southern Company", sector: "Services publics" },
  { ticker: "CEG", name: "Constellation Energy", sector: "Services publics" },
  // Immobilier
  { ticker: "PLD", name: "Prologis", sector: "Immobilier" },
  { ticker: "AMT", name: "American Tower", sector: "Immobilier" },
  { ticker: "EQIX", name: "Equinix", sector: "Immobilier" },
];

const YTD_START = "2026-01-01";
const now = new Date();
const from3y = new Date(now);
from3y.setFullYear(from3y.getFullYear() - 3);

interface Row extends Candidate {
  ytd: number | null;
  ret3y: number | null;
  scoreYtd: number | null;
  score3y: number | null;
  blended: number | null;
}

/** Rang normalisé dans [0,1] (1 = meilleur, plus haute valeur). null ignoré. */
function normRanks(vals: (number | null)[]): (number | null)[] {
  const present = vals
    .map((v, i) => ({ v, i }))
    .filter((o) => o.v != null)
    .sort((a, b) => (a.v as number) - (b.v as number)); // ascendant
  const n = present.length;
  const out: (number | null)[] = vals.map(() => null);
  present.forEach((o, rank) => {
    out[o.i] = n > 1 ? rank / (n - 1) : 1;
  });
  return out;
}

function pct(v: number | null): string {
  if (v == null) return "    n/a";
  return `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%`.padStart(7);
}

async function main() {
  const universe = US ? US_UNIVERSE : NA ? [...UNIVERSE, ...US_UNIVERSE] : UNIVERSE;
  const label = US ? "américain (US, en CAD)" : NA ? "nord-américain (TSX + US, en CAD)" : "TSX";
  console.log(`\n=== Screening univers ${label} (${universe.length} titres) ===`);
  console.log(`YTD : depuis ${YTD_START}  |  3 ans : depuis ${from3y.toISOString().slice(0, 10)}  |  score : ${(W_YTD * 100).toFixed(0)}% YTD / ${((1 - W_YTD) * 100).toFixed(0)}% 3 ans\n`);

  // Conversion USD→CAD pour les titres américains (modes --na et --us).
  const fx = CONVERT ? await fetchUsdCadSeries(from3y, now) : {};
  const fxDates = Object.keys(fx).sort();
  const rateForDate = (date: string): number => {
    let rate = fxDates.length ? fx[fxDates[0]] : 1;
    for (const d of fxDates) {
      if (d <= date) rate = fx[d];
      else break;
    }
    return rate;
  };

  const rows: Row[] = [];
  for (const c of universe) {
    try {
      const hist = await fetchHistory(c.ticker, from3y, now);
      if (hist.length === 0) {
        console.warn(`  [screen] ${c.ticker} — aucune donnée`);
        rows.push({ ...c, ytd: null, ret3y: null, scoreYtd: null, score3y: null, blended: null });
        continue;
      }
      // Titres US : convertir cours et cours ajustés en CAD au taux du jour.
      if (CONVERT && !isCadTicker(c.ticker) && fxDates.length) {
        for (const r of hist) {
          const rate = rateForDate(r.date);
          r.close *= rate;
          r.adjClose *= rate;
        }
      }
      const last = hist[hist.length - 1];
      const ytdBase = hist.find((r) => r.date >= YTD_START);
      const first = hist[0];
      const ytd = ytdBase ? last.close / ytdBase.close - 1 : null;
      // 3 ans valide seulement si l'historique remonte assez loin (> ~2,5 ans).
      const hasFull3y = first.date <= `${from3y.getFullYear()}-09-01`;
      const ret3y = hasFull3y ? last.adjClose / first.adjClose - 1 : null;
      rows.push({ ...c, ytd, ret3y, scoreYtd: null, score3y: null, blended: null });
    } catch (err) {
      console.warn(`  [screen] ${c.ticker} — échec : ${err instanceof Error ? err.message : err}`);
      rows.push({ ...c, ytd: null, ret3y: null, scoreYtd: null, score3y: null, blended: null });
    }
  }

  // Scores (rangs normalisés sur l'ensemble de l'univers)
  const ytdRanks = normRanks(rows.map((r) => r.ytd));
  const r3yRanks = normRanks(rows.map((r) => r.ret3y));
  rows.forEach((r, i) => {
    r.scoreYtd = ytdRanks[i];
    r.score3y = r3yRanks[i];
    if (r.scoreYtd != null && r.score3y != null) r.blended = W_YTD * r.scoreYtd + (1 - W_YTD) * r.score3y;
    else if (r.scoreYtd != null) r.blended = r.scoreYtd; // titres sans 3 ans : YTD seul
    else r.blended = null;
  });

  // Affichage par secteur, trié par score mixte décroissant
  const sectors = Array.from(new Set(universe.map((c) => c.sector)));
  const fmtScore = (v: number | null) => (v == null ? " n/a" : v.toFixed(2));

  for (const sector of sectors) {
    console.log(`\n### ${sector}`);
    console.log(`  ${"Ticker".padEnd(11)} ${"Société".padEnd(28)} ${"YTD".padStart(7)} ${"3 ans".padStart(8)}  Score`);
    const inSector = rows
      .filter((r) => r.sector === sector)
      .sort((a, b) => (b.blended ?? -1) - (a.blended ?? -1));
    for (const r of inSector) {
      const star = r.incumbent ? " ★" : "  ";
      console.log(
        `${star}${r.ticker.padEnd(11)} ${r.name.slice(0, 28).padEnd(28)} ${pct(r.ytd)} ${pct(r.ret3y)}   ${fmtScore(r.blended)}`,
      );
    }
  }

  // Top 25 global
  console.log(`\n\n=== TOP 25 (score mixte, tous secteurs) ===`);
  console.log(`  ${"Ticker".padEnd(11)} ${"Société".padEnd(28)} ${"Secteur".padEnd(28)} ${"YTD".padStart(7)} ${"3 ans".padStart(8)}  Score`);
  rows
    .filter((r) => r.blended != null)
    .sort((a, b) => (b.blended as number) - (a.blended as number))
    .slice(0, 25)
    .forEach((r) => {
      const star = r.incumbent ? " ★" : "  ";
      console.log(
        `${star}${r.ticker.padEnd(11)} ${r.name.slice(0, 28).padEnd(28)} ${r.sector.padEnd(28)} ${pct(r.ytd)} ${pct(r.ret3y)}   ${(r.blended as number).toFixed(2)}`,
      );
    });

  console.log(`\n★ = constituant actuel de NORDIQ-20\n`);
}

main();
