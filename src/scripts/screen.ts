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
  console.log(`\n=== Screening univers TSX (${UNIVERSE.length} titres) ===`);
  console.log(`YTD : depuis ${YTD_START}  |  3 ans : depuis ${from3y.toISOString().slice(0, 10)}\n`);

  const rows: Row[] = [];
  for (const c of UNIVERSE) {
    try {
      const hist = await fetchHistory(c.ticker, from3y, now);
      if (hist.length === 0) {
        console.warn(`  [screen] ${c.ticker} — aucune donnée`);
        rows.push({ ...c, ytd: null, ret3y: null, scoreYtd: null, score3y: null, blended: null });
        continue;
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
    if (r.scoreYtd != null && r.score3y != null) r.blended = 0.5 * r.scoreYtd + 0.5 * r.score3y;
    else if (r.scoreYtd != null) r.blended = r.scoreYtd; // titres sans 3 ans : YTD seul
    else r.blended = null;
  });

  // Affichage par secteur, trié par score mixte décroissant
  const sectors = Array.from(new Set(UNIVERSE.map((c) => c.sector)));
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
