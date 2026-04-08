import { useState } from "react";
import {
  ArrowsClockwise,
  CaretRight,
  ClockCounterClockwise,
  Trash,
  Plus,
  Minus
} from "@phosphor-icons/react";
import StatusBadge from "./StatusBadge";
import {
  formatConfidence,
  formatDateTime,
  formatSourceLabel,
  truncateText,
} from "../utils/format";

export default function HistoryTable({
  records,
  onDelete,
  onRegenLabel = () => {},
}) {
  const [expandedRows, setExpandedRows] = useState({});

  const toggleExpanded = (id) => {
    setExpandedRows((current) => ({ ...current, [id]: !current[id] }));
  };

  if (!records.length) {
    return (
      <div className="app-panel p-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-elevated text-copy/70">
          <ClockCounterClockwise size={24} weight="bold" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-copy">No scan history yet</h3>
        <p className="mt-2 text-sm text-muted">
          Once the backend stores results, your website, OCR, Telegram, batch,
          and extension scans will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="app-panel overflow-hidden">
      <div className="grid gap-4 p-4 md:hidden">
        {records.map((record) => {
          const expanded = expandedRows[record.id];
          const message = record.message || record.extracted_text || "";

          return (
            <article
              key={record.id}
              className="rounded-[24px] border border-line/10 bg-surface/70 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="status-chip bg-elevated-strong/80 text-copy/80">
                  {formatSourceLabel(record.source)}
                </span>
                <StatusBadge value={record.result} />
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-copy/45">
                {formatDateTime(record.timestamp)}
              </p>
              <p className="mt-3 text-sm leading-7 text-copy">
                {expanded ? message : truncateText(message, 140)}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="status-chip bg-elevated-strong/80 text-copy/80">
                  Confidence {formatConfidence(record.confidence)}
                </span>
                <span className="status-chip max-w-full truncate bg-elevated-strong/80 text-copy/70">
                  AI Label:{" "}
                  {record.ai_label
                    ? record.ai_label.length > 80
                      ? `${record.ai_label.slice(0, 77)}...`
                      : record.ai_label
                    : "-"}
                </span>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => toggleExpanded(record.id)}
                  className="btn-secondary-dark flex items-center justify-center rounded-xl p-2 text-primary hover:bg-primary/10"
                  title={expanded ? "Collapse Message" : "Expand Message"}
                >
                  {expanded ? <Minus size={20} weight="bold" /> : <Plus size={20} weight="bold" />}
                </button>
                {(record.result === "spam" || record.result === "needs_review") && (
                  <button
                    type="button"
                    title="Regenerate AI Label"
                    className="btn-secondary-dark rounded-xl px-4 py-2 text-primary hover:bg-primary/10"
                    onClick={() => onRegenLabel(record.id)}
                    aria-label={`Regenerate AI label for record ${record.id}`}
                  >
                    <ArrowsClockwise size={16} />
                  </button>
                )}
                <button
                  type="button"
                  className="btn-secondary-dark rounded-xl border-threat/20 px-4 py-2 text-threat hover:bg-threat/10"
                  onClick={() => onDelete(record.id)}
                  aria-label={`Delete record ${record.id}`}
                >
                  <Trash size={16} />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="table-row-divider bg-panel/40 text-left">
              {["Timestamp", "Source", "Message", "Result", "Confidence", "AI Label", "Action"].map(
                (header) => (
                  <th
                    key={header}
                    className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-copy/45"
                  >
                    {header}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const expanded = expandedRows[record.id];
              const message = record.message || record.extracted_text || "";

              return (
                <tr key={record.id} className="table-row-divider hover:bg-elevated-strong/20">
                  <td className="min-w-[170px] px-6 py-5 align-top text-sm text-copy/85">
                    {formatDateTime(record.timestamp)}
                  </td>
                  <td className="px-6 py-5 align-top">
                    <span className="status-chip bg-elevated-strong/80 text-copy/80">
                      {formatSourceLabel(record.source)}
                    </span>
                  </td>
                  <td className="min-w-[320px] px-6 py-5 align-top">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(record.id)}
                      className="group text-left leading-7 text-copy"
                    >
                      {expanded ? message : truncateText(message, 100)}
                      <span 
                        className="ml-2 inline-flex items-center justify-center p-1 rounded-md bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                        title={expanded ? "Collapse Message" : "Expand Message"}
                      >
                        {expanded ? <Minus size={14} weight="bold" /> : <Plus size={14} weight="bold" />}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <StatusBadge value={record.result} />
                  </td>
                  <td className="px-6 py-5 align-top text-sm font-semibold text-copy/80">
                    {formatConfidence(record.confidence)}
                  </td>
                  <td className="min-w-[200px] max-w-[260px] px-6 py-5 align-top">
                    {record.ai_label ? (
                      <span
                        title={record.ai_label}
                        className="inline-block text-xs leading-5 text-copy/65"
                      >
                        {record.ai_label.length > 80
                          ? `${record.ai_label.slice(0, 77)}...`
                          : record.ai_label}
                      </span>
                    ) : (
                      <span className="text-xs text-copy/25">-</span>
                    )}
                  </td>
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-center gap-2">
                      {(record.result === "spam" || record.result === "needs_review") && (
                        <button
                          type="button"
                          title="Regenerate AI Label"
                          className="btn-secondary-dark rounded-xl px-3 py-2 text-primary hover:bg-primary/10"
                          onClick={() => onRegenLabel(record.id)}
                          aria-label={`Regenerate AI label for record ${record.id}`}
                        >
                          <ArrowsClockwise size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-secondary-dark rounded-xl border-threat/20 px-3 py-2 text-threat hover:bg-threat/10"
                        onClick={() => onDelete(record.id)}
                        aria-label={`Delete record ${record.id}`}
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
