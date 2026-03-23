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

export default function ActivityChart({ data }) {
  return (
    <div className="panel p-5 sm:p-6">
      <div className="mb-6">
        <p className="text-xs font-medium text-steel">Activity</p>
        <h3 className="mt-2 text-2xl font-bold">Daily scan volume</h3>
      </div>
      <div className="h-[260px] sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid stroke="rgba(17,32,59,0.06)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#5f6f8c", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#5f6f8c", fontSize: 11 }} width={30} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 16,
                border: "1px solid rgba(17,32,59,0.08)",
              }}
              cursor={{ fill: "rgba(17,32,59,0.04)" }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Bar dataKey="total" fill="#11203b" radius={[4, 4, 0, 0]} maxBarSize={24} />
            <Bar dataKey="spam" fill="#e11d48" radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
