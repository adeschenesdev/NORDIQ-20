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

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm shadow-xl">
      <p className="text-white font-medium">{payload[0].name}</p>
      <p className="text-slate-300">{(payload[0].value * 100).toFixed(1)}%</p>
    </div>
  );
}

export function SectorChart() {
  const sectorMap = new Map<string, number>();
  for (const c of constituents) {
    sectorMap.set(c.sector, (sectorMap.get(c.sector) ?? 0) + c.weight);
  }

  const data = Array.from(sectorMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="bg-slate-800 rounded-2xl p-6 mb-6">
      <h2 className="text-slate-200 font-semibold text-lg mb-4">Répartition sectorielle</h2>
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
            label={({ value }: { value: number }) => `${(value * 100).toFixed(1)}%`}
            labelLine={true}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
    </div>
  );
}
