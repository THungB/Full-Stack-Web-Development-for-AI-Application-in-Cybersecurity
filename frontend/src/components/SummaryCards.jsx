import { formatPercent } from "../utils/format";

const iconMap = {
  total: (
    <path d="M4 12h16M12 4v16M5.64 5.64l12.72 12.72M18.36 5.64 5.64 18.36" />
  ),
  spam: (
    <path d="M12 3 4 7v6c0 4.42 3.58 8 8 8s8-3.58 8-8V7l-8-4Zm0 5v5" />
  ),
  ham: <path d="m5 13 4 4L19 7" />,
  rate: <path d="M7 17 17 7M8 8h.01M16 16h.01" />,
};

function StatCard({ label, value, hint, tone, icon }) {
  const tones = {
    total: "from-ink to-slate-700 text-white",
    spam: "from-danger to-rose-500 text-white",
    ham: "from-safe to-emerald-500 text-white",
    rate: "from-signal to-amber-400 text-white",
  };

  return (
    <article
      className={`rounded-[28px] bg-gradient-to-br p-[1px] shadow-panel ${tones[tone]}`}
    >
      <div className="h-full rounded-[27px] bg-white/95 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-steel">
              {label}
            </p>
            <p className="mt-4 text-4xl font-bold text-ink">{value}</p>
            <p className="mt-3 text-sm text-steel">{hint}</p>
          </div>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tones[tone]}`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 fill-none stroke-current stroke-[1.8]"
            >
              {iconMap[icon]}
            </svg>
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
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Scans"
        value={total}
        hint="Combined activity across all channels."
        tone="total"
        icon="total"
      />
      <StatCard
        label="Spam Alerts"
        value={stats.spam_count}
        hint="Messages flagged by the model as suspicious."
        tone="spam"
        icon="spam"
      />
      <StatCard
        label="Safe Messages"
        value={stats.ham_count}
        hint="Messages considered legitimate or low risk."
        tone="ham"
        icon="ham"
      />
      <StatCard
        label="Spam Rate"
        value={formatPercent(spamRate)}
        hint="Spam ratio over total scanned traffic."
        tone="rate"
        icon="rate"
      />
    </section>
  );
}
