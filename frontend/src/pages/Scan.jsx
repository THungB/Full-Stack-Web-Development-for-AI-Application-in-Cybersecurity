import { useState } from "react";
import InsightStrip from "../components/InsightStrip";
import OcrScanner from "../components/OcrScanner";
import ResultCard from "../components/ResultCard";
import ScanForm from "../components/ScanForm";
import SectionHeading from "../components/SectionHeading";
import SystemStatus from "../components/SystemStatus";
import { useToast } from "../components/ToastProvider";
import { scanMessage } from "../services/api";

const tabs = [
  { key: "text", label: "Text Input" },
  { key: "ocr", label: "OCR Scanner" },
];

export default function Scan() {
  const [activeTab, setActiveTab] = useState("text");
  const [result, setResult] = useState(null);
  const { showToast } = useToast();

  const handleManualScan = async (payload) => {
    try {
      const response = await scanMessage(payload.message, payload.source);
      setResult({
        ...response.data,
        message: payload.message,
        source: payload.source,
      });
      showToast({
        tone: "success",
        title: "Scan completed",
        description: "The message was analyzed successfully.",
      });
    } catch (error) {
      const message =
        error.response?.data?.detail || "Unable to scan this message right now.";
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
    showToast({
      tone: "success",
      title: "OCR scan completed",
      description: "Image text was extracted and analyzed successfully.",
    });
  };

  const handleOcrError = (error) => {
    const message =
      error.response?.data?.detail || error.message || "OCR scan failed.";
    showToast({
      tone: "error",
      title: "OCR scan failed",
      description: message,
    });
  };

  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden p-6 sm:p-8">
        <SectionHeading
          eyebrow="Scan Workspace"
          title="Inspect suspicious messages from text or screenshots"
          description="Switch between manual message input and OCR capture. The result card below highlights confidence, source, and suspicious keywords."
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SystemStatus />
        <InsightStrip
          items={[
            {
              label: "Validation",
              value: "10-2000",
              description:
                "Manual input enforces trimmed text with a minimum and maximum character boundary.",
            },
            {
              label: "OCR Inputs",
              value: "PNG/JPG/WebP",
              description:
                "Screenshots can be uploaded directly or captured live from the current screen.",
            },
            {
              label: "Feedback",
              value: "Toast + Card",
              description:
                "Successful scans immediately appear in the result card with confidence and keywords.",
            },
            {
              label: "Source Tag",
              value: activeTab.toUpperCase(),
              description:
                "The workflow preserves whether the message came from text input or OCR scan.",
            },
          ]}
        />
      </div>

      <section className="panel p-4 sm:p-5">
        <div className="flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "bg-ink text-white"
                  : "bg-white text-ink hover:text-signal"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "text" ? (
        <ScanForm onSubmit={handleManualScan} />
      ) : (
        <OcrScanner onResult={handleOcrResult} onError={handleOcrError} />
      )}

      {result ? (
        <ResultCard result={result} />
      ) : (
        <section className="panel p-6 sm:p-8">
          <p className="section-kicker">Result Preview</p>
          <h3 className="mt-4 text-2xl font-bold">No scan result yet</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-steel">
            Submit a suspicious message or upload a screenshot to see the
            confidence score, source label, and highlighted keywords here.
          </p>
        </section>
      )}
    </div>
  );
}
