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
        <p className="text-xs font-medium text-steel">Detection Mix</p>
        <h3 className="mt-2 text-2xl font-bold">Spam vs ham ratio</h3>
      </div>
      <div className="relative h-[260px] sm:h-[320px]">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-8">
          <div className="flex flex-col items-center justify-center">
            <span className="text-xs font-medium text-steel">Total</span>
            <span className="mt-1 text-2xl font-bold text-ink sm:text-3xl">{total}</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={58}
              outerRadius={96}
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
            <Legend wrapperStyle={{ fontSize: "12px" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
