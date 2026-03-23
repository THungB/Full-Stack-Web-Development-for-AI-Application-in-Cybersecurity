import { useRef, useState } from "react";
import { scanBatch } from "../services/api";
import { formatConfidence, formatPercent, truncateText } from "../utils/format";
import StatusBadge from "./StatusBadge";

const sampleCsv = `message,expected_label,source
"Win a free iPhone now. Click the link to claim your reward.",spam,batch
"Meeting has been moved to 3 PM tomorrow. Please confirm.",ham,batch
`;

function downloadSampleCsv() {
  const blob = new Blob([sampleCsv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "batch-scan-template.csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

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

function MetricCard({ label, value, hint }) {
  return (
    <article className="rounded-[24px] border border-ink/10 bg-white p-4">
      <p className="text-xs font-medium text-steel">{label}</p>
      <p className="mt-3 text-3xl font-bold text-ink">{value}</p>
      <p className="mt-2 text-sm text-steel">{hint}</p>
    </article>
  );
}

function renderMetric(value) {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "number" && value >= 0 && value <= 1) {
    return formatPercent(value);
  }
  return value;
}

export default function BatchTester({ onSuccess, onError }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [storeResults, setStoreResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const handleRunBatch = async () => {
    if (!file) {
      onError?.(new Error("Please choose a CSV file first."));
      return;
    }

    setLoading(true);
    try {
      const result = await scanBatch({
        file,
        storeResults,
      });
      setResponse(result.data);
      onSuccess?.(result.data);
    } catch (error) {
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  const items = response?.items || [];
  const summary = response?.summary;

  return (
    <div className="space-y-6">
      <section className="panel p-5 sm:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-medium text-steel">Batch Test</p>
              <h3 className="mt-2 text-2xl font-bold">
                Run spam and ham checks from a CSV file
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-steel">
                Upload a UTF-8 CSV with a required <code>message</code> column.
                Add <code>expected_label</code> to calculate accuracy, precision,
                recall, and F1 score.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={downloadSampleCsv}
              >
                Download Template
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                Choose CSV
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleRunBatch}
                disabled={loading || !file}
              >
                {loading ? "Running Batch..." : "Run Batch Test"}
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />

          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="rounded-[24px] border border-dashed border-ink/12 bg-white/60 p-4">
              <p className="text-sm font-semibold text-ink">Selected file</p>
              <p className="mt-3 break-all text-sm text-steel">
                {file
                  ? `${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`
                  : "No CSV selected yet."}
              </p>
            </div>

            <label className="flex items-center gap-3 rounded-[24px] bg-white px-4 py-4 text-sm text-ink">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#11203b]"
                checked={storeResults}
                onChange={(event) => setStoreResults(event.target.checked)}
                disabled={loading}
              />
              Store successful rows in scan history
            </label>
          </div>
        </div>
      </section>

      {summary ? (
        <section className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Processed"
              value={summary.processed}
              hint="Rows successfully validated and predicted."
            />
            <MetricCard
              label="Failed"
              value={summary.failed}
              hint="Rows that could not be processed because of validation or parsing errors."
            />
            <MetricCard
              label="Spam / Ham"
              value={`${summary.spam_count} / ${summary.ham_count}`}
              hint="Predicted class counts for processed rows."
            />
            <MetricCard
              label="Accuracy"
              value={renderMetric(summary.accuracy)}
              hint="Shown when the CSV includes expected labels."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <MetricCard
              label="Precision"
              value={renderMetric(summary.precision)}
              hint="Spam precision from labeled rows."
            />
            <MetricCard
              label="Recall"
              value={renderMetric(summary.recall)}
              hint="Spam recall from labeled rows."
            />
            <MetricCard
              label="F1 Score"
              value={renderMetric(summary.f1_score)}
              hint="Balanced metric across precision and recall."
            />
          </div>
        </section>
      ) : null}

      {items.length ? (
        <section className="panel overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-ink/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium text-steel">Batch Results</p>
              <h3 className="mt-3 text-2xl font-bold">Per-row predictions</h3>
              <p className="mt-2 text-sm text-steel">
                Review failed rows, compare expected labels, and export the full
                result set as CSV.
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => exportBatchResults(items)}
            >
              Export Results
            </button>
          </div>

          <div className="grid gap-4 p-4 md:hidden">
            {items.map((item) => (
              <article
                key={`${item.row}-${item.message}`}
                className="rounded-[24px] border border-ink/10 bg-white p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip bg-ink/10 text-ink">Row {item.row}</span>
                  <span
                    className={`chip ${
                      item.status === "processed"
                        ? "bg-safe/10 text-safe"
                        : "bg-danger/10 text-danger"
                    }`}
                  >
                    {item.status}
                  </span>
                  {item.predicted_label ? <StatusBadge value={item.predicted_label} /> : null}
                </div>

                <p className="mt-4 text-sm leading-7 text-ink">
                  {truncateText(item.message, 180)}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {item.confidence !== null && item.confidence !== undefined ? (
                    <span className="chip bg-slate-100 text-ink">
                      Confidence {formatConfidence(item.confidence)}
                    </span>
                  ) : null}
                  {item.expected_label ? (
                    <span className="chip bg-white text-steel">
                      Expected {item.expected_label.toUpperCase()}
                    </span>
                  ) : null}
                  {item.correct !== null && item.correct !== undefined ? (
                    <span
                      className={`chip ${
                        item.correct ? "bg-safe/10 text-safe" : "bg-danger/10 text-danger"
                      }`}
                    >
                      {item.correct ? "Correct" : "Mismatch"}
                    </span>
                  ) : null}
                </div>

                {item.error ? (
                  <p className="mt-4 text-sm font-medium text-danger">{item.error}</p>
                ) : null}
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-white text-left">
                  {[
                    "Row",
                    "Status",
                    "Message",
                    "Expected",
                    "Predicted",
                    "Confidence",
                    "Keywords / Error",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-steel"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={`${item.row}-${item.message}`} className="hover:bg-white/70">
                    <td className="table-cell">{item.row}</td>
                    <td className="table-cell">
                      <span
                        className={`chip ${
                          item.status === "processed"
                            ? "bg-safe/10 text-safe"
                            : "bg-danger/10 text-danger"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="table-cell min-w-[320px]">
                      {truncateText(item.message, 120)}
                    </td>
                    <td className="table-cell">
                      {item.expected_label ? item.expected_label.toUpperCase() : "N/A"}
                    </td>
                    <td className="table-cell">
                      {item.predicted_label ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge value={item.predicted_label} />
                          {item.correct !== null && item.correct !== undefined ? (
                            <span
                              className={`chip ${
                                item.correct
                                  ? "bg-safe/10 text-safe"
                                  : "bg-danger/10 text-danger"
                              }`}
                            >
                              {item.correct ? "Correct" : "Mismatch"}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="table-cell">
                      {item.confidence !== null && item.confidence !== undefined
                        ? formatConfidence(item.confidence)
                        : "N/A"}
                    </td>
                    <td className="table-cell min-w-[280px]">
                      {item.error ? (
                        <p className="text-danger">{item.error}</p>
                      ) : item.keywords?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {item.keywords.map((keyword) => (
                            <span
                              key={`${item.row}-${keyword}`}
                              className="rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      ) : (
                        "No keywords"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
