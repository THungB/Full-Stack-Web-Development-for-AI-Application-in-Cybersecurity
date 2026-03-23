import { formatPercent } from "../utils/format";

function StatCard({ label, value, hint}) {

  return (
  <article className="rounded-[28px] bg-white p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] border border-slate-100">
    <div className="h-full">  
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-steel">
              {label}
            </p>
            <p className="mt-4 text-4xl font-bold text-ink">{value}</p>
            <p className="mt-3 text-sm text-steel">{hint}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function SummaryCards({ stats }) {
  const total = stats.spam_count + stats.ham_count;
  const spamRate = total ? stats.spam_count / total : 0;

  return (
  <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
    <StatCard
      label="Total Scans"
      value={total}
      hint="Combined activity across all channels."
      icon="total"
    />
    <StatCard
      label="Spam Alerts"
      value={stats.spam_count}
      hint="Messages flagged by the model as suspicious."
      icon="spam"
    />
    <StatCard
      label="Spam Rate"
      value={formatPercent(spamRate)}
      hint="Spam ratio over total scanned traffic."
      icon="rate"
    />
  </section>
);
}
