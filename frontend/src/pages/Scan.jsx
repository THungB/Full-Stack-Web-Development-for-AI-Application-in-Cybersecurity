import { startTransition, useState } from "react";
import {
  ChatTeardropText,
  Scan as ScanGlyph,
  Textbox,
  UploadSimple,
} from "@phosphor-icons/react";
import BatchResultsTable from "../components/BatchResultsTable";
import BatchTester from "../components/BatchTester";
import OcrScanner from "../components/OcrScanner";
import ResultCard from "../components/ResultCard";
import ScanForm from "../components/ScanForm";
import SystemStatus from "../components/SystemStatus";
import TelegramInbox from "../components/TelegramInbox";
import { useToast } from "../components/ToastProvider";
import { scanMessage } from "../services/api";
import { formatPercent, formatInteger } from "../utils/format";

const tabs = [
  { key: "text", label: "Text Input", icon: Textbox },
  { key: "ocr", label: "OCR Scanner", icon: UploadSimple },
  { key: "batch", label: "Batch Test", icon: ScanGlyph },
];

function BatchPreview({ response, state, error }) {
  const summary = response?.summary;

  if (state === "loading") {
    return (
      <section className="app-panel min-h-[28rem] p-6">
        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-copy">Batch Preview</h3>
          <span className="rounded-lg bg-elevated px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-copy/55">
            Running
          </span>
        </div>
        <p className="text-sm text-muted">
          The backend is validating rows, running predictions, and building summary metrics.
        </p>
      </section>
    );
  }

  if (state === "error") {
    return (
      <section className="app-panel min-h-[28rem] p-6">
        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-copy">Batch Preview</h3>
          <span className="rounded-lg bg-elevated px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-copy/55">
            Error
          </span>
        </div>
        <p className="text-sm text-threat">{error || "Unable to run the batch analysis."}</p>
      </section>
    );
  }

  if (!summary) {
    return (
      <section className="app-panel min-h-[28rem] p-6">
        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-copy">Batch Preview</h3>
          <span className="rounded-lg bg-elevated px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-copy/55">
            Idle
          </span>
        </div>
        <p className="text-sm leading-6 text-muted">
          Upload a CSV to see processed row counts, labeled evaluation metrics,
          and a detailed per-row ledger below.
        </p>
      </section>
    );
  }

  const metrics = [
    { label: "Processed", value: formatInteger(summary.processed) },
    { label: "Failed", value: formatInteger(summary.failed) },
    { label: "Spam", value: formatInteger(summary.spam_count) },
    { label: "Ham", value: formatInteger(summary.ham_count) },
    {
      label: "Accuracy",
      value:
        summary.accuracy === null || summary.accuracy === undefined
          ? "N/A"
          : formatPercent(summary.accuracy),
    },
    {
      label: "F1 Score",
      value:
        summary.f1_score === null || summary.f1_score === undefined
          ? "N/A"
          : formatPercent(summary.f1_score),
    },
  ];

  return (
    <section className="app-panel min-h-[28rem] p-6">
      <div className="mb-8 flex items-center justify-between">
        <h3 className="text-2xl font-bold text-copy">Batch Preview</h3>
        <span className="rounded-lg bg-elevated px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-copy/55">
          Ready
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-[20px] border border-line/10 bg-surface/65 p-4"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-copy/45">
              {metric.label}
            </p>
            <p className="mt-3 text-2xl font-bold text-copy">{metric.value}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 rounded-[20px] border border-line/10 bg-surface/65 p-4 text-sm text-muted">
        Default source: <span className="font-semibold text-copy">{summary.default_source}</span>
        {" • "}Stored results:{" "}
        <span className="font-semibold text-copy">
          {summary.stored_results ? "Yes" : "No"}
        </span>
      </div>
    </section>
  );
}

