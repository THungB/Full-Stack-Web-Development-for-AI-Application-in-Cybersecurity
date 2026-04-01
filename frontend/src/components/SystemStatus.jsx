import { useEffect, useState } from "react";
import {
  CloudWarning,
  Lightning,
  SpinnerGap,
} from "@phosphor-icons/react";
import { getHealth } from "../services/api";

const sourceItems = ["Website", "Telegram", "Extension", "OCR", "Batch"];

function getEndpointLabel() {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:8000";

  try {
    return new URL(raw).host;
  } catch {
    return raw.replace(/^https?:\/\//, "");
  }
}

export default function SystemStatus({ variant = "pill" }) {
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

  const endpoint = getEndpointLabel();
  const isOnline = status === "online";
  const isOffline = status === "offline";
  const toneClass = isOnline
    ? "border-safe/20 bg-safe/10 text-safe shadow-glow"
    : isOffline
      ? "border-threat/20 bg-threat/10 text-threat"
      : "border-primary/20 bg-primary/10 text-primary";
  const dotClass = isOnline
    ? "bg-safe"
    : isOffline
      ? "bg-threat"
      : "bg-primary";
  const HeroIcon = isOnline
    ? Lightning
    : isOffline
      ? CloudWarning
      : SpinnerGap;
  const heroTitle = isOnline
    ? "Optimal Security"
    : isOffline
      ? "Visibility Degraded"
      : "Synchronizing Signals";
  const buttonCopy = isOnline
    ? "API Online"
    : isOffline
      ? "API Offline"
      : "Checking API";

  if (variant === "hero") {
    return (
      <section className="app-panel glass-panel flex min-h-[136px] items-center gap-4 p-5 shadow-glow">
        <div>
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-safe/10 text-safe">
            <HeroIcon
              size={24}
              weight={isOnline ? "fill" : "bold"}
              className={!isOnline && !isOffline ? "animate-spin" : ""}
            />
            <span
              className={`absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-panel ${dotClass}`}
            />
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-safe">
            System Pulse
          </p>
          <h3 className="mt-1 text-2xl font-bold text-copy">{heroTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{message}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={`status-chip ${toneClass}`}>{buttonCopy}</span>
            <span className="status-chip">{endpoint}</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div
      className={`glass-panel flex flex-wrap items-center gap-4 rounded-2xl border px-4 py-3 ${toneClass}`}
    >
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
        <span className="text-xs font-bold uppercase tracking-[0.2em]">
          System Pulse
        </span>
      </div>
      <div className="hidden h-5 w-px bg-line/30 sm:block" />
      <div className="text-xs text-copy/80">
        API:{" "}
        <span className="font-semibold text-copy">
          {buttonCopy.replace("API ", "")}
        </span>
        {" • "}Endpoint: <span className="font-semibold text-copy">{endpoint}</span>
      </div>
      <div className="hidden min-[1320px]:flex min-[1320px]:flex-wrap min-[1320px]:gap-2">
        {sourceItems.map((item) => (
          <span key={item} className="status-chip bg-elevated-strong/70 text-copy/75">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
