import {
  ArrowUpRight,
  ChartBar,
  Gauge,
  ShieldCheck,
  WarningCircle,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { formatCompactNumber, formatPercent } from "../utils/format";

function StatCard({
  label,
  value,
  hint,
  chip,
  icon: Icon,
  progress,
  tone,
  barClass,
  to,
  delay = "0ms",
}) {
  const Wrapper = to ? Link : "article";

  return (
    <Wrapper
      to={to}
      className={`metric-card stagger-item group block ${to ? "cursor-pointer" : ""}`}
      style={{ animationDelay: delay }}
    >
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-copy/45">
              {label}
            </p>
            <p className="mt-4 text-4xl font-extrabold tracking-tight text-copy">
              {value}
            </p>
          </div>
          <div className={`rounded-2xl border p-2 ${tone}`}>
            <Icon size={18} weight="bold" />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${tone}`}>
            {chip}
          </span>
          {to ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-copy/60 transition group-hover:text-copy">
              Open ledger
              <ArrowUpRight size={14} weight="bold" />
            </span>
          ) : null}
        </div>

        <div className="mt-5 h-1.5 w-full rounded-full bg-shell/75">
          <div
            className={`h-full rounded-full ${barClass}`}
            style={{ width: `${Math.max(6, Math.min(100, progress * 100))}%` }}
          />
        </div>

        <p className="mt-4 text-sm leading-6 text-muted">{hint}</p>
      </div>
    </Wrapper>
  );
}

export default function SummaryCards({ stats, highConfidenceShare = 0 }) {
  const total = stats.spam_count + stats.ham_count;
  const spamRate = total ? stats.spam_count / total : 0;
  const hamRate = total ? stats.ham_count / total : 0;
  const cards = [
    {
      label: "Total Scans",
      value: formatCompactNumber(total),
      hint: "Combined live volume across all connected ingress channels.",
      chip: spamRate > 0.3 ? "Elevated intake" : "Stable intake",
      icon: ChartBar,
      progress: total ? 0.82 : 0,
      tone: "border-primary/25 bg-primary/10 text-primary",
      barClass: "bg-primary",
    },
    {
      label: "Spam Detected",
      value: formatCompactNumber(stats.spam_count),
      hint: "Messages currently classified as suspicious by the model.",
      chip: spamRate > 0.4 ? "High activity" : "Threat review",
      icon: WarningCircle,
      progress: spamRate,
      tone: "border-threat/30 bg-threat/10 text-threat",
      barClass: "bg-threat",
      to: "/history?filter=spam",
    },
    {
      label: "Legitimate (Ham)",
      value: formatCompactNumber(stats.ham_count),
      hint: "Traffic verified as safe based on the current classifier.",
      chip: "Verified traffic",
      icon: ShieldCheck,
      progress: hamRate,
      tone: "border-safe/30 bg-safe/10 text-safe",
      barClass: "bg-safe",
      to: "/history?filter=ham",
    },
    {
      label: "High-confidence share",
      value: formatPercent(highConfidenceShare),
      hint: "Signals landing inside the 80-100% confidence bucket.",
      chip: "80-100% bucket",
      icon: Gauge,
      progress: highConfidenceShare,
      tone: "border-primary/25 bg-primary/10 text-primary",
      barClass: "bg-primary",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <StatCard
          key={card.label}
          {...card}
          delay={`${120 + index * 70}ms`}
        />
      ))}
    </section>
  );
}
