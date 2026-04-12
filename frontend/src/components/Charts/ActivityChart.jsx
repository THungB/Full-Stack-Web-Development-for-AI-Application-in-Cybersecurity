import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactNumber, formatShortDate } from "../../utils/format";

export default function ActivityChart({ data }) {
  const chartData = data.map((item) => ({
    ...item,
    label: formatShortDate(item.date),
  }));

  return (
    <div className="app-panel-soft p-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-copy">Activity Volume (14d)</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Daily totals from the current API, rendered in the dashboard chrome.
          </p>
        </div>
        <div className="flex gap-4 text-xs text-copy/60">
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-5 rounded-full bg-primary" />
            Total
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-5 rounded-full bg-threat" />
            Spam
          </span>
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={6}>
            <CartesianGrid
              stroke="rgba(218, 226, 253, 0.08)"
              strokeDasharray="4 4"
              vertical={false}
            />
            <XAxis
              dataKey="label"
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
              cursor={{ fill: "rgba(186, 195, 255, 0.06)" }}
            />
            <Bar dataKey="total" fill="#bac3ff" radius={[8, 8, 0, 0]} maxBarSize={28} />
            <Bar dataKey="spam" fill="#ffb3ad" radius={[8, 8, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
