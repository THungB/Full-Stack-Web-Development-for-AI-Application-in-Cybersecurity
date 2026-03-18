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
          <p className="section-kicker">Latest Result</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <StatusBadge value={result.result} />
            <span className="chip bg-ink/10 text-ink">
              Confidence {formatConfidence(result.confidence)}
            </span>
            <span className="chip bg-white text-steel">
              Source {(result.source || "website").toUpperCase()}
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

        <div className="rounded-[24px] bg-[#faf6ed] px-5 py-4 text-sm text-steel">
          <p className="font-semibold text-ink">Record ID</p>
          <p className="mt-1 text-lg font-bold text-ink">{result.id ?? "Pending"}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[24px] bg-[#fffaf0] p-5">
          <p className="text-sm font-semibold text-ink">
            {result.extracted_text ? "Extracted message" : "Message preview"}
          </p>
          <div className="mt-4 rounded-[20px] bg-white p-4 text-sm leading-7 text-ink">
            {highlightKeywords(
              result.extracted_text || result.message || "",
              keywords,
            )}
          </div>
        </div>

        <div className="rounded-[24px] border border-ink/10 bg-white p-5">
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
