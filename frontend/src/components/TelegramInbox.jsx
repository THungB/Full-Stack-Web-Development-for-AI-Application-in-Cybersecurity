import { useCallback, useEffect, useState } from "react";
import { TelegramLogo } from "@phosphor-icons/react";
import { deleteTelegramRecord, getTelegramMessages, scanMessage } from "../services/api";
import { formatConfidence, formatDateTime, truncateText } from "../utils/format";
import StatusBadge from "./StatusBadge";

const FILTERS = [
  { label: "All", value: "" },
  { label: "Spam", value: "spam" },
  { label: "Ham", value: "ham" },
];

export default function TelegramInbox({ showToast }) {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [rescanningIds, setRescanningIds] = useState(new Set());
  const [rescanResults, setRescanResults] = useState({});

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getTelegramMessages(page, limit, filter);
      setRecords(response.data.data);
      setTotal(response.data.total);
    } catch {
      showToast({
        tone: "error",
        title: "Failed to load Telegram inbox",
        description: "Could not fetch messages from the server.",
      });
    } finally {
      setLoading(false);
    }
  }, [page, filter, showToast]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const toggleExpanded = (id) => {
    setExpandedRows((current) => ({ ...current, [id]: !current[id] }));
  };

  const handleDelete = async (id) => {
    try {
      await deleteTelegramRecord(id);
      setRecords((current) => current.filter((record) => record.id !== id));
      setTotal((current) => current - 1);
      showToast({
        tone: "success",
        title: "Record deleted",
        description: "The Telegram message record has been removed.",
      });
    } catch {
      showToast({
        tone: "error",
        title: "Delete failed",
        description: "Could not delete this record.",
      });
    }
  };

  const handleRescan = async (record) => {
    setRescanningIds((current) => new Set(current).add(record.id));
    try {
      const response = await scanMessage(record.message, "telegram");
      const newResult = response.data;
      setRescanResults((current) => ({ ...current, [record.id]: newResult }));
      showToast({
        tone: "success",
        title: "Re-scan complete",
        description: `New result: ${String(newResult.result).toUpperCase()} (${formatConfidence(newResult.confidence)})`,
      });
    } catch {
      showToast({
        tone: "error",
        title: "Re-scan failed",
        description: "Could not re-scan this message.",
      });
    } finally {
      setRescanningIds((current) => {
        const updated = new Set(current);
        updated.delete(record.id);
        return updated;
      });
    }
  };

  const handleFilterChange = (value) => {
    setFilter(value);
    setPage(1);
  };

  if (!loading && records.length === 0) {
    return (
      <section className="panel p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
          <TelegramLogo size={24} weight="light" className="text-steel" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-ink">
          No Telegram messages yet
        </h3>
        <p className="mt-2 text-sm text-steel">
          Send a message to your Telegram bot and it will appear here for
          review.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="panel p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  filter === f.value
                    ? "bg-ink text-white"
                    : "bg-white text-ink hover:text-signal"
                }`}
                onClick={() => handleFilterChange(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-steel">
            {total} message{total !== 1 ? "s" : ""}
          </span>
        </div>
      </section>

      {loading ? (
        <section className="panel p-12 text-center">
          <p className="text-sm text-steel">Loading messages...</p>
        </section>
      ) : (
        <div className="panel overflow-hidden">
          <div className="grid gap-4 p-4 md:hidden">
            {records.map((record) => {
              const expanded = expandedRows[record.id];
              const rescanned = rescanResults[record.id];
              const isRescanning = rescanningIds.has(record.id);

              return (
                <article
                  key={record.id}
                  className="rounded-[24px] border border-ink/10 bg-white p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <StatusBadge value={rescanned ? rescanned.result : record.result} />
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-steel">
                      {formatDateTime(record.timestamp)}
                    </span>
                  </div>

                  {record.username && (
                    <p className="mt-2 text-xs text-steel">
                      From: @{record.username}
                    </p>
                  )}

                  <p className="mt-3 text-sm leading-7 text-ink">
                    {expanded ? record.message : truncateText(record.message, 140)}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="chip bg-[#faf6ed] text-ink">
                      Confidence{" "}
                      {formatConfidence(
                        rescanned ? rescanned.confidence : record.confidence,
                      )}
                    </span>
                    {rescanned && (
                      <span className="chip bg-safe/10 text-safe">
                        Re-scanned
                      </span>
                    )}
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
                      disabled={isRescanning}
                      onClick={() => handleRescan(record)}
                      className="rounded-full border border-signal/20 px-4 py-2 text-xs font-semibold text-signal transition hover:bg-signal/10 disabled:opacity-50"
                    >
                      {isRescanning ? "Scanning..." : "Re-scan"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(record.id)}
                      className="rounded-full border border-danger/20 px-4 py-2 text-xs font-semibold text-danger transition hover:bg-danger/10"
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
                <tr className="border-b border-slate-100 bg-white text-left">
                  {["Timestamp", "User", "Message", "Result", "Confidence", "Actions"].map(
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
                  const rescanned = rescanResults[record.id];
                  const isRescanning = rescanningIds.has(record.id);

                  return (
                    <tr key={record.id} className="border-b border-slate-50 hover:bg-white/70">
                      <td className="table-cell min-w-[150px]">
                        {formatDateTime(record.timestamp)}
                      </td>
                      <td className="table-cell min-w-[100px]">
                        {record.username ? (
                          <span className="text-sm text-ink">
                            @{record.username}
                          </span>
                        ) : (
                          <span className="text-sm text-steel">Unknown</span>
                        )}
                      </td>
                      <td className="table-cell min-w-[280px]">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(record.id)}
                          className="text-left leading-7 text-ink"
                        >
                          {expanded
                            ? record.message
                            : truncateText(record.message, 100)}
                          <span className="ml-2 text-xs font-semibold uppercase tracking-[0.18em] text-signal">
                            {expanded ? "Show less" : "Expand"}
                          </span>
                        </button>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-col gap-1">
                          <StatusBadge
                            value={rescanned ? rescanned.result : record.result}
                          />
                          {rescanned && (
                            <span className="text-xs text-steel">Re-scanned</span>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        {formatConfidence(
                          rescanned ? rescanned.confidence : record.confidence,
                        )}
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={isRescanning}
                            onClick={() => handleRescan(record)}
                            className="rounded-full border border-signal/20 px-3 py-2 text-xs font-semibold text-signal transition hover:bg-signal/10 disabled:opacity-50"
                          >
                            {isRescanning ? "..." : "Re-scan"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(record.id)}
                            className="rounded-full border border-danger/20 px-3 py-2 text-xs font-semibold text-danger transition hover:bg-danger/10"
                          >
                            Delete
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
      )}

      {totalPages > 1 && (
        <section className="panel flex items-center justify-between p-4">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((current) => current - 1)}
            className="btn-secondary px-4 py-2 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-steel">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="btn-secondary px-4 py-2 disabled:opacity-40"
          >
            Next
          </button>
        </section>
      )}
    </div>
  );
}