"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpRight, ArrowDownRight, Activity, Users, FileText,
  CalendarDays, TrendingUp, Zap, Clock
} from "lucide-react";
import { api } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/index";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtShort = (n) => {
  n = Number(n || 0);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n}`;
};

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function MetricCard({ title, value, sub, icon, highlight, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`relative overflow-hidden p-6 md:p-8 rounded-3xl border cursor-pointer transition-all ${
        highlight
          ? "border-[var(--fg)]/20 bg-[var(--fg)]/5 shadow-sm"
          : "border-[var(--border)] bg-white dark:bg-[#111] shadow-sm hover:shadow-md"
      } flex flex-col gap-8`}
    >
      <div className="flex justify-between items-start">
        <span className="font-mono text-[9px] sm:text-[10px] tracking-widest uppercase text-[var(--fg-muted)]">{title}</span>
        <div className="opacity-30 hidden sm:block">{icon}</div>
      </div>
      <div>
        <div className="font-mono font-medium text-3xl sm:text-4xl md:text-5xl tracking-tighter">{fmtShort(value)}</div>
        {sub && <div className="font-mono text-xs text-[var(--fg-muted)] mt-1">{sub}</div>}
      </div>
      <motion.div
        className="absolute -bottom-20 -right-20 w-40 h-40 bg-[var(--fg)] opacity-[0.04] rounded-full blur-3xl pointer-events-none"
        whileHover={{ scale: 1.5 }}
        transition={{ duration: 0.5 }}
      />
    </motion.div>
  );
}

const MotionGraphicName = ({ text }) => {
  const characters = text.split("");

  return (
    <motion.h1
      className="text-hero uppercase tracking-tighter flex flex-wrap items-center leading-none"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.05, delayChildren: 0.2 },
        },
      }}
    >
      {characters.map((char, index) => (
        <span
          key={index}
          className="inline-flex overflow-hidden pt-1 pb-4 -mb-4"
          style={{ paddingRight: char === " " ? "0.2em" : "0" }}
        >
          <motion.span
            variants={{
              hidden: { y: "100%", opacity: 0 },
              visible: { 
                y: "0%", 
                opacity: 1,
                transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] }
              },
            }}
            className="inline-block"
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        </span>
      ))}
    </motion.h1>
  );
};

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-44" />)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [time, setTime] = useState(new Date());
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");

  const getGreeting = () => {
    const hour = time.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    api.getSeasons().then(s => setSeasons(s)).catch(() => {});
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setLoading(true);
    api.getDashboard(selectedSeasonId)
      .then(d => { setData(d); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [selectedSeasonId]);

  if (loading && !data) {
    return (
      <main className="container mx-auto px-4 sm:px-6 md:px-12">
        <DashboardSkeleton />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="container mx-auto px-4 sm:px-6 md:px-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="font-display text-3xl text-[var(--fg-muted)] mb-4">Backend Offline</p>
          <p className="font-mono text-xs text-[var(--fg-muted)]">{error || "Could not reach the server."}</p>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-3 rounded-xl border border-[var(--border)] font-mono text-xs uppercase tracking-widest hover:bg-white/5 transition-all">
            Retry
          </button>
        </div>
      </main>
    );
  }

  const { metrics, today, activeSeason, topOutstandingCustomers } = data;

  const displayName = user?.fullName === "Sri Mahalaxmi Behara" ? "Samprat Behera" : (user?.fullName || user?.username || "Samprat Behera");

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 sm:px-6 md:px-12 flex flex-col gap-14"
    >
      {/* Hero */}
      <section className="mt-4 md:mt-12 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-col mb-8 sm:mb-10 w-full">
            <h2 className="font-display italic text-xl sm:text-2xl md:text-3xl text-[var(--fg-muted)] mb-[-0.2em]">
              {getGreeting()},
            </h2>
            <MotionGraphicName text={displayName} />
            
            <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-4 text-[var(--fg-muted)] font-mono text-[9px] sm:text-[10px] tracking-widest uppercase">
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="opacity-50" />
                <span className="text-[var(--fg)]">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <span className="opacity-30">—</span>
              <span>{DAYS[time.getDay()]}, {time.getDate()} {MONTHS[time.getMonth()]} {time.getFullYear()}</span>
              <span className="opacity-30 hidden sm:inline">—</span>
              <span className="w-full sm:w-auto">31°C, Partly Cloudy</span>
            </div>
          </div>
          <p className="font-mono text-sm text-[var(--fg-muted)] max-w-xl">
            You have <span className="text-[var(--fg)]">{metrics.customersCount} active customers</span> and <span className="text-[var(--fg)]">{metrics.entriesCount} entries logged</span>.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.5, delay: 0.3 }}
          className="shrink-0"
        >
          <div className="relative group">
            <select
              value={selectedSeasonId}
              onChange={(e) => setSelectedSeasonId(e.target.value)}
              className="appearance-none bg-white dark:bg-[#111] border border-[var(--border)] text-[var(--fg)] text-xs font-mono uppercase tracking-widest px-4 py-2.5 pr-10 rounded-xl outline-none focus:ring-2 focus:ring-[var(--fg)]/20 shadow-sm cursor-pointer hover:shadow-md transition-all"
            >
              <option value="">All Seasons</option>
              {seasons.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--fg-muted)] group-hover:text-[var(--fg)] transition-colors">
              <CalendarDays size={14} />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Main Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Total Revenue" value={metrics.totalRevenue} icon={<ArrowUpRight />} delay={0} />
        <MetricCard title="Collected" value={metrics.totalCollections} icon={<Activity />} delay={0.1} />
        <MetricCard title="Outstanding" value={metrics.outstandingBalance} icon={<ArrowDownRight />} delay={0.2} highlight />
      </section>

      {/* Quick stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Today Revenue", value: fmtShort(today.revenue), icon: <TrendingUp size={14} /> },
          { label: "Today Collected", value: fmtShort(today.collections), icon: <Zap size={14} /> },
          { label: "Customers", value: metrics.customersCount, icon: <Users size={14} /> },
          { label: "Total Entries", value: metrics.entriesCount, icon: <FileText size={14} /> },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-2 sm:gap-3 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111] shadow-sm border border-[var(--border)] hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 text-[var(--fg-muted)]">
              {s.icon}
              <span className="font-mono text-[8px] sm:text-[10px] uppercase tracking-widest leading-tight">{s.label}</span>
            </div>
            <span className="font-mono font-medium text-xl sm:text-2xl tracking-tighter">{s.value}</span>
          </motion.div>
        ))}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-muted)] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Add Entry", href: "/entries", icon: <FileText size={18} />, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
            { label: "Record Payment", href: "/payments", icon: <Zap size={18} />, color: "bg-green-500/10 text-green-500 border-green-500/20" },
            { label: "New Customer", href: "/customers", icon: <Users size={18} />, color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
            { label: "Generate Bill", href: "/billing", icon: <FileText size={18} />, color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
            { label: "Analytics", href: "/analytics", icon: <Activity size={18} />, color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
          ].map((a, i) => (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.04 }}
            >
              <Link
                href={a.href}
                className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-[var(--border)] bg-white dark:bg-[#111] hover:bg-[var(--fg)]/5 hover:-translate-y-1 transition-all cursor-pointer shadow-sm group"
              >
                <div className={`p-3 rounded-full ${a.color} group-hover:scale-110 transition-transform`}>
                  {a.icon}
                </div>
                <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-center">{a.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Top Debtors */}
      <section className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-0"
        >
          <div className="flex items-end justify-between mb-6 border-b border-[var(--border)] pb-4">
            <h2 className="font-display text-2xl">Attention Required</h2>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">Top Due</span>
          </div>
          {topOutstandingCustomers.length === 0 ? (
            <p className="font-mono text-xs text-[var(--fg-muted)]">No outstanding balances. 🎉</p>
          ) : (
            <div className="flex flex-col gap-2">
              {topOutstandingCustomers.map((c, i) => (
                <Link key={c.id} href={`/customers/${c.id}`}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.05 }}
                    className="flex justify-between items-center p-4 rounded-xl border border-[var(--border)] bg-white dark:bg-[#111] shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div>
                      <h4 className="font-display group-hover:italic transition-all">{c.name}</h4>
                      <div className="font-mono text-[10px] text-[var(--fg-muted)] mt-1">{c.village}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-medium text-sm text-red-500">{fmt(c.outstanding)}</div>
                      <div className="font-mono text-[10px] text-[var(--fg-muted)] mt-1">Due</div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </section>
    </motion.main>
  );
}
