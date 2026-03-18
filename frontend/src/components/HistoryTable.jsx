import { useState } from "react";
import StatusBadge from "./StatusBadge";
import {
  formatConfidence,
  formatDateTime,
  truncateText,
} from "../utils/format";

export default function HistoryTable({ records, onDelete }) {
  const [expandedRows, setExpandedRows] = useState({});

  const toggleExpanded = (id) => {
    setExpandedRows((current) => ({ ...current, [id]: !current[id] }));
  };

  if (!records.length) {
    return (
      <div className="panel p-10 text-center">
        <h3 className="text-2xl font-bold">No scan history yet</h3>
        <p className="mt-3 text-sm text-steel">
          Once the backend starts storing results, your website, OCR, Telegram,
          and extension scans will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden">
      <div className="grid gap-4 p-4 md:hidden">
        {records.map((record) => {
          const expanded = expandedRows[record.id];
          const message = record.message || record.extracted_text || "";

          return (
            <article
              key={record.id}
              className="rounded-[24px] border border-ink/10 bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="chip bg-ink/10 text-ink">
                  {(record.source || "website").toUpperCase()}
                </span>
                <StatusBadge value={record.result} />
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-steel">
                {formatDateTime(record.timestamp)}
              </p>
              <p className="mt-3 text-sm leading-7 text-ink">
                {expanded ? message : truncateText(message, 140)}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="chip bg-[#faf6ed] text-ink">
                  Confidence {formatConfidence(record.confidence)}
                </span>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => toggleExpanded(record.id)}
                  className="btn-secondary flex-1 px-4 py-2"
                >
                  {expanded ? "Show less" : "Expand"}
                </button>
                <button
                  type="button"
                  className="rounded-full border border-danger/20 px-4 py-2 text-xs font-semibold text-danger transition hover:bg-danger/10"
                  onClick={() => onDelete(record.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-[#faf6ed] text-left">
              {["Timestamp", "Source", "Message", "Result", "Confidence", "Action"].map(
                (header) => (
                  <th
                    key={header}
                    className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-steel"
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
                <tr key={record.id} className="hover:bg-white/70">
                  <td className="table-cell min-w-[150px]">
                    {formatDateTime(record.timestamp)}
                  </td>
                  <td className="table-cell">
                    <span className="chip bg-ink/10 text-ink">
                      {(record.source || "website").toUpperCase()}
                    </span>
                  </td>
                  <td className="table-cell min-w-[280px]">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(record.id)}
                      className="text-left leading-7 text-ink"
                    >
                      {expanded ? message : truncateText(message, 100)}
                      <span className="ml-2 text-xs font-semibold uppercase tracking-[0.18em] text-signal">
                        {expanded ? "Show less" : "Expand"}
                      </span>
                    </button>
                  </td>
                  <td className="table-cell">
                    <StatusBadge value={record.result} />
                  </td>
                  <td className="table-cell">{formatConfidence(record.confidence)}</td>
                  <td className="table-cell">
                    <button
                      type="button"
                      className="rounded-full border border-danger/20 px-3 py-2 text-xs font-semibold text-danger transition hover:bg-danger/10"
                      onClick={() => onDelete(record.id)}
                    >
                      Delete
                    </button>
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
