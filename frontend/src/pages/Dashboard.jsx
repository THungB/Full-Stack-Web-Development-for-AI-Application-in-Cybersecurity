import { startTransition, useEffect, useState } from "react";
import { useToast } from "../components/ToastProvider";
import ActivityChart from "../components/Charts/ActivityChart";
import ConfidenceChart from "../components/Charts/ConfidenceChart";
import SpamRatioChart from "../components/Charts/SpamRatioChart";
import SummaryCards from "../components/SummaryCards";
import SystemStatus from "../components/SystemStatus";
import { getStats } from "../services/api";

const defaultStats = {
  spam_count: 0,
  ham_count: 0,
  daily_stats: [],
  buckets: [],
};

export default function Dashboard() {
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;

    const fetchStats = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getStats();
        if (!active) return;

        startTransition(() => {
          setStats({
            spam_count: response.data.spam_count ?? 0,
            ham_count: response.data.ham_count ?? 0,
            daily_stats: response.data.daily_stats ?? [],
            buckets: response.data.buckets ?? response.data.confidence_buckets ?? [],
          });
        });
      } catch (requestError) {
        if (!active) return;

        const message =
          requestError.response?.data?.detail ||
          "Unable to load dashboard statistics.";
        setError(message);
        showToast({
          tone: "error",
          title: "Dashboard unavailable",
          description: message,
        });
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchStats();

    return () => {
      active = false;
    };
  }, [showToast]);

  const totalScans = stats.spam_count + stats.ham_count;
  const highConfidenceBucket = stats.buckets.find((bucket) =>
    String(bucket.range).includes("80-100"),
  );
  const highConfidenceSignals =
    (highConfidenceBucket?.spam ?? 0) + (highConfidenceBucket?.ham ?? 0);
  const highConfidenceShare = totalScans
    ? highConfidenceSignals / totalScans
    : 0;

  return (
    <div className="space-y-6">
      <section className="enter-fade grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="app-panel p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copy/50">
              Dashboard
            </p>
            <span className="status-chip border-primary/25 bg-primary/10 text-primary">
              Live monitoring
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-copy sm:text-3xl">
            Threat operations control center
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
            Track ingestion health, classification quality, and confidence shifts across
            Website, Telegram, OCR, Extension, and Batch workflows.
          </p>
        </div>
        <div>
          <SystemStatus />
        </div>
      </section>

      {error ? (
        <div className="app-panel border border-threat/35 bg-threat/10 p-5 text-threat">
          <p className="font-semibold">Dashboard data could not be loaded.</p>
          <p className="mt-2 text-sm text-copy/75">
            Check that FastAPI is running and that `VITE_API_BASE_URL` points to
            the backend.
          </p>
        </div>
      ) : null}

      <SummaryCards stats={stats} highConfidenceShare={highConfidenceShare} />

      <section className="enter-fade grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <SpamRatioChart
          spamCount={stats.spam_count}
          hamCount={stats.ham_count}
        />
        <ActivityChart data={stats.daily_stats} />
      </section>

      <ConfidenceChart data={stats.buckets} />

      {loading ? (
        <div className="app-panel enter-fade p-5">
          <p className="text-sm font-medium text-muted">
            Loading the latest chart data from the backend...
          </p>
        </div>
      ) : null}
    </div>
  );
}
