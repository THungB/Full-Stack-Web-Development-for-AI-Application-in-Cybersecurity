// frontend/src/pages/Telegram.jsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ShieldWarning,
  PaperPlaneRight,
  ShieldCheck,
  TrendUp,
  XCircle,
  TelegramLogo,
  ArrowSquareOut,
  X,
  ShieldSlash,
  Gavel,
  Wrench,
  Clock
} from "@phosphor-icons/react";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid
} from "recharts";
import {
  getTelegramMessages,
  getTelegramSpammers,
  getTelegramSettings,
  updateTelegramSettings,
  manualTelegramBan,
  manualTelegramUnban,
  getTelegramTrafficReport,
} from "../services/api";

function DoubleBezelCard({ children, className = "" }) {
  return (
    <div className="h-full overflow-hidden rounded-[2rem] border border-line/25 bg-panel p-1 shadow-panel">
      <div className={`relative flex h-full flex-1 flex-col overflow-hidden rounded-[calc(2rem-0.375rem)] border border-line/15 bg-surface ${className}`}>
        {children}
      </div>
    </div>
  );
}

export default function Telegram() {
  // Dashboard state: message feed, moderation tables, and chart datasets.
  const [data, setData] = useState([]);
  const [topSpammers, setTopSpammers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [trafficDay, setTrafficDay] = useState([]);
  const [trafficMonth, setTrafficMonth] = useState([]);
  const [todaySpam, setTodaySpam] = useState(0);
  
  // Automation Settings State
  const [settings, setSettings] = useState({ max_strikes: 3, ban_duration_hours: 0, spam_decay_hours: 0 });
  const [isSaving, setIsSaving] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); 
    return () => clearInterval(timer);
  }, []);
  const liveTimeString = currentTime.toLocaleString("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit"
  }).replace(",", ""); // Format: DD/MM/YY HH:MM


  useEffect(() => {
    // Bootstrap all Telegram dashboard data from backend endpoints in parallel.
    const fetchDashboardData = async () => {
      try {
        const [msgRes, spammerRes, settingsRes, trafficRes] = await Promise.all([
          getTelegramMessages(1, 1, "spam"),
          getTelegramSpammers(),
          getTelegramSettings(),
          getTelegramTrafficReport("telegram"),
        ]);

        const daysArray = trafficRes.data.day || [];
        const currentTodaySpam = daysArray.length > 0 ? daysArray[daysArray.length - 1].spam : 0;

        setTodaySpam(currentTodaySpam);
        setData(msgRes.data.data || []);
        setTopSpammers(spammerRes.data.data || []);
        setSettings(settingsRes.data);
        setTrafficDay(trafficRes.data.day || []);
        setTrafficMonth(trafficRes.data.month || []);
      } catch (error) {
        console.error("Error fetching Telegram Hub data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Save Settings to Backend
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateTelegramSettings(settings);
      setTimeout(() => setIsSaving(false), 500); 
    } catch (err) {
      console.error("Failed to update Auto-Ban settings", err);
      setIsSaving(false);
    }
  };

  const handleManualBan = async (chat_id, user_id) => {
    try {
      await manualTelegramBan({ chat_id, user_id });
      setTopSpammers(prev => prev.filter(s => s.user_id !== user_id));
    } catch (err) {
      console.error("Manual ban failed:", err);
    }
  };

   const handleManualUnban = async (chat_id, user_id) => {
    try {
      await manualTelegramUnban({ chat_id, user_id });
      setTopSpammers(prev => prev.filter(s => s.user_id !== user_id));
    } catch (err) {
      console.error("Manual pardon failed:", err);
    }
  };

  const todayDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok", // Locks it strictly to GMT+7
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date());
  
const [chartView, setChartView] = useState("day");
  const chartData = chartView === "day" ? trafficDay : trafficMonth;

  const uniqueUsers = [...new Set(data.filter(m => m.username).map(m => m.username))];
  const activeUser = uniqueUsers.length > 0 ? `@${uniqueUsers[0]}` : "Awaiting Telemetry";
  const tooltipStyle = {
    borderRadius: "0.9rem",
    border: "1px solid rgb(var(--line) / 0.35)",
    background: "rgb(var(--panel))",
    boxShadow: "0 16px 34px rgba(15, 23, 42, 0.16)",
  };

  return (
    <>
      <div className="min-h-[100dvh] w-full max-w-7xl mx-auto flex flex-col pt-12 pb-24">
        {/* 1. Header */}
        <motion.div
          initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16"
        >
          <div>
            <h1 className="text-4xl md:text-6xl font-display font-semibold tracking-tighter leading-none text-copy mt-4">
              Telegram Control Panel
            </h1>
          </div>
        </motion.div>

        {/* 2. Asymmetrical Bento Layout Base */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 auto-rows-[240px]">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
            className="md:col-span-4"
          >
            <DoubleBezelCard className="p-8 justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-copy">Total Scan</h2>
              </div>
              <div>
                <p className="text-6xl font-mono font-bold tracking-tighter text-copy">
                  {isLoading ? "--" : todaySpam}
                </p>
                <p className="text-sm font-medium text-copy/60 mt-2">Total Spam Messages Detected  on {todayDate} <span className="opacity-75">(GMT+7)</span>
                </p>
              </div>
            </DoubleBezelCard>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="md:col-span-8 md:row-span-2"
          >
            <DoubleBezelCard className="p-8 pb-0">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="mt-2">
                  <h2 className="text-xl font-semibold tracking-tight text-copy">Data Report</h2>
                  <p className="text-sm text-copy/50 mt-1">Spam frequency over time on Telegram</p>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 text-copy/70 text-xs font-semibold uppercase tracking-wider bg-elevated px-3 py-1.5 rounded-full border border-line/30">
                    <Clock size={14} weight="bold" />
                    <span>{liveTimeString}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 bg-elevated p-1 rounded-lg border border-line/30 mt-1">
                    <button 
                      onClick={() => setChartView("day")}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${chartView === "day" ? "bg-primary text-white" : "text-copy/60 hover:text-copy"}`}
                    >
                      Day
                    </button>
                    <button 
                      onClick={() => setChartView("month")}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${chartView === "month" ? "bg-primary text-white" : "text-copy/60 hover:text-copy"}`}
                    >
                      Month
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 w-full h-[220px] -mx-2 mt-4 relative z-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                    <defs>
                      <linearGradient id="colorSpam" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line) / 0.2)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgb(var(--copy) / 0.4)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="rgb(var(--copy) / 0.4)" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                    
                    <Tooltip
                      contentStyle={tooltipStyle}
                      itemStyle={{ color: "rgb(var(--copy))" }}
                      labelStyle={{ color: "rgb(var(--muted))" }}
                    />
                    <Area type="monotone" dataKey="spam" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSpam)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </DoubleBezelCard>
          </motion.div>

                    {/* Control Panel */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="md:col-span-4"
          >
            <DoubleBezelCard className="p-5 lg:p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight mb-1 text-copy">Bot Rules</h2>
                <p className="text-sm text-copy/60 mb-4">Current Enforcement Protocol</p>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-copy/80">Max Spam Allowed:</span>
                    <span className="font-mono font-bold text-primary">{settings.max_strikes} Messages</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-copy/80">Ban Duration:</span>
                    <span className="font-mono font-bold text-red-500">
                      {settings.ban_duration_hours === 0 ? "Always" : `${settings.ban_duration_hours} Hours`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-copy/80">Reset Timer:</span>
                    <span className="font-mono font-bold text-emerald-500">
                      {settings.spam_decay_hours === 0 ? "Disabled" : `${settings.spam_decay_hours} Hours`}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-line/30 bg-elevated py-2.5 text-sm font-semibold text-copy transition-all hover:bg-elevated-strong active:scale-[0.98]"
              >
                <Wrench size={18} /> Modify Rules
              </button>
            </DoubleBezelCard>
          </motion.div>

          {/* Quick Action Table */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="md:col-span-12 mt-2"
          >
            <DoubleBezelCard className="p-8 flex flex-col w-full gap-5">
               <div className="w-full">
                 <h2 className="text-xl font-semibold tracking-tight text-copy mb-3">Quick Actions</h2>
                 <div className="h-px w-full bg-line/30 mb-2"></div>
               </div>
               <div className="flex flex-col sm:flex-row w-full gap-4">
                  <Link 
                    to="/history"
                    className="flex-1 group relative flex items-center justify-center gap-3 rounded-2xl border border-line/30 bg-elevated px-6 py-4 transition-all duration-300 hover:bg-elevated-strong active:scale-[0.98]"
                  >
                    <Clock size={22} className="text-emerald-500" />
                    <span className="text-sm font-medium text-copy">View History</span>
                  </Link>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex-1 group relative flex items-center justify-center gap-3 rounded-2xl border border-line/30 bg-elevated px-6 py-4 transition-all duration-300 hover:bg-elevated-strong active:scale-[0.98]"
                  >
                    <ShieldSlash size={22} className="text-red-500" />
                    <span className="text-sm font-medium text-copy">View Top Spammers</span>
                  </button>
                  <a 
                    href="https://web.telegram.org" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 group relative flex items-center justify-center gap-3 rounded-2xl border border-line/30 bg-elevated px-6 py-4 transition-all duration-300 hover:bg-elevated-strong active:scale-[0.98]"
                  >
                    <TelegramLogo size={22} className="text-[#2AABEE]" weight="fill" />
                    <span className="text-sm font-medium text-copy">Open Telegram</span>
                    <ArrowSquareOut size={14} className="text-copy/60 ml-2" />
                  </a>
               </div>
            </DoubleBezelCard>
          </motion.div>

        </div>
      </div>

      {/* Top Spammer Board */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-md sm:p-6"
          >
            <motion.div
              layoutId="quarantine-modal"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-line/30 bg-panel shadow-panel"
            >
              <div className="flex items-center justify-between border-b border-line/20 bg-elevated/70 p-6">
                <div className="flex items-center gap-3">
                  <ShieldSlash size={28} className="text-red-500" />
                  <h3 className="text-xl font-semibold text-copy tracking-tight">Active Spammers Leaderboard</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-line/30 bg-surface transition-colors hover:bg-elevated"
                >
                  <X size={20} className="text-copy" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-3">
                {topSpammers.length > 0 ? (
                  <AnimatePresence>
                    {topSpammers.map((offender) => (
                      <motion.div 
                        layout key={`offender-${offender.user_id}`}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, x: 50 }}
                        className="flex items-center justify-between rounded-[1.5rem] border border-line/25 bg-surface p-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold shrink-0">
                            {offender.spam_count}
                          </div>
                          <div>
                            <p className="mb-1 inline-block rounded-md border border-line/25 bg-elevated px-2 py-0.5 font-semibold text-copy">
                              @{offender.username}
                            </p>
                            <p className="text-[11px] text-copy/60 font-mono uppercase tracking-wider block">
                              UID: {offender.user_id}
                            </p>
                            <p className="text-[11px] text-red-500/90 font-mono tracking-wider block mt-1">
                              {offender.last_spam && offender.last_spam !== "Unknown" 
                                ? `LAST DETECTED: ${new Date(offender.last_spam).toLocaleString('en-GB')}` 
                                : "LAST DETECTED: Unknown Date"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="shrink-0 flex items-center gap-2">
                           <button 
                             onClick={() => handleManualUnban(offender.chat_id, offender.user_id)}
                             title="Forgive User & Reset Strikes to 0"
                             className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-500 transition-colors duration-300 text-xs font-bold active:scale-[0.95]"
                           >
                             <ShieldCheck size={16} weight="bold" /> Unban
                           </button>

                          <button 
                            onClick={() => handleManualBan(offender.chat_id, offender.user_id)}
                            title="Execute Force Ban"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 transition-colors duration-300 text-xs font-bold active:scale-[0.95]"
                          >
                            <Gavel size={16} weight="bold" /> Ban
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 flex flex-col items-center justify-center text-copy/50">
                    <ShieldCheck size={48} className="mb-4 opacity-50 text-emerald-500" />
                    <p className="font-medium text-lg">System Secure.</p>
                    <p className="text-sm mt-1">No repeat offenders detected in the database.</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

            {/* Modify Rules */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-md sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-line/30 bg-panel p-6 shadow-panel"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-primary">
                  <Wrench size={24} weight="duotone" />
                  <h3 className="text-xl font-semibold text-copy tracking-tight">Modify Rules</h3>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)} 
                  className="rounded-full border border-line/30 bg-surface p-2 text-copy transition-colors hover:bg-elevated"
                >
                   <X size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-copy/80">Max Spam Allowed</label>
                  <input 
                    type="number" 
                    value={settings.max_strikes}
                    onChange={(e) => setSettings({...settings, max_strikes: parseInt(e.target.value) || 0})}
                    className="rounded-xl border border-line/30 bg-elevated p-3 font-mono font-semibold text-copy outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-copy/80">
                    Reset Timer (0 = Disabled)
                  </label>
                  <input 
                    type="number" 
                    value={settings.spam_decay_hours}
                    onChange={(e) => setSettings({...settings, spam_decay_hours: parseInt(e.target.value) || 0})}
                    className="rounded-xl border border-line/30 bg-elevated p-3 font-mono font-semibold text-copy outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-[11px] text-copy/60 mt-1 italic pl-1">
                    * If they don't spam for this many hours, they reset to 0.
                  </p>
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-copy/80">
                    Ban Hours (0 = Always)
                  </label>
                  <input 
                    type="number" 
                    value={settings.ban_duration_hours}
                    onChange={(e) => setSettings({...settings, ban_duration_hours: parseInt(e.target.value) || 0})}
                    className="rounded-xl border border-line/30 bg-elevated p-3 font-mono font-semibold text-copy outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-[11px] text-copy/60 mt-1 italic pl-1">
                    * Note: Always means they are banned Forever.
                  </p>
                </div>

                <button 
                  onClick={() => { handleSaveSettings(); setIsSettingsOpen(false); }}
                  className="mt-4 w-full py-3.5 rounded-xl bg-blue-500 hover:bg-red-500 text-white text-sm font-bold transition-all duration-300 active:scale-[0.98]"
                >
                  Save & Apply Settings
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
