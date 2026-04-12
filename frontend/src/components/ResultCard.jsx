import {
  EyeSlash,
  ShieldCheck,
  ShieldWarning,
  SpinnerGap,
} from "@phosphor-icons/react";
import StatusBadge from "./StatusBadge";
import {
  formatConfidence,
  formatSourceLabel,
  highlightKeywords,
} from "../utils/format";

function EmptyState({ state, error }) {
  if (state === "loading") {
    return (
      <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-elevated-strong/80 text-primary">
          <SpinnerGap size={34} className="animate-spin" />
        </div>
        <h4 className="mt-6 text-xl font-bold text-copy">Analyzing signal</h4>
        <p className="mt-3 text-sm leading-6 text-muted">
          The model is classifying the message and preparing keyword insight.
        </p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-threat/10 text-threat">
          <ShieldWarning size={34} weight="fill" />
        </div>
        <h4 className="mt-6 text-xl font-bold text-copy">Unable to complete scan</h4>
        <p className="mt-3 text-sm leading-6 text-muted">
          {error || "Something interrupted the analysis request."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-elevated-strong/80 text-copy/30">
        <EyeSlash size={34} />
      </div>
      <h4 className="mt-6 text-xl font-bold text-copy">Awaiting Intelligence</h4>
      <p className="mt-3 text-sm leading-6 text-muted">
        Perform a manual scan or upload a file to see threat insights and confidence metrics here.
      </p>
    </div>
  );
}

export default function ResultCard({ result, state = "idle", error = "" }) {
  if (!result) {
    return (
      <section className="app-panel min-h-[28rem] p-6">
        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-copy">Result Preview</h3>
          <span className="rounded-lg bg-elevated px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-copy/55">
            {state === "loading" ? "Running" : state === "error" ? "Error" : "Idle"}
          </span>
        </div>
        <EmptyState state={state} error={error} />
      </section>
    );
  }

  const keywords = Array.isArray(result.keywords)
    ? result.keywords
    : typeof result.keywords === "string"
      ? result.keywords
          .split(",")
          .map((keyword) => keyword.trim())
          .filter(Boolean)
      : [];
  const isSpam = result.result === "spam";
  const heroTone = isSpam
    ? "border-threat/20 bg-threat/10 text-threat"
    : "border-safe/20 bg-safe/10 text-safe";
  const HeroIcon = isSpam ? ShieldWarning : ShieldCheck;
  // Severity tone follows backend AI label prefixes: ALERT / CAUTION / SAFE.
  const aiLabelTone = String(result.ai_label || "").toUpperCase().startsWith("ALERT")
    ? "border-threat/25 bg-threat/10 text-threat"
    : String(result.ai_label || "").toUpperCase().startsWith("CAUTION")
      ? "border-[#f59e0b]/25 bg-[#f59e0b]/10 text-[#b45309]"
      : "border-line/20 bg-elevated-strong/80 text-copy/70";

  return (
    <section className="app-panel min-h-[28rem] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-2xl font-bold text-copy">Result Preview</h3>
        <span className="rounded-lg bg-elevated px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-copy/55">
          Live
        </span>
      </div>

      <div className={`mt-8 rounded-[24px] border p-5 ${heroTone}`}>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-shell/70">
            <HeroIcon size={24} weight="fill" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={result.result} />
              <span className="status-chip bg-shell/50 text-current">
                Confidence {formatConfidence(result.confidence)}
              </span>
            </div>
            <h4 className="mt-4 text-2xl font-extrabold text-copy">
              {isSpam ? "High-risk content detected" : "Message looks legitimate"}
            </h4>
            <p className="mt-2 text-sm leading-6 text-copy/80">
              {isSpam
                ? "The classifier found patterns commonly associated with phishing, scams, or unsolicited promotional traffic."
                : "The signal did not exceed the spam threshold, but you can still inspect the extracted context below."}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <span className="status-chip">{formatSourceLabel(result.source)}</span>
        <span className="status-chip">Record ID {result.id ?? "Pending"}</span>
        {result.username ? <span className="status-chip">@{result.username}</span> : null}
      </div>

      {result.ai_label ? (
        <div className="mt-4">
          <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${aiLabelTone}`}>
            AI Label: {result.ai_label}
          </span>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4">
        <div>
          <p className="text-sm font-semibold text-copy">
            {result.extracted_text ? "Extracted message" : "Message preview"}
          </p>
          <div className="mt-3 max-h-[220px] overflow-auto rounded-[20px] bg-elevated-strong/70 p-4 text-sm leading-7 text-copy break-words">
            {highlightKeywords(
              result.extracted_text || result.message || "",
              keywords,
            )}
          </div>
        </div>

        <div className="rounded-[24px] bg-surface/60 p-5">
          <p className="text-sm font-semibold text-copy">Flagged keywords</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {keywords.length ? (
              keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full bg-threat/10 px-3 py-2 text-xs font-semibold text-threat"
                >
                  {keyword}
                </span>
              ))
            ) : (
              <p className="text-sm text-muted">
                No keywords returned by the model for this result.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
