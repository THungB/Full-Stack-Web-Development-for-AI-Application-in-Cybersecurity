import { useEffect, useState } from "react";
import { getHealth } from "../services/api";

const sourceItems = ["Website", "Telegram", "Extension", "OCR"];

export default function SystemStatus() {
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("Checking backend availability...");

  useEffect(() => {
    let active = true;

    const checkHealth = async () => {
      try {
        await getHealth();
        if (!active) return;
        setStatus("online");
        setMessage("Backend API is reachable and ready for live scans.");
      } catch (error) {
        if (!active) return;
        setStatus("offline");
        setMessage(
          error.response?.data?.detail ||
            "Backend is offline. Start FastAPI to enable live data.",
        );
      }
    };

    checkHealth();
    const intervalId = window.setInterval(checkHealth, 15000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const tone =
    status === "online"
      ? "border-safe/20 bg-safe/10 text-safe"
      : status === "offline"
        ? "border-danger/20 bg-danger/10 text-danger"
        : "border-signal/20 bg-signal/10 text-signal";

  return (
    <section className="panel overflow-hidden p-5 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="section-kicker">System Pulse</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className={`chip border ${tone}`}>
              {status === "online"
                ? "API Online"
                : status === "offline"
                  ? "API Offline"
                  : "Checking API"}
            </span>
            <span className="chip break-all bg-white text-[11px] text-steel sm:text-xs">
              {import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}
            </span>
          </div>
          <p className="mt-4 text-sm leading-7 text-steel">{message}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {sourceItems.map((item) => (
            <span key={item} className="chip border border-ink/10 bg-[#faf6ed] text-ink">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
