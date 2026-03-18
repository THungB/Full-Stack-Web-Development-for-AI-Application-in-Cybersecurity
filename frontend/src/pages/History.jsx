import { startTransition, useEffect, useState } from "react";
import HistoryTable from "../components/HistoryTable";
import InsightStrip from "../components/InsightStrip";
import SectionHeading from "../components/SectionHeading";
import SystemStatus from "../components/SystemStatus";
import { useToast } from "../components/ToastProvider";
import { deleteRecord, getHistory } from "../services/api";

const PAGE_SIZE = 20;

function downloadCsv(records) {
  const headers = [
    "id",
    "timestamp",
    "source",
    "result",
    "confidence",
    "message",
    "keywords",
  ];

  const rows = records.map((record) =>
    [
      record.id,
      record.timestamp,
      record.source,
      record.result,
      record.confidence,
      `"${String(record.message || "").replaceAll('"', '""')}"`,
      `"${String(
        Array.isArray(record.keywords) ? record.keywords.join(", ") : record.keywords || "",
      ).replaceAll('"', '""')}"`,
    ].join(","),
  );

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "scan-history.csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function History() {
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortOrder, setSortOrder] = useState("desc");
  const [resultFilter, setResultFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;

    const fetchHistory = async () => {
      try {
        if (active) {
          setLoading(true);
          setError("");
        }

        const response = await getHistory(page, PAGE_SIZE, resultFilter, sourceFilter);
        if (!active) return;

        startTransition(() => {
          setRecords(response.data.data ?? []);
          setTotal(response.data.total ?? 0);
        });
      } catch (requestError) {
        if (!active) return;

        const message =
          requestError.response?.data?.detail || "Unable to fetch scan history.";
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchHistory();
    const intervalId = window.setInterval(fetchHistory, 10000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [page, resultFilter, sourceFilter]);

  const sortedRecords = [...records].sort((a, b) => {
    const first = new Date(a.timestamp || 0).getTime();
    const second = new Date(b.timestamp || 0).getTime();
    return sortOrder === "desc" ? second - first : first - second;
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const spamCount = sortedRecords.filter((record) => record.result === "spam").length;
  const hamCount = sortedRecords.filter((record) => record.result === "ham").length;

  const handleDelete = async (id) => {
    try {
      await deleteRecord(id);
      setRecords((current) => current.filter((record) => record.id !== id));
      setTotal((current) => Math.max(0, current - 1));
      showToast({
        tone: "success",
        title: "Record deleted",
        description: `History item #${id} was removed.`,
      });
    } catch (requestError) {
      const message =
        requestError.response?.data?.detail || "Unable to delete this record.";
      showToast({
        tone: "error",
        title: "Delete failed",
        description: message,
      });
    }
  };

  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden p-6 sm:p-8">
        <SectionHeading
          eyebrow="History Ledger"
          title="Review and export scanned records"
          description="Filter by result and source, auto-refresh the table every 10 seconds, and export the current page as CSV."
          action={
            <button
              type="button"
              className="btn-secondary"
              onClick={() => downloadCsv(sortedRecords)}
              disabled={!sortedRecords.length}
            >
              Export CSV
            </button>
          }
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SystemStatus />
        <InsightStrip
          items={[
            {
              label: "Current Page",
              value: page,
              description: "Keeps the current paginated slice of scan records in view.",
            },
            {
              label: "Visible Spam",
              value: spamCount,
              description: "Spam results currently visible after active filters and sorting.",
            },
            {
              label: "Visible Ham",
              value: hamCount,
              description: "Benign results currently visible after active filters and sorting.",
            },
            {
              label: "CSV Ready",
              value: sortedRecords.length ? "Yes" : "No",
              description: "Export only includes the records currently rendered in the table.",
            },
          ]}
        />
      </div>

      <section className="panel p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-ink">Result filter</span>
            <select
              className="field"
              value={resultFilter}
              onChange={(event) => {
                setPage(1);
                setResultFilter(event.target.value);
              }}
            >
              <option value="">All results</option>
              <option value="spam">Spam</option>
              <option value="ham">Ham</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-ink">Source filter</span>
            <select
              className="field"
              value={sourceFilter}
              onChange={(event) => {
                setPage(1);
                setSourceFilter(event.target.value);
              }}
            >
              <option value="">All sources</option>
              <option value="website">Website</option>
              <option value="telegram">Telegram</option>
              <option value="extension">Extension</option>
              <option value="ocr">OCR</option>
              <option value="batch">Batch</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-ink">Sort order</span>
            <select
              className="field"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </label>

          <div className="rounded-[24px] bg-[#faf6ed] px-4 py-3">
            <p className="text-sm font-semibold text-ink">Auto refresh</p>
            <p className="mt-2 text-sm text-steel">
              The table syncs with the backend every 10 seconds.
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[28px] border border-danger/20 bg-white/90 p-5 text-danger">
          <p className="font-semibold">History data could not be loaded.</p>
          <p className="mt-2 text-sm text-danger/80">{error}</p>
        </div>
      ) : null}

      {loading ? (
        <div className="panel p-5">
          <p className="text-sm font-medium text-steel">
            Refreshing the latest scan history from the backend...
          </p>
        </div>
      ) : null}

      <HistoryTable records={sortedRecords} onDelete={handleDelete} />

      <section className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">
            Page {page} of {totalPages}
          </p>
          <p className="mt-1 text-sm text-steel">{total} total records matched.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
