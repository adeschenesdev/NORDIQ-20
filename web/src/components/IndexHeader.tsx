import type { HistoryEntry } from "../hooks/useIndexData";

interface Props {
  history: HistoryEntry[];
  name: string;
  subtitle: string;
  variant: "pr" | "tr";
  onVariantChange: (v: "pr" | "tr") => void;
  onAboutClick?: () => void;
  theme?: "dark" | "light";
  onThemeToggle?: () => void;
}

export function IndexHeader({ history, name, subtitle, variant, onVariantChange, onAboutClick, theme, onThemeToggle }: Props) {
  const last = history[history.length - 1];
  const prev = history[history.length - 2];

  if (!last) return null;

  const value = variant === "pr" ? last.pr : last.tr;
  const prevValue = prev ? (variant === "pr" ? prev.pr : prev.tr) : value;
  const delta = value - prevValue;
  const deltaPct = prevValue !== 0 ? (delta / prevValue) * 100 : 0;
  const isUp = delta >= 0;

  const ytdCutoff = `${new Date().getFullYear()}-01-01`;
  const ytdEntry = history.find((h) => h.date >= ytdCutoff);
  const ytdValue = ytdEntry ? (variant === "pr" ? ytdEntry.pr : ytdEntry.tr) : null;
  const ytdPct = ytdValue ? ((value - ytdValue) / ytdValue) * 100 : null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-widest mb-1">
            {name} — {subtitle}
          </h1>
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-bold text-slate-900 dark:text-white tabular-nums">
              {value.toFixed(2)}
            </span>
            <span className="text-slate-400 text-lg">pts</span>
          </div>
          <div className={`flex items-center gap-2 mt-2 text-lg font-medium ${isUp ? "text-green-500" : "text-red-500"}`}>
            <span>{isUp ? "▲" : "▼"}</span>
            <span>{isUp ? "+" : ""}{delta.toFixed(2)} pts ({isUp ? "+" : ""}{deltaPct.toFixed(2)}%)</span>
            <span className="text-slate-400 dark:text-slate-500 text-sm font-normal">aujourd'hui</span>
          </div>
          {ytdPct !== null && (
            <div className="flex items-center gap-2 mt-1 text-sm">
              <span className={`font-medium ${ytdPct >= 0 ? "text-green-500" : "text-red-500"}`}>
                {ytdPct >= 0 ? "+" : ""}{ytdPct.toFixed(2)}%
              </span>
              <span className="text-slate-400 dark:text-slate-500">YTD</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 self-center">
          <div className="flex items-center gap-2">
            {onThemeToggle && (
              <button
                onClick={onThemeToggle}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
                title={theme === "dark" ? "Mode clair" : "Mode sombre"}
              >
                {theme === "dark" ? "☀" : "🌙"}
              </button>
            )}
            {onAboutClick && (
              <button
                onClick={onAboutClick}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2"
              >
                À propos
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {(["pr", "tr"] as const).map((v) => (
              <button
                key={v}
                onClick={() => onVariantChange(v)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  variant === v
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {name} {v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-slate-400 dark:text-slate-500 text-xs mt-4">
        Données au {last.date} · Cours du jour (clôture TSX)
      </p>
    </div>
  );
}
