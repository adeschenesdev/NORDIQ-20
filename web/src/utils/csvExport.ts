export interface CsvRow {
  ticker: string;
  name: string;
  sector: string;
  currentPrice: number | undefined;
  dayChange: number | null;
  weight: number;
  contrib: number;
}

export function exportConstituentsCSV(rows: CsvRow[], date: string): void {
  const headers = ["Ticker", "Société", "Secteur", "Cours (CAD)", "Δ jour (%)", "Poids (%)", "Contribution (pts)"];
  const lines = rows.map((r) => [
    r.ticker,
    r.name,
    r.sector,
    r.currentPrice != null ? r.currentPrice.toFixed(2) : "",
    r.dayChange != null ? r.dayChange.toFixed(2) : "",
    (r.weight * 100).toFixed(0),
    r.contrib.toFixed(2),
  ].join(";"));

  const csv = [headers.join(";"), ...lines].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `NORDIQ-20-constituants-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