export default function Scan() {
  const [activeTab, setActiveTab] = useState("text");
  const [showTelegram, setShowTelegram] = useState(false);
  const [result, setResult] = useState(null);
  const [resultState, setResultState] = useState("idle");
  const [resultError, setResultError] = useState("");
  const [batchResponse, setBatchResponse] = useState(null);
  const [batchState, setBatchState] = useState("idle");
  const [batchError, setBatchError] = useState("");
  const { showToast } = useToast();

  const handleManualScan = async (payload) => {
    setResultState("loading");
    setResultError("");

    try {
      const response = await scanMessage(payload.message, payload.source);
      setResult({
        ...response.data,
        message: payload.message,
        source: payload.source,
      });
      setResultState("success");
      showToast({
        tone: "success",
        title: "Scan completed",
        description: "The message was analyzed successfully.",
      });
    } catch (error) {
      const message =
        error.response?.data?.detail || "Unable to scan this message right now.";
      setResultState("error");
      setResultError(message);
      showToast({
        tone: "error",
        title: "Scan failed",
        description: message,
      });
      throw error;
    }
  };

  const handleOcrResult = (data) => {
    setResult({
      ...data,
      message: data.extracted_text,
      source: "ocr",
    });
    setResultState("success");
    setResultError("");
    showToast({
      tone: "success",
      title: "OCR scan completed",
      description: "Image text was extracted and analyzed successfully.",
    });
  };

  const handleOcrError = (error) => {
    const message =
      error.response?.data?.detail || error.message || "OCR scan failed.";
    setResultState("error");
    setResultError(message);
    showToast({
      tone: "error",
      title: "OCR scan failed",
      description: message,
    });
  };

  const handleBatchSuccess = (data) => {
    setBatchResponse(data);
    setBatchState("success");
    setBatchError("");
    showToast({
      tone: "success",
      title: "Batch test completed",
      description: `${data.summary.processed} rows processed, ${data.summary.failed} failed.`,
    });
  };

  const handleBatchError = (error) => {
    const message =
      error.response?.data?.detail || error.message || "Batch test failed.";
    setBatchState("error");
    setBatchError(message);
    showToast({
      tone: "error",
      title: "Batch test failed",
      description: message,
    });
  };

  const activateTab = (tabKey) => {
    startTransition(() => {
      setActiveTab(tabKey);
    });
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="app-panel p-6 sm:p-8">
          <h2 className="text-4xl font-extrabold tracking-tight text-copy sm:text-5xl">
            Inspect suspicious messages
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
            Paste message contents or upload documentation to run real-time
            heuristics and pattern recognition against your global threat
            database.
          </p>
        </div>
        <SystemStatus variant="hero" />
      </section>

      <div className="flex flex-wrap gap-3">
        <span className="status-chip">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Validation: v2.4 active
        </span>
        <span className="status-chip">
          <span className="h-2 w-2 rounded-full bg-safe" />
          OCR: ready
        </span>
        <span className="status-chip">
          <span className="h-2 w-2 rounded-full bg-threat" />
          Batch: multi-format
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-2xl border border-line/15 bg-surface p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.key}
                type="button"
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  activeTab === tab.key
                    ? "bg-elevated-strong text-primary"
                    : "text-copy/60 hover:text-copy"
                }`}
                onClick={() => activateTab(tab.key)}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
            showTelegram
              ? "border-primary/20 bg-primary/10 text-primary"
              : "border-line/20 bg-surface text-copy/70 hover:text-copy"
          }`}
          onClick={() => setShowTelegram((value) => !value)}
        >
          <ChatTeardropText size={16} />
          Telegram Inbox
        </button>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <div>
          {activeTab === "text" ? (
            <ScanForm onSubmit={handleManualScan} />
          ) : activeTab === "ocr" ? (
            <OcrScanner onResult={handleOcrResult} onError={handleOcrError} />
          ) : (
            <BatchTester
              onSuccess={handleBatchSuccess}
              onError={handleBatchError}
            />
          )}
        </div>

        <div>
          {activeTab === "batch" ? (
            <BatchPreview
              response={batchResponse}
              state={batchState}
              error={batchError}
            />
          ) : (
            <ResultCard
              result={result}
              state={resultState}
              error={resultError}
            />
          )}
        </div>
      </section>

      {activeTab === "batch" && batchResponse?.items?.length ? (
        <BatchResultsTable items={batchResponse.items} />
      ) : null}

      {showTelegram ? <TelegramInbox showToast={showToast} /> : null}
    </div>
  );
}
