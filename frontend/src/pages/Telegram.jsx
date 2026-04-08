// frontend/src/pages/Telegram.jsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Wrench
} from "@phosphor-icons/react";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip,
} from "recharts";
import axios from "axios";

function DoubleBezelCard({ children, className = "" }) {
  return (
    <div className="p-1.5 rounded-[2rem] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:border dark:border-white/10 shadow-sm relative overflow-hidden h-full flex flex-col">
      <div className={`flex-1 rounded-[calc(2rem-0.375rem)] bg-white dark:bg-[#121212] shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] overflow-hidden relative flex flex-col ${className}`}>
        {children}
      </div>
    </div>
  );
}

export default function Telegram() {
  const [data, setData] = useState([]);
  const [topSpammers, setTopSpammers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Automation Settings State
  const [settings, setSettings] = useState({ max_strikes: 3, ban_duration_hours: 0 });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [msgRes, spammerRes, settingsRes] = await Promise.all([
          axios.get("http://localhost:8000/telegram/messages?limit=50"),
          axios.get("http://localhost:8000/telegram/spammers"),
          axios.get("http://localhost:8000/telegram/settings")
        ]);
        setData(msgRes.data.data || []);
        setTopSpammers(spammerRes.data.data || []);
        setSettings(settingsRes.data);
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
      await axios.put("http://localhost:8000/telegram/settings", settings);
      // Give a tiny delay for visual UI feedback
      setTimeout(() => setIsSaving(false), 500); 
    } catch (err) {
      console.error("Failed to update Auto-Ban settings", err);
      setIsSaving(false);
    }
  };

  const handleManualBan = async (chat_id, user_id) => {
    try {
      await axios.post("http://localhost:8000/telegram/ban", { chat_id, user_id });
      // Visually remove them from the leaderboard
      setTopSpammers(prev => prev.filter(s => s.user_id !== user_id));
    } catch (err) {
      console.error("Manual ban failed:", err);
    }
  };

   const handleManualUnban = async (chat_id, user_id) => {
    try {
      await axios.post("http://localhost:8000/telegram/unban", { chat_id, user_id });
      // Visually remove them from the dirty leaderboard
      setTopSpammers(prev => prev.filter(s => s.user_id !== user_id));
    } catch (err) {
      console.error("Manual pardon failed:", err);
    }
  };

  const spamMessages = data.filter((msg) => msg.result === "spam");
  const totalSpam = spamMessages.length;
  
  const chartData = [
    { name: "Mon", spam: 2 },
    { name: "Tue", spam: 4 },
    { name: "Wed", spam: Math.max(1, totalSpam - 6) },
    { name: "Thu", spam: Math.max(0, totalSpam - 4) },
    { name: "Fri", spam: totalSpam },
  ];

  const uniqueUsers = [...new Set(data.filter(m => m.username).map(m => m.username))];
  const activeUser = uniqueUsers.length > 0 ? `@${uniqueUsers[0]}` : "Awaiting Telemetry";

  return (
    <>
      <div className="min-h-[100dvh] w-full max-w-7xl mx-auto flex flex-col pt-12 pb-24">
        {/* 1. Header (System Live Removed!) */}
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
          
          <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 py-3 px-6 rounded-[2rem] ring-1 ring-black/5 dark:border dark:border-white/10">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-inner">
              <PaperPlaneRight weight="fill" size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-copy">{activeUser}</p>
              <p className="text-xs text-copy/60 font-medium">Primary Target</p>
            </div>
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
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <ShieldWarning size={20} weight="duotone" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-red-500 bg-red-500/10 px-3 py-1 rounded-full">
                  Total Captured
                </span>
              </div>
              <div>
                <p className="text-6xl font-mono font-bold tracking-tighter text-copy">
                  {isLoading ? "--" : totalSpam}
                </p>
                <p className="text-sm font-medium text-copy/60 mt-2">Threats Neutralized Today</p>
              </div>
            </DoubleBezelCard>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="md:col-span-8 md:row-span-2"
          >
            <DoubleBezelCard className="p-8 pb-0">
              <div className="flex justify-between items-end mb-8 relative z-10">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-copy">Daily Traffic Report</h2>
                  <p className="text-sm text-copy/50 mt-1">Spam frequency over the last 5 days</p>
                </div>
                <div className="flex items-center gap-2 text-emerald-500 text-sm font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-full">
                  <TrendUp size={16} weight="bold" />
                  <span>Stable</span>
                </div>
              </div>
              
              <div className="flex-1 w-full h-full min-h-[220px] -mx-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSpam" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', background: '#121212', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="spam" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSpam)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </DoubleBezelCard>
          </motion.div>

          {/* New Automation Control Panel */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="md:col-span-4"
          >
            <DoubleBezelCard className="p-6 lg:p-8 flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight mb-2 text-copy">Bot Automation Rules</h2>
                <p className="text-sm text-copy/60 mb-6">Current Enforcement Protocol</p>

                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-copy/80">Tolerance Level:</span>
                    <span className="font-mono font-bold text-primary">{settings.max_strikes} Strikes</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-copy/80">Ban Duration:</span>
                    <span className="font-mono font-bold text-red-500">
                      {settings.ban_duration_hours === 0 ? "Always" : `${settings.ban_duration_hours} Hours`}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="w-full mt-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-copy text-sm font-semibold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Wrench size={18} /> Modify Rules
              </button>
            </DoubleBezelCard>
          </motion.div>

          {/* Leaderboard Action Island */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="md:col-span-12 mt-2"
          >
            <DoubleBezelCard className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="flex-1">
                 <h2 className="text-xl font-semibold tracking-tight text-copy mb-2">Quick Actions</h2>
               </div>

               <div className="flex flex-col sm:flex-row items-center gap-4">
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="group relative flex items-center gap-3 p-4 px-6 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 active:scale-[0.98]"
                  >
                    <ShieldSlash size={22} className="text-red-500" />
                    <span className="text-sm font-medium text-copy">View Top Spammers</span>
                  </button>

                  <a 
                    href="https://web.telegram.org" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group relative flex items-center gap-3 p-4 px-6 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 active:scale-[0.98]"
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

      {/* --- MORPHING MODAL: TOP SPAMMERS LEADERBOARD --- */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              layoutId="quarantine-modal"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-2xl bg-white dark:bg-[#121212] border border-black/10 dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <ShieldSlash size={28} className="text-red-500" />
                  <h3 className="text-xl font-semibold text-copy tracking-tight">Active Spammers Leaderboard</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
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
                        className="flex items-center justify-between p-4 rounded-[1.5rem] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold shrink-0">
                            {offender.spam_count}
                          </div>
                          <div>
                            <p className="font-semibold text-copy bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-md inline-block mb-1">
                              @{offender.username}
                            </p>
                            <p className="text-[11px] text-copy/60 font-mono uppercase tracking-wider block">
                              UID: {offender.user_id}
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

            {/* --- MINI WINDOW: MODIFY RULES --- */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-sm bg-white dark:bg-[#121212] border border-black/10 dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden p-6 relative"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-primary">
                  <Wrench size={24} weight="duotone" />
                  <h3 className="text-xl font-semibold text-copy tracking-tight">Modify Rules</h3>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)} 
                  className="rounded-full p-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors text-copy"
                >
                   <X size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-copy/80">Max Strikes Allowed</label>
                  <input 
                    type="number" 
                    value={settings.max_strikes}
                    onChange={(e) => setSettings({...settings, max_strikes: parseInt(e.target.value) || 0})}
                    className="bg-black/5 dark:bg-white/5 p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary font-mono text-copy font-semibold"
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-copy/80">
                    Ban Hours (0 = Always)
                  </label>
                  <input 
                    type="number" 
                    value={settings.ban_duration_hours}
                    onChange={(e) => setSettings({...settings, ban_duration_hours: parseInt(e.target.value) || 0})}
                    className="bg-black/5 dark:bg-white/5 p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary font-mono text-copy font-semibold"
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
