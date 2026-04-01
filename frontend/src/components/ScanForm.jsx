import { useEffect, useState } from "react";
import {
  Broom,
  RocketLaunch,
  TextAlignLeft,
} from "@phosphor-icons/react";

const MAX_LENGTH = 2000;
const MIN_LENGTH = 10;

function validate(text) {
  if (!text.trim()) return "Message cannot be empty.";
  if (text.trim().length < MIN_LENGTH) {
    return `Message is too short (min ${MIN_LENGTH} characters).`;
  }
  if (text.length > MAX_LENGTH) {
    return `Message exceeds ${MAX_LENGTH} character limit.`;
  }
  return "";
}

export default function ScanForm({ onSubmit }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setError(validate(message));
  }, [message]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate(message);
    setError(validationError);

    if (validationError) return;

    setLoading(true);
    try {
      await onSubmit({ message: message.trim(), source: "website" });
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="app-panel-soft p-5 sm:p-6" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-bold text-copy">Manual Scan</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Paste suspicious content to run live heuristics against the spam classifier.
            </p>
          </div>
          <span className="status-chip">
            <TextAlignLeft size={14} />
            Markdown supported
          </span>
        </div>

        <label className="sr-only" htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          className="field-dark min-h-[320px] resize-y rounded-[24px] p-5"
          placeholder="Paste your message content here for real-time analysis..."
          value={message}
          onChange={(event) => setMessage(event.target.value.slice(0, MAX_LENGTH))}
          disabled={loading}
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {error ? (
              <p className="text-sm font-medium text-threat">{error}</p>
            ) : (
              <p className="text-sm text-muted">
                Character count: {message.length} / {MAX_LENGTH}. Source will be stored as Website.
              </p>
            )}
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button
              type="button"
              className="btn-secondary-dark min-w-[150px] rounded-xl"
              onClick={() => setMessage("")}
              disabled={loading || !message.length}
            >
              <Broom size={16} />
              Clear
            </button>
            <button
              type="submit"
              className="btn-primary-dark min-w-[180px] rounded-xl"
              disabled={loading || Boolean(error) || !message.trim()}
            >
              <RocketLaunch size={16} weight="bold" />
              {loading ? "Scanning..." : "Initiate Analysis"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
