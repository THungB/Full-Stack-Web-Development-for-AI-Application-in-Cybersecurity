import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Scan = lazy(() => import("./pages/Scan"));
const History = lazy(() => import("./pages/History"));
const Telegram = lazy(() => import("./pages/Telegram"));

export default function App() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="app-panel p-5">
            <p className="text-sm font-medium text-muted">
              Loading interface...
            </p>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/history" element={<History />} />
          <Route path="/telegram" element={<Telegram />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
