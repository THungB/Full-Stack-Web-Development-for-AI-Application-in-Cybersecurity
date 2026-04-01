import { Fragment } from "react";

export function formatPercent(value, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits,
  }).format(value || 0);
}

export function formatConfidence(value) {
  return formatPercent(value, 1);
}

export function formatInteger(value) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

export function formatCompactNumber(value) {
  const numeric = Number(value || 0);
  if (numeric < 1000) return formatInteger(numeric);

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(numeric);
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

export function formatShortDate(value) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatSourceLabel(value) {
  const normalized = String(value || "website").toLowerCase();
  const labels = {
    website: "Website",
    telegram: "Telegram",
    extension: "Extension",
    ocr: "OCR",
    batch: "Batch",
  };

  return labels[normalized] || "Website";
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
        className="rounded-md bg-threat/20 px-1 py-0.5 text-copy"
      >
        {part}
      </mark>
    );
  });
}
