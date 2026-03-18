export default function StatusBadge({ value }) {
  const normalized = String(value || "").toLowerCase();

  const styles =
    normalized === "spam"
      ? "bg-danger/10 text-danger"
      : normalized === "ham"
        ? "bg-safe/10 text-safe"
        : "bg-ink/10 text-ink";

  return (
    <span className={`chip ${styles}`}>
      {normalized ? normalized.toUpperCase() : "UNKNOWN"}
    </span>
  );
}
