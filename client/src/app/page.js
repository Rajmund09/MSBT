"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We are mocking a user session for the demo as before
    api.getDashboard()
      .then(d => { setData(d); setLoading(false); })
      .catch(() => {
        // Mock fallback if backend is down
        setData({
          totalRevenue: 4528000,
          totalCollected: 3150000,
          totalOutstanding: 1378000,
          customersCount: 142,
          topDebtors: [
            { name: "Ramesh Singh", village: "Khandagiri", amount: 45000 },
            { name: "Pratap Traders", village: "Nayagarh", amount: 32000 },
            { name: "Kalinga Stores", village: "Cuttack", amount: 28500 }
          ]
        });
        setLoading(false);
      });
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  if (loading) return null;

  return (
    <motion.main 
      variants={container}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, y: -20, transition: { duration: 0.5 } }}
      className="container mx-auto px-6 md:px-12 flex flex-col"
    >
      {/* Hero Header */}
      <motion.section variants={item} className="mb-32 mt-12 md:mt-24 max-w-5xl">
        <h1 className="text-hero mb-6">
          <span className="block overflow-hidden">
            <motion.span className="block" variants={item}>Operating</motion.span>
          </span>
          <span className="block overflow-hidden">
            <motion.span className="block italic opacity-90" variants={item}>System ©</motion.span>
          </span>
        </h1>
        <motion.p variants={item} className="text-xl md:text-2xl font-mono tracking-wide text-[var(--fg-muted)] max-w-2xl leading-relaxed">
          Digital ledger and enterprise resource planning for Mahalaxmi Samprat Behara Traders. Monitoring <span className="text-[var(--fg)]">{data.customersCount}</span> active accounts and seasonal trip logs.
        </motion.p>
      </motion.section>

      {/* Cinematic Metric Cards */}
      <motion.section variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-32">
        <MetricCard 
          title="Total Revenue" 
          value={data.totalRevenue} 
          icon={<ArrowUpRight className="text-white/40" />} 
          delay={0}
        />
        <MetricCard 
          title="Collected" 
          value={data.totalCollected} 
          icon={<Activity className="text-white/40" />} 
          delay={0.1}
        />
        <MetricCard 
          title="Outstanding" 
          value={data.totalOutstanding} 
          icon={<ArrowDownRight className="text-white/40" />} 
          delay={0.2}
          highlight
        />
      </motion.section>

      {/* Shared Layout Table Example */}
      <motion.section variants={item} className="mb-32">
        <div className="flex items-end justify-between mb-12 border-b border-[var(--border)] pb-6">
          <h2 className="text-4xl md:text-5xl font-display">Attention Required</h2>
          <span className="font-mono text-xs tracking-widest uppercase text-[var(--fg-muted)]">Top Debtors</span>
        </div>
        
        <div className="flex flex-col gap-4">
          {data.topDebtors.map((debtor, i) => (
            <motion.div 
              key={i}
              layoutId={`debtor-${i}`}
              className="group flex items-center justify-between p-6 rounded-2xl bg-[var(--fg)]/5 border border-[var(--border)] hover:bg-[var(--fg)]/10 transition-colors cursor-pointer"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-8">
                <span className="font-mono text-xs text-[var(--fg)] opacity-20 w-8">0{i+1}</span>
                <span className="font-display text-2xl group-hover:italic transition-all">{debtor.name}</span>
                <span className="font-mono text-xs uppercase tracking-wider text-[var(--fg-muted)] hidden md:block">{debtor.village}</span>
              </div>
              <span className="font-mono text-lg">₹{debtor.amount.toLocaleString('en-IN')}</span>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </motion.main>
  );
}

function MetricCard({ title, value, icon, delay, highlight }) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className={`relative overflow-hidden p-8 rounded-3xl border ${highlight ? 'border-[var(--fg)]/20 bg-[var(--fg)]/5' : 'border-[var(--border)] bg-[var(--fg)]/[0.02]'} flex flex-col gap-12`}
    >
      <div className="flex justify-between items-start">
        <span className="font-mono text-xs tracking-widest uppercase text-[var(--fg-muted)]">{title}</span>
        <div className="opacity-40">{icon}</div>
      </div>
      <div className="font-display text-5xl md:text-6xl tracking-tight">
        ₹{(value / 1000).toFixed(1)}k
      </div>
      
      {/* Subtle cinematic gradient orb */}
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[var(--fg)] opacity-5 rounded-full blur-3xl pointer-events-none" />
    </motion.div>
  );
}
