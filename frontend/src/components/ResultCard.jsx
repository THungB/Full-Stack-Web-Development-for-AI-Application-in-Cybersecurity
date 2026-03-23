import StatusBadge from "./StatusBadge";
import { formatConfidence, highlightKeywords } from "../utils/format";

export default function ResultCard({ result }) {
  if (!result) return null;

  const keywords = Array.isArray(result.keywords)
    ? result.keywords
    : typeof result.keywords === "string"
      ? result.keywords
          .split(",")
          .map((keyword) => keyword.trim())
          .filter(Boolean)
      : [];

  return (
    <section className="panel overflow-hidden p-5 sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium text-steel">Latest Result</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <StatusBadge value={result.result} />
            <span className="chip bg-ink/10 text-ink">
              Confidence {formatConfidence(result.confidence)}
            </span>
            <span className="chip bg-white text-steel">
              Source {(result.source || "website").toUpperCase()}
            </span>
            <span className="chip bg-slate-100 text-steel">
              ID: {result.id ?? "Pending"}
            </span>
          </div>
          <h3 className="mt-4 text-2xl font-bold">
            {result.result === "spam"
              ? "High-risk content detected"
              : "Message looks legitimate"}
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-steel">
            {result.result === "spam"
              ? "The model found patterns commonly associated with phishing, scams, or unsolicited promotional content."
              : "The message did not cross the spam threshold, but you can still review extracted keywords and source context."}
          </p>
        </div>

        <span className="chip bg-slate-100 text-steel">
          ID: {result.id ?? "Pending"}
        </span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[24px] bg-slate-50 p-5">
          <p className="text-sm font-semibold text-ink">
            {result.extracted_text ? "Extracted message" : "Message preview"}
          </p>
          <div className="mt-4 max-h-[360px] overflow-auto rounded-[20px] bg-white p-4 text-sm leading-7 text-ink break-words">
            {highlightKeywords(
              result.extracted_text || result.message || "",
              keywords,
            )}
          </div>
        </div>

        <div className="rounded-[24px] bg-slate-50 p-5">
          <p className="text-sm font-semibold text-ink">Flagged keywords</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {keywords.length ? (
              keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full bg-danger/10 px-3 py-2 text-xs font-semibold text-danger"
                >
                  {keyword}
                </span>
              ))
            ) : (
              <p className="text-sm text-steel">
                No keywords returned by the model for this result.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
