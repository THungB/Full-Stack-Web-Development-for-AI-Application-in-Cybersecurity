import { useEffect, useState } from "react";

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
    <form className="soft-panel p-5 sm:p-6" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-steel">
              Manual Scan
            </p>
            <h3 className="mt-2 text-2xl font-bold">Paste a message to inspect</h3>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-steel">
            {message.length} / {MAX_LENGTH}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="chip bg-white text-steel">Trim whitespace</span>
          <span className="chip bg-white text-steel">Min 10 chars</span>
          <span className="chip bg-white text-steel">Max 2000 chars</span>
        </div>

        <label className="sr-only" htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          className="field min-h-[220px] resize-y"
          placeholder="Paste suspicious email, SMS, or chat content here..."
          value={message}
          onChange={(event) => setMessage(event.target.value.slice(0, MAX_LENGTH))}
          disabled={loading}
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {error ? (
              <p className="text-sm font-medium text-danger">{error}</p>
            ) : (
              <p className="text-sm text-steel">
                The model checks the message and returns confidence plus flagged
                keywords.
              </p>
            )}
          </div>
          <button
            type="submit"
            className="btn-primary min-w-[180px] w-full sm:w-auto"
            disabled={loading || Boolean(error) || !message.trim()}
          >
            {loading ? "Scanning..." : "Scan Message"}
          </button>
        </div>
      </div>
    </form>
  );
}
