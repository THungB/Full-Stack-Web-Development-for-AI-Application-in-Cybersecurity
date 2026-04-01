import { startTransition, useEffect, useMemo, useState } from "react";
import {
  ArrowCounterClockwise,
  CaretLeft,
  CaretRight,
  DownloadSimple,
} from "@phosphor-icons/react";
import { useSearchParams } from "react-router-dom";
import HistoryTable from "../components/HistoryTable";
import { useToast } from "../components/ToastProvider";
import { deleteRecord, getHistory } from "../services/api";
import { formatInteger } from "../utils/format";

const PAGE_SIZE = 20;
const VALID_SORTS = new Set(["desc", "asc", "conf_desc", "conf_asc"]);
const VALID_RESULTS = new Set(["", "spam", "ham"]);
const VALID_SOURCES = new Set(["", "website", "telegram", "extension", "ocr", "batch"]);

function parsePositiveInt(value, fallback = 1) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

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

function OverviewCard({ label, value, accent, secondary }) {
  return (
    <article className="metric-card">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-copy/45">
        {label}
      </p>
      <p className={`mt-3 text-4xl font-extrabold tracking-tight ${accent}`}>{value}</p>
      {secondary ? <p className="mt-3 text-sm text-muted">{secondary}</p> : null}
    </article>
  );
}

function getVisiblePages(currentPage, totalPages) {
  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  return [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((first, second) => first - second);
}

export default function History() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(() =>
    parsePositiveInt(searchParams.get("page"), 1),
  );
  const [total, setTotal] = useState(0);
  const [sortOrder, setSortOrder] = useState(() => {
    const value = searchParams.get("sort") || "desc";
    return VALID_SORTS.has(value) ? value : "desc";
  });
  const [resultFilter, setResultFilter] = useState(() => {
    const value = searchParams.get("filter") || "";
    return VALID_RESULTS.has(value) ? value : "";
  });
  const [sourceFilter, setSourceFilter] = useState(() => {
    const value = searchParams.get("source") || "";
    return VALID_SOURCES.has(value) ? value : "";
  });
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

  const sortedRecords = useMemo(() => {
    const items = [...records];

    return items.sort((a, b) => {
      if (sortOrder === "conf_desc") return (b.confidence ?? 0) - (a.confidence ?? 0);
      if (sortOrder === "conf_asc") return (a.confidence ?? 0) - (b.confidence ?? 0);
      const first = new Date(a.timestamp || 0).getTime();
      const second = new Date(b.timestamp || 0).getTime();
      return sortOrder === "desc" ? second - first : first - second;
    });
  }, [records, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const spamCount = sortedRecords.filter((record) => record.result === "spam").length;
  const hamCount = sortedRecords.filter((record) => record.result === "ham").length;
  const visiblePages = getVisiblePages(page, totalPages);
  const firstRow = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastRow = total ? Math.min(page * PAGE_SIZE, total) : 0;

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (resultFilter) nextParams.set("filter", resultFilter);
    if (sourceFilter) nextParams.set("source", sourceFilter);
    if (sortOrder !== "desc") nextParams.set("sort", sortOrder);
    if (page > 1) nextParams.set("page", String(page));
    setSearchParams(nextParams, { replace: true });
  }, [page, resultFilter, sourceFilter, sortOrder, setSearchParams]);

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
      <section className="app-panel p-6 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-copy sm:text-5xl">
              Review and export scanned records
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
              Complete historical ledger of intercepted traffic and model
              validations, with query-aware routing from the dashboard summary cards.
            </p>
          </div>

          <button
            type="button"
            className="btn-primary-dark rounded-xl"
            onClick={() => downloadCsv(sortedRecords)}
            disabled={!sortedRecords.length}
          >
            <DownloadSimple size={16} />
            Export CSV
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OverviewCard
          label="Current Page"
          value={`${page} / ${totalPages}`}
          accent="text-copy"
          secondary={`${formatInteger(total)} total entries`}
        />
        <OverviewCard
          label="Visible Spam"
          value={formatInteger(spamCount)}
          accent="text-threat"
          secondary="Detected on the current page"
        />
        <OverviewCard
          label="Visible Ham"
          value={formatInteger(hamCount)}
          accent="text-safe"
          secondary="Legitimate records on the current page"
        />
        <OverviewCard
          label="CSV Ready"
          value={loading ? "Syncing" : sortedRecords.length ? "Ready" : "Idle"}
          accent={loading ? "text-primary" : sortedRecords.length ? "text-safe" : "text-copy"}
          secondary="Export action uses the filtered, current-page ledger"
        />
      </section>

      <section className="app-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/10 px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative">
              <select
                className="field-dark min-w-[150px] rounded-xl py-2.5"
                value={resultFilter}
                onChange={(event) => {
                  setPage(1);
                  setResultFilter(event.target.value);
                }}
              >
                <option value="">All results</option>
                <option value="spam">Spam only</option>
                <option value="ham">Ham only</option>
              </select>
            </label>

            <label className="relative">
              <select
                className="field-dark min-w-[150px] rounded-xl py-2.5"
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

            <label className="relative">
              <select
                className="field-dark min-w-[170px] rounded-xl py-2.5"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
                <option value="conf_desc">Highest confidence</option>
                <option value="conf_asc">Lowest confidence</option>
              </select>
            </label>

            <button
              type="button"
              title="Reset filters"
              className="btn-secondary-dark h-11 w-11 rounded-xl px-0"
              onClick={() => {
                setResultFilter("");
                setSourceFilter("");
                setSortOrder("desc");
                setPage(1);
              }}
            >
              <ArrowCounterClockwise size={16} weight="bold" />
            </button>
          </div>

          <div className="text-xs font-bold uppercase tracking-[0.18em] text-copy/45">
            Showing {firstRow}-{lastRow} of {formatInteger(total)} entries
          </div>
        </div>

        {error ? (
          <div className="border-b border-line/10 bg-threat/10 px-5 py-4 text-threat">
            <p className="font-semibold">History data could not be loaded.</p>
            <p className="mt-2 text-sm text-copy/75">{error}</p>
          </div>
        ) : null}

        {loading ? (
          <div className="border-b border-line/10 px-5 py-4">
            <p className="text-sm text-muted">
              Refreshing the latest scan history from the backend...
            </p>
          </div>
        ) : null}

        <div className="px-0 py-0">
          <HistoryTable records={sortedRecords} onDelete={handleDelete} />
        </div>
      </section>

      <section className="app-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-sm text-muted">
          <span>Rows per page: {PAGE_SIZE}</span>
          <span>•</span>
          <span>
            Page {page} of {totalPages}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-secondary-dark h-10 w-10 rounded-xl px-0"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <CaretLeft size={16} />
          </button>

          {visiblePages.map((visiblePage) => (
            <button
              key={visiblePage}
              type="button"
              className={`h-10 min-w-[2.5rem] rounded-xl px-3 text-sm font-semibold transition ${
                visiblePage === page
                  ? "bg-primary-strong text-copy"
                  : "bg-elevated text-copy/75 hover:text-copy"
              }`}
              onClick={() => setPage(visiblePage)}
            >
              {visiblePage}
            </button>
          ))}

          <button
            type="button"
            className="btn-secondary-dark h-10 w-10 rounded-xl px-0"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            <CaretRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}
