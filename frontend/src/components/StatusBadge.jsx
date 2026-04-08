import {
  CheckCircle,
  Question,
  WarningCircle,
} from "@phosphor-icons/react";

export default function StatusBadge({ value }) {
  const normalized = String(value || "").toLowerCase();

  const styles =
    normalized === "spam"
      ? {
          className: "border-threat/20 bg-threat/10 text-threat",
          icon: WarningCircle,
          label: "Spam",
        }
      : normalized === "needs_review"
        ? {
            className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
            icon: Question,
            label: "Review",
          }
      : normalized === "ham"
        ? {
            className: "border-safe/20 bg-safe/10 text-safe",
            icon: CheckCircle,
            label: "Ham",
          }
        : {
            className: "border-line/20 bg-elevated text-copy/75",
            icon: Question,
            label: normalized ? normalized.toUpperCase() : "Unknown",
          };
  const Icon = styles.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${styles.className}`}
    >
      <Icon size={14} weight="fill" />
      {styles.label}
    </span>
  );
}
