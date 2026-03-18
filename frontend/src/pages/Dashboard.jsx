import { startTransition, useEffect, useState } from "react";
import { useToast } from "../components/ToastProvider";
import ActivityChart from "../components/Charts/ActivityChart";
import ConfidenceChart from "../components/Charts/ConfidenceChart";
import SpamRatioChart from "../components/Charts/SpamRatioChart";
import SectionHeading from "../components/SectionHeading";
import SummaryCards from "../components/SummaryCards";
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

  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden p-6 sm:p-8">
        <SectionHeading
          eyebrow="Threat Overview"
          title="One dashboard for every spam signal"
          description="Track spam-to-ham ratio, daily model activity, and confidence distribution with a front-end tuned for your Assignment 3 architecture."
        />
      </section>

      {error ? (
        <div className="rounded-[28px] border border-danger/20 bg-white/90 p-5 text-danger">
          <p className="font-semibold">Dashboard data could not be loaded.</p>
          <p className="mt-2 text-sm text-danger/80">
            Check that FastAPI is running and that `VITE_API_BASE_URL` points to
            the backend.
          </p>
        </div>
      ) : null}

      <SummaryCards stats={stats} />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SpamRatioChart
          spamCount={stats.spam_count}
          hamCount={stats.ham_count}
        />
        <ActivityChart data={stats.daily_stats} />
      </section>

      <ConfidenceChart data={stats.buckets} />

      {loading ? (
        <div className="panel p-5">
          <p className="text-sm font-medium text-steel">
            Loading the latest chart data from the backend...
          </p>
        </div>
      ) : null}
    </div>
  );
}
