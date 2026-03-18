import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function ActivityChart({ data }) {
  return (
    <div className="panel p-5 sm:p-6">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-steel">
          Activity
        </p>
        <h3 className="mt-2 text-2xl font-bold">Daily scan volume</h3>
      </div>
      <div className="h-[260px] sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(17,32,59,0.08)" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fill: "#5f6f8c", fontSize: 11 }} />
            <YAxis tick={{ fill: "#5f6f8c", fontSize: 11 }} width={30} />
            <Tooltip
              contentStyle={{
                borderRadius: 16,
                border: "1px solid rgba(17,32,59,0.08)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#11203b"
              strokeWidth={3}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="spam"
              stroke="#e11d48"
              strokeWidth={3}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
