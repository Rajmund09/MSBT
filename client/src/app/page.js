"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpRight, ArrowDownRight, Activity, Users, FileText,
  CalendarDays, TrendingUp, Zap, Clock
} from "lucide-react";
import { api } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton, Select } from "@/components/ui/index";

// ── Text Scramble / Decryption Effect ────────────────────────────────────────
const CHARS = "0123456789₹,.kLCr";

function useScramble(value, isScrambling) {
  const [display, setDisplay] = useState(String(value));
  const frameRef = useRef(null);
  const iterRef = useRef(0);

  useEffect(() => {
    const target = String(value);
    if (!isScrambling) {
      setDisplay(target);
      return;
    }
    iterRef.current = 0;
    const totalFrames = 18;

    const tick = () => {
      iterRef.current += 1;
      const progress = iterRef.current / totalFrames;
      const revealUpTo = Math.floor(progress * target.length);

      const scrambled = target
        .split("")
        .map((ch, i) => {
          if (i < revealUpTo) return ch;
          // Keep spaces, ₹ and punctuation readable while scrambling digits
          if (ch === " " || ch === "₹") return ch;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join("");

      setDisplay(scrambled);

      if (iterRef.current < totalFrames) {
        frameRef.current = setTimeout(tick, 35);
      } else {
        setDisplay(target);
      }
    };

    clearTimeout(frameRef.current);
    tick();
    return () => clearTimeout(frameRef.current);
  }, [value, isScrambling]);

  return display;
}

function ScrambleText({ value, scrambling, className }) {
  const display = useScramble(value, scrambling);
  return <span className={className}>{display}</span>;
}

const fmt = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;
const fmtShort = (n) => {
  n = Number(n || 0);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n}`;
};

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function MetricCard({ title, value, sub, icon, highlight, delay = 0, scrambling }) {
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
        <ScrambleText
          value={fmtShort(value)}
          scrambling={scrambling}
          className="font-mono font-medium text-3xl sm:text-4xl md:text-5xl tracking-tighter"
        />
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
  const [scrambling, setScrambling] = useState(false);

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
    setScrambling(true);
    const params = selectedSeasonId ? { seasonId: selectedSeasonId } : {};
    api.getDashboard(params)
      .then(d => {
        setData(d);
        setLoading(false);
        // Keep scrambling active for the animation duration after data arrives
        setTimeout(() => setScrambling(false), 700);
      })
      .catch(err => { setError(err.message); setLoading(false); setScrambling(false); });
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

  const displayName = user?.full_name || user?.username || "ADMIN";

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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="w-full md:w-64 shrink-0 flex flex-col gap-2 mt-4 md:mt-0"
        >
          <span className="font-mono text-[9px] sm:text-[10px] tracking-widest uppercase text-[var(--fg-muted)]">
            Season Filter
          </span>
          <Select
            value={selectedSeasonId}
            onChange={(e) => setSelectedSeasonId(e.target.value)}
            className="w-full"
          >
            <option value="">All Seasons</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </motion.div>
      </section>

      {/* Main Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Total Revenue" value={metrics.totalRevenue} icon={<ArrowUpRight />} delay={0} scrambling={scrambling} />
        <MetricCard title="Collected" value={metrics.totalCollections} icon={<Activity />} delay={0.1} scrambling={scrambling} />
        <MetricCard title="Outstanding" value={metrics.outstandingBalance} icon={<ArrowDownRight />} delay={0.2} highlight scrambling={scrambling} />
      </section>

      {/* Quick stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Today Revenue", value: fmtShort(today.revenue), icon: <TrendingUp size={14} /> },
          { label: "Today Collected", value: fmtShort(today.collections), icon: <Zap size={14} /> },
          { label: "Customers", value: String(metrics.customersCount), icon: <Users size={14} /> },
          { label: "Total Entries", value: String(metrics.entriesCount), icon: <FileText size={14} /> },
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
            <ScrambleText
              value={s.value}
              scrambling={scrambling}
              className="font-mono font-medium text-xl sm:text-2xl tracking-tighter"
            />
          </motion.div>
        ))}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-muted)] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Add Entry", desc: "Trips & Hours", href: "/entries", icon: <FileText size={18} />, textColor: "text-blue-500", bgColor: "bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/15", glow: "#3b82f6" },
            { label: "Record Payment", desc: "Collections", href: "/payments", icon: <Zap size={18} />, textColor: "text-green-500", bgColor: "bg-green-500/10 dark:bg-green-500/5 border border-green-500/15", glow: "#10b981" },
            { label: "New Customer", desc: "Directory", href: "/customers", icon: <Users size={18} />, textColor: "text-orange-500", bgColor: "bg-orange-500/10 dark:bg-orange-500/5 border border-orange-500/15", glow: "#f97316" },
            { label: "Generate Bill", desc: "Invoicing", href: "/billing", icon: <FileText size={18} />, textColor: "text-purple-500", bgColor: "bg-purple-500/10 dark:bg-purple-500/5 border border-purple-500/15", glow: "#a855f7" },
            { label: "Analytics", desc: "Performance", href: "/analytics", icon: <Activity size={18} />, textColor: "text-rose-500", bgColor: "bg-rose-500/10 dark:bg-rose-500/5 border border-rose-500/15", glow: "#f43f5e" },
          ].map((a, i) => (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.04, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={a.href}
                className="relative overflow-hidden flex flex-col justify-between gap-6 p-5 sm:p-6 rounded-3xl border border-[var(--border)] bg-white dark:bg-[#111] hover:bg-slate-500/5 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md group select-none"
              >
                {/* Background glow dynamic */}
                <div 
                  className="absolute -bottom-16 -right-16 w-32 h-32 rounded-full opacity-[0.02] group-hover:opacity-[0.12] blur-2xl transition-opacity duration-500" 
                  style={{ backgroundColor: a.glow }} 
                />
                
                {/* Header Icon + Action Arrow */}
                <div className="flex justify-between items-start w-full">
                  <div className={`p-3 rounded-2xl ${a.bgColor} ${a.textColor} transition-transform group-hover:scale-105 duration-300`}>
                    {a.icon}
                  </div>
                  <div className="text-[var(--fg-muted)] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <ArrowUpRight size={14} />
                  </div>
                </div>

                {/* Text Labels */}
                <div className="flex flex-col gap-1">
                  <h4 className="font-display font-medium text-sm sm:text-base text-[var(--fg)] tracking-tight leading-snug group-hover:font-semibold transition-all">
                    {a.label}
                  </h4>
                  <p className="font-mono text-[8px] sm:text-[9px] uppercase tracking-widest text-[var(--fg-muted)]">
                    {a.desc}
                  </p>
                </div>
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
