import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS = ["#e11d48", "#0f766e"];

export default function SpamRatioChart({ spamCount, hamCount }) {
  const data = [
    { name: "Spam", value: spamCount },
    { name: "Ham", value: hamCount },
  ];
  const total = spamCount + hamCount;

  return (
    <div className="panel p-5 sm:p-6">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-steel">
          Detection Mix
        </p>
        <h3 className="mt-2 text-2xl font-bold">Spam vs ham ratio</h3>
      </div>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={74}
              outerRadius={110}
              paddingAngle={3}
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [value, "Messages"]}
              contentStyle={{
                borderRadius: 16,
                border: "1px solid rgba(17,32,59,0.08)",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="-mt-40 flex justify-center">
        <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border border-ink/10 bg-white/85 shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-steel">
            Total
          </span>
          <span className="mt-2 text-3xl font-bold text-ink">{total}</span>
        </div>
      </div>
    </div>
  );
}
