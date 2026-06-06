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
      className={`relative overflow-hidden p-6 md:p-8 rounded-3xl border cursor-pointer transition-colors ${
        highlight
          ? "border-[var(--fg)]/20 bg-[var(--fg)]/5"
          : "border-[var(--border)] bg-[var(--fg)]/[0.02]"
      } flex flex-col gap-8`}
    >
      <div className="flex justify-between items-start">
        <span className="font-mono text-[10px] tracking-widest uppercase text-[var(--fg-muted)]">{title}</span>
        <div className="opacity-30">{icon}</div>
      </div>
      <div>
        <div className="font-display text-4xl md:text-5xl tracking-tight">{fmtShort(value)}</div>
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

  const getGreeting = () => {
    const hour = time.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    api.getDashboard()
      .then(d => { setData(d); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
      
    return () => clearInterval(timer);
  }, []);

  if (loading) {
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
      <section className="mt-4 md:mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-6">
            {activeSeason && (
              <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-mono uppercase tracking-widest">
                {activeSeason.name}
              </span>
            )}
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10 w-full">
            <div className="flex flex-col items-start">
              <h2 className="font-display italic text-2xl md:text-3xl text-[var(--fg-muted)] mb-[-0.2em]">
                {getGreeting()},
              </h2>
              <MotionGraphicName text={displayName} />
            </div>

            <div className="flex flex-col text-[var(--fg-muted)] font-mono text-[10px] md:text-xs tracking-[0.2em] uppercase leading-loose border-l border-[var(--border)] pl-4 md:pl-6">
              <span>{DAYS[time.getDay()]}, {time.getDate()} {MONTHS[time.getMonth()]} {time.getFullYear()}</span>
              <span className="text-[var(--fg)] font-medium">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span>31°C, PARTLY CLOUDY</span>
            </div>
          </div>
          <p className="font-mono text-sm text-[var(--fg-muted)] max-w-xl">
            You have <span className="text-[var(--fg)]">{metrics.customersCount} active customers</span> and <span className="text-[var(--fg)]">{metrics.entriesCount} entries logged</span>.
          </p>
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
            className="flex flex-col gap-3 p-5 rounded-2xl bg-[var(--fg)]/[0.025] border border-[var(--border)]"
          >
            <div className="flex items-center gap-2 text-[var(--fg-muted)]">
              {s.icon}
              <span className="font-mono text-[10px] uppercase tracking-widest">{s.label}</span>
            </div>
            <span className="font-display text-2xl">{s.value}</span>
          </motion.div>
        ))}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-muted)] mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Add Entry", href: "/entries" },
            { label: "Record Payment", href: "/payments" },
            { label: "New Customer", href: "/customers" },
            { label: "View Analytics", href: "/analytics" },
            { label: "Generate Bill", href: "/billing" },
          ].map((a, i) => (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.04 }}
            >
              <Link
                href={a.href}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border)] font-mono text-xs uppercase tracking-widest hover:bg-[var(--fg)]/5 hover:border-[var(--fg)]/20 transition-all"
              >
                {a.label}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Top Debtors */}
      <section className="max-w-4xl">
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
                    className="flex justify-between items-center p-4 rounded-xl border border-[var(--border)] bg-[var(--fg)]/[0.02] hover:bg-[var(--fg)]/[0.05] transition-all cursor-pointer group"
                  >
                    <div>
                      <h4 className="font-display group-hover:italic transition-all">{c.name}</h4>
                      <div className="font-mono text-[10px] text-[var(--fg-muted)] mt-1">{c.village}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm text-red-400">{fmt(c.outstanding)}</div>
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
