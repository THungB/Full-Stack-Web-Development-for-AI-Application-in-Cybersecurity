import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatCompactNumber, formatPercent } from "../../utils/format";

const COLORS = {
  ham: "#4355b9",
  spam: "#ffb3ad",
};

export default function SpamRatioChart({ spamCount, hamCount }) {
  const data = [
    { name: "Ham", value: hamCount, color: COLORS.ham },
    { name: "Spam", value: spamCount, color: COLORS.spam },
  ];
  const total = spamCount + hamCount;

  return (
    <div className="app-panel-soft p-6">
      <div className="mb-6">
        <p className="text-sm font-bold text-copy">Detection Mix</p>
        <p className="mt-2 max-w-xs text-sm leading-6 text-muted">
          Relative split between legitimate and suspicious traffic.
        </p>
      </div>

      <div className="relative h-[280px]">
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-copy/45">
              Total ratio
            </span>
            <span className="mt-2 text-3xl font-extrabold text-copy">
              {formatCompactNumber(total)}
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={68}
              outerRadius={104}
              paddingAngle={3}
              stroke="transparent"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [formatCompactNumber(value), "Signals"]}
              contentStyle={{
                borderRadius: 16,
                border: "1px solid rgba(69, 70, 82, 0.25)",
                backgroundColor: "rgba(23, 31, 51, 0.95)",
                color: "#dae2fd",
              }}
              labelStyle={{ color: "#dae2fd" }}
              itemStyle={{ color: "#dae2fd" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap justify-between gap-3">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-3">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <div>
              <p className="text-sm text-copy/80">{entry.name}</p>
              <p className="text-xs text-muted">
                {formatPercent(total ? entry.value / total : 0, 0)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
