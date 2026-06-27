import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import constituentsRaw from "../../../data/constituents.json";

interface Constituent {
  ticker: string;
  name: string;
  sector: string;
  weight: number;
}

const constituents = (constituentsRaw as { constituents: Constituent[] }).constituents;

const COLORS = [
  "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#a3e635",
];

interface Props {
  onSectorClick?: (sector: string | null) => void;
  selectedSector?: string | null;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm shadow-xl">
      <p className="text-slate-800 dark:text-white font-medium">{payload[0].name}</p>
      <p className="text-slate-600 dark:text-slate-300">{(payload[0].value * 100).toFixed(0)}%</p>
    </div>
  );
}

export function SectorChart({ onSectorClick, selectedSector }: Props) {
  const sectorMap = new Map<string, number>();
  for (const c of constituents) {
    sectorMap.set(c.sector, (sectorMap.get(c.sector) ?? 0) + c.weight);
  }

  const data = Array.from(sectorMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  function handleClick(entry: { name?: string }) {
    if (!onSectorClick || !entry.name) return;
    onSectorClick(selectedSector === entry.name ? null : entry.name);
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-slate-800 dark:text-slate-200 font-semibold text-lg">Répartition sectorielle</h2>
        {selectedSector && (
          <button
            onClick={() => onSectorClick?.(null)}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            {selectedSector} ×
          </button>
        )}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            label={({ value }: { value: number }) => `${(value * 100).toFixed(0)}%`}
            labelLine={true}
            onClick={handleClick}
            style={{ cursor: onSectorClick ? "pointer" : "default" }}
          >
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={COLORS[i % COLORS.length]}
                opacity={selectedSector && selectedSector !== entry.name ? 0.35 : 1}
                stroke={selectedSector === entry.name ? "#fff" : "none"}
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span style={{ color: "#cbd5e1", fontSize: "12px" }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      {onSectorClick && (
        <p className="text-slate-400 dark:text-slate-600 text-xs text-center mt-1">Cliquez sur un secteur pour filtrer le tableau</p>
      )}
    </div>
  );
}
