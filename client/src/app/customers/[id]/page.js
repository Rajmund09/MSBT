"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Phone, MapPin, FileText, Wallet, Calendar, Download } from "lucide-react";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, Skeleton, EmptyState } from "@/components/ui/index";
import { exportToExcel, exportToCSV } from "@/utils/export";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function LedgerSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function CustomerLedger() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  
  const [customer, setCustomer] = useState(null);
  const [entries, setEntries] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [cRes, eRes, pRes] = await Promise.all([
        api.getCustomer(id),
        api.getEntries({ customerId: id }),
        api.getPayments({ customerId: id })
      ]);
      setCustomer(cRes.customer);
      setEntries(eRes);
      setPayments(pRes);
    } catch (err) {
      toast("Failed to load customer data", "error");
      router.push("/customers");
    } finally {
      setLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalRevenue = entries.reduce((s, e) => s + (e.total_amount || 0), 0);
  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const outstanding = totalRevenue - totalPaid;

  // Merge and sort transactions
  const transactions = [
    ...entries.map(e => ({
      ...e,
      date: new Date(e.entry_date),
      type: "entry",
      amount: e.total_amount,
      desc: `${e.entry_type} (${e.quantity} @ ${fmt(e.rate)}) - ${e.season_name}`
    })),
    ...payments.map(p => ({
      ...p,
      date: new Date(p.payment_date),
      type: "payment",
      amount: p.amount,
      desc: `Payment via ${p.payment_mode} - ${p.season_name}`
    }))
  ].sort((a, b) => b.date - a.date);

  const handleExport = (type) => {
    const data = transactions.map(t => ({
      Date: fmtDate(t.date),
      Type: t.type === "entry" ? "Charge" : "Payment",
      Description: t.desc,
      Amount: t.amount,
      Season: t.season_name
    }));
    
    if (type === "csv") exportToCSV(data, `MSBT_${customer.name}_Ledger`);
    else exportToExcel(data, `MSBT_${customer.name}_Ledger`);
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 sm:px-6 md:px-12">
        <LedgerSkeleton />
      </main>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 sm:px-6 md:px-12 flex flex-col gap-8 pb-12"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => router.back()}
            className="w-fit flex items-center gap-2 text-[var(--fg-muted)] hover:text-[var(--fg)] font-mono text-xs uppercase tracking-widest transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </button>
          
          <div>
            <h1 className="font-display text-4xl mb-2">{customer.name}</h1>
            <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-[var(--fg-muted)]">
              <span className="flex items-center gap-1.5"><Phone size={12} /> {customer.phone}</span>
              <span className="flex items-center gap-1.5"><MapPin size={12} /> {customer.village}</span>
              {customer.status === "inactive" && (
                <span className="px-2 py-0.5 rounded border border-red-500/20 bg-red-500/10 text-red-400">INACTIVE</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => handleExport("csv")} className="h-10 px-4 rounded-xl border border-[var(--border)] font-mono text-xs uppercase tracking-widest text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--fg)]/5 transition-all inline-flex items-center gap-2">
            <Download size={14} /> CSV
          </button>
          <button onClick={() => handleExport("excel")} className="h-10 px-4 rounded-xl border border-[var(--border)] font-mono text-xs uppercase tracking-widest text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--fg)]/5 transition-all inline-flex items-center gap-2">
            <Download size={14} /> Excel
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-[var(--fg)]/[0.02] border border-[var(--border)] flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">Total Revenue</span>
          <span className="font-display text-3xl">{fmt(totalRevenue)}</span>
        </div>
        <div className="p-6 rounded-3xl bg-[var(--fg)]/[0.02] border border-[var(--border)] flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">Total Paid</span>
          <span className="font-display text-3xl text-green-400">{fmt(totalPaid)}</span>
        </div>
        <div className={`p-6 rounded-3xl border flex flex-col gap-2 ${outstanding > 0 ? "bg-red-500/5 border-red-500/20" : "bg-[var(--fg)]/[0.02] border-[var(--border)]"}`}>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">Balance Due</span>
          <span className={`font-display text-3xl ${outstanding > 0 ? "text-red-400" : ""}`}>{fmt(outstanding)}</span>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="font-mono text-sm uppercase tracking-widest text-[var(--fg-muted)] mb-4">Transaction History</h2>
        
        {transactions.length === 0 ? (
          <EmptyState icon={<Calendar size={40} />} title="No transactions" description="No entries or payments recorded for this customer yet." />
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map((t, i) => (
              <motion.div
                key={`${t.type}-${t.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--fg)]/[0.02] border border-[var(--border)]"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === "entry" ? "bg-purple-500/10 text-purple-400" : "bg-green-500/10 text-green-400"}`}>
                    {t.type === "entry" ? <FileText size={16} /> : <Wallet size={16} />}
                  </div>
                  <div>
                    <p className="font-mono text-sm text-[var(--fg)]">{t.desc}</p>
                    <p className="font-mono text-[10px] text-[var(--fg-muted)] mt-1">{fmtDate(t.date)}</p>
                  </div>
                </div>
                <div className="text-right ml-14 sm:ml-0">
                  <p className={`font-mono text-base ${t.type === "entry" ? "" : "text-green-400"}`}>
                    {t.type === "entry" ? "+" : "-"}{fmt(t.amount)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.main>
  );
}
