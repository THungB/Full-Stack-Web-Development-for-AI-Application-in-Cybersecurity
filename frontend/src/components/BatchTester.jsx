import { useRef, useState } from "react";
import {
  Check,
  DownloadSimple,
  FileCsv,
  SpinnerGap,
  UploadSimple,
} from "@phosphor-icons/react";
import { scanBatch } from "../services/api";

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

export default function BatchTester({ onSuccess, onError }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [storeResults, setStoreResults] = useState(true);
  const [loading, setLoading] = useState(false);

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
      onSuccess?.(result.data);
    } catch (error) {
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="app-panel-soft p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-lg font-bold text-copy">Batch Test</p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
              Upload a UTF-8 CSV with a required <code>message</code> column.
              Add <code>expected_label</code> if you want accuracy, precision,
              recall, and F1 score in the preview panel.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button
              type="button"
              className="btn-secondary-dark rounded-xl"
              onClick={downloadSampleCsv}
            >
              <DownloadSimple size={16} />
              Download Template
            </button>
            <button
              type="button"
              className="btn-secondary-dark rounded-xl"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <UploadSimple size={16} />
              Choose CSV
            </button>
            <button
              type="button"
              className="btn-primary-dark rounded-xl"
              onClick={handleRunBatch}
              disabled={loading || !file}
            >
              {loading ? (
                <>
                  <SpinnerGap size={16} className="animate-spin" />
                  Running Batch...
                </>
              ) : (
                <>
                  <FileCsv size={16} />
                  Run Batch Test
                </>
              )}
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
          <div className="rounded-[24px] border border-line/15 bg-surface/70 p-4">
            <p className="text-sm font-semibold text-copy">Selected file</p>
            <p className="mt-3 break-all text-sm text-muted">
              {file
                ? `${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`
                : "No CSV selected yet."}
            </p>
          </div>

          <label className="flex items-center gap-3 rounded-[24px] border border-line/15 bg-surface/70 px-4 py-4 text-sm text-copy">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#4355b9]"
              checked={storeResults}
              onChange={(event) => setStoreResults(event.target.checked)}
              disabled={loading}
            />
            <span className="inline-flex items-center gap-2">
              <Check size={16} />
              Store successful rows in scan history
            </span>
          </label>
        </div>
      </div>
    </section>
  );
}
