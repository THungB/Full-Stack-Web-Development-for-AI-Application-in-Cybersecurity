import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function ConfidenceChart({ data }) {
  return (
    <div className="panel p-5 sm:p-6">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-steel">
          Confidence
        </p>
        <h3 className="mt-2 text-2xl font-bold">Confidence score distribution</h3>
      </div>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="rgba(17,32,59,0.08)" strokeDasharray="3 3" />
            <XAxis dataKey="range" tick={{ fill: "#5f6f8c", fontSize: 12 }} />
            <YAxis tick={{ fill: "#5f6f8c", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: 16,
                border: "1px solid rgba(17,32,59,0.08)",
              }}
            />
            <Legend />
            <Bar
              dataKey="spam"
              stackId="confidence"
              fill="#e11d48"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="ham"
              stackId="confidence"
              fill="#0f766e"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
