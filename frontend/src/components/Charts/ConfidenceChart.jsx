import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactNumber } from "../../utils/format";

export default function ConfidenceChart({ data }) {
  return (
    <div className="app-panel p-6">
      <div className="mb-8">
        <p className="text-lg font-bold text-copy">Confidence Distribution</p>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Bucketed model confidence split by ham and spam outcomes.
        </p>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid
              stroke="rgba(218, 226, 253, 0.08)"
              strokeDasharray="4 4"
              vertical={false}
            />
            <XAxis
              dataKey="range"
              tick={{ fill: "#94a3c7", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#94a3c7", fontSize: 11 }}
              width={34}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 16,
                border: "1px solid rgba(69, 70, 82, 0.25)",
                backgroundColor: "rgba(23, 31, 51, 0.95)",
                color: "#dae2fd",
              }}
              formatter={(value) => [formatCompactNumber(value), "Signals"]}
              labelStyle={{ color: "#dae2fd" }}
              itemStyle={{ color: "#dae2fd" }}
            />
            <Bar
              dataKey="spam"
              stackId="confidence"
              fill="#ffb3ad"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="ham"
              stackId="confidence"
              fill="#bac3ff"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-8 border-t border-line/10 pt-6">
        <span className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-copy/55">
          <span className="h-2 w-10 rounded-full bg-primary" />
          Verified ham score
        </span>
        <span className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-copy/55">
          <span className="h-2 w-10 rounded-full bg-threat" />
          Flagged spam score
        </span>
      </div>
    </div>
  );
}
