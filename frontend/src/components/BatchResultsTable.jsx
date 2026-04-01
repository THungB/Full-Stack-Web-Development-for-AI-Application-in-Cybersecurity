import { DownloadSimple } from "@phosphor-icons/react";
import StatusBadge from "./StatusBadge";
import {
  formatConfidence,
  formatSourceLabel,
  truncateText,
} from "../utils/format";

function exportBatchResults(items) {
  const headers = [
    "row",
    "status",
    "source",
    "expected_label",
    "predicted_label",
    "correct",
    "confidence",
    "error",
    "message",
    "keywords",
  ];

  const rows = items.map((item) =>
    [
      item.row,
      item.status,
      item.source || "",
      item.expected_label || "",
      item.predicted_label || "",
      item.correct === null || item.correct === undefined ? "" : item.correct,
      item.confidence ?? "",
      `"${String(item.error || "").replaceAll('"', '""')}"`,
      `"${String(item.message || "").replaceAll('"', '""')}"`,
      `"${String((item.keywords || []).join(", ")).replaceAll('"', '""')}"`,
    ].join(","),
  );

  const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "batch-scan-results.csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function BatchResultsTable({ items }) {
  if (!items?.length) return null;

  return (
    <section className="app-panel overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-line/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-copy/45">
            Batch Results
          </p>
          <h3 className="mt-3 text-2xl font-bold text-copy">Per-row predictions</h3>
          <p className="mt-2 text-sm text-muted">
            Review failures, compare expected labels, and export the analyzed batch.
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary-dark rounded-xl"
          onClick={() => exportBatchResults(items)}
        >
          <DownloadSimple size={16} />
          Export Results
        </button>
      </div>

      <div className="grid gap-4 p-4 md:hidden">
        {items.map((item) => (
          <article
            key={`${item.row}-${item.message}`}
            className="rounded-[24px] border border-line/10 bg-surface/70 p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="status-chip bg-elevated-strong/70 text-copy/80">
                Row {item.row}
              </span>
              <span
                className={`status-chip ${
                  item.status === "processed"
                    ? "border-safe/20 bg-safe/10 text-safe"
                    : "border-threat/20 bg-threat/10 text-threat"
                }`}
              >
                {item.status}
              </span>
              {item.predicted_label ? <StatusBadge value={item.predicted_label} /> : null}
            </div>

            <p className="mt-4 text-sm leading-7 text-copy">
              {truncateText(item.message, 180)}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="status-chip bg-elevated-strong/70 text-copy/80">
                {formatSourceLabel(item.source)}
              </span>
              {item.confidence !== null && item.confidence !== undefined ? (
                <span className="status-chip bg-elevated-strong/70 text-copy/80">
                  Confidence {formatConfidence(item.confidence)}
                </span>
              ) : null}
              {item.expected_label ? (
                <span className="status-chip bg-elevated-strong/70 text-copy/80">
                  Expected {item.expected_label.toUpperCase()}
                </span>
              ) : null}
            </div>

            {item.error ? (
              <p className="mt-4 text-sm font-medium text-threat">{item.error}</p>
            ) : null}
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="table-row-divider bg-panel/40 text-left">
              {[
                "Row",
                "Status",
                "Source",
                "Message",
                "Expected",
                "Predicted",
                "Confidence",
                "Keywords / Error",
              ].map((header) => (
                <th
                  key={header}
                  className="px-4 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-copy/45"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${item.row}-${item.message}`} className="table-row-divider hover:bg-elevated-strong/20">
                <td className="px-4 py-4 text-sm text-copy/80">{item.row}</td>
                <td className="px-4 py-4">
                  <span
                    className={`status-chip ${
                      item.status === "processed"
                        ? "border-safe/20 bg-safe/10 text-safe"
                        : "border-threat/20 bg-threat/10 text-threat"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-copy/80">
                  {formatSourceLabel(item.source)}
                </td>
                <td className="min-w-[280px] px-4 py-4 text-sm text-copy">
                  {truncateText(item.message, 120)}
                </td>
                <td className="px-4 py-4 text-sm text-copy/80">
                  {item.expected_label ? item.expected_label.toUpperCase() : "N/A"}
                </td>
                <td className="px-4 py-4">
                  {item.predicted_label ? <StatusBadge value={item.predicted_label} /> : "N/A"}
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-copy/80">
                  {item.confidence !== null && item.confidence !== undefined
                    ? formatConfidence(item.confidence)
                    : "N/A"}
                </td>
                <td className="min-w-[260px] px-4 py-4">
                  {item.error ? (
                    <p className="text-sm text-threat">{item.error}</p>
                  ) : item.keywords?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {item.keywords.map((keyword) => (
                        <span
                          key={`${item.row}-${keyword}`}
                          className="rounded-full bg-threat/10 px-3 py-1 text-xs font-semibold text-threat"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted">No keywords</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
