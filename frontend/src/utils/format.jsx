import { Fragment } from "react";

export function formatPercent(value) {
  return `${((value || 0) * 100).toFixed(1)}%`;
}

export function formatConfidence(value) {
  return `${((value || 0) * 100).toFixed(1)}%`;
}

export function formatDateTime(value) {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function truncateText(value, maxLength = 100) {
  if (!value) return "No message content";
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlightKeywords(text, keywords = []) {
  if (!text) return "No message body available.";
  const validKeywords = keywords.filter(Boolean);
  if (!validKeywords.length) return text;

  const pattern = new RegExp(
    `(${validKeywords.map(escapeRegExp).join("|")})`,
    "gi",
  );
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    const isKeyword = validKeywords.some(
      (keyword) => keyword.toLowerCase() === part.toLowerCase(),
    );

    if (!isKeyword) {
      return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
    }

    return (
      <mark
        key={`${part}-${index}`}
        className="rounded-md bg-signal/20 px-1 py-0.5 text-ink"
      >
        {part}
      </mark>
    );
  });
}
