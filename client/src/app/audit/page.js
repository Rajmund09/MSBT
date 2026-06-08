"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { api } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, Skeleton, EmptyState } from "@/components/ui/index";
import { ShieldAlert, Search } from "lucide-react";

const ACTION_COLORS = {
  USER_LOGIN: "text-green-400 bg-green-500/10 border-green-500/20",
  USER_LOGOUT: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  CREATE_CUSTOMER: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  UPDATE_CUSTOMER: "text-blue-300 bg-blue-500/10 border-blue-500/20",
  CREATE_ENTRY: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  DELETE_ENTRY: "text-red-400 bg-red-500/10 border-red-500/20",
  CREATE_PAYMENT: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  DELETE_PAYMENT: "text-red-400 bg-red-500/10 border-red-500/20",
  CREATE_SEASON: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  UPDATE_SEASON_STATUS: "text-orange-300 bg-orange-500/10 border-orange-500/20",
  CREATE_USER: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  UPDATE_USER: "text-cyan-300 bg-cyan-500/10 border-cyan-500/20",
  DELETE_USER: "text-red-400 bg-red-500/10 border-red-500/20",
};

function fmtDt(d) {
  const dt = new Date(d);
  return dt.toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
}

export default function AuditLogs() {
  const { user } = useAuth();
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.getAuditLogs()
      .then(d => { setLogs(d); setLoading(false); })
      .catch(err => { toast(err.message, "error"); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter(l =>
      l.action?.toLowerCase().includes(q) ||
      l.user_name?.toLowerCase().includes(q) ||
      l.details?.toLowerCase().includes(q)
    );
  }, [logs, search]);

  if (!["Owner", "Co-Owner", "Manager"].includes(user?.role)) {
    return (
      <main className="container mx-auto px-4 sm:px-6 md:px-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ShieldAlert size={48} className="mx-auto mb-4 text-red-400/30" />
          <p className="font-display text-2xl text-[var(--fg-muted)]">Access Restricted</p>
          <p className="font-mono text-xs text-[var(--fg-muted)] mt-2">Audit logs are visible to Management roles only.</p>
        </div>
      </main>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 sm:px-6 md:px-12"
    >
      <PageHeader title="Audit Logs" description={`${logs.length} events recorded`} />

      <div className="relative mb-8">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          placeholder="Search by action, user, or details…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:max-w-sm h-11 pl-10 pr-4 rounded-xl bg-[var(--fg)]/[0.04] border border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-muted)] text-sm font-mono focus:outline-none focus:border-[var(--fg)]/20 transition-all"
        />
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<ShieldAlert size={40} />} title="No logs found" />
      ) : (
        <div className="flex flex-col divide-y divide-[var(--border)]">
          {filtered.map((log, i) => {
            const c = ACTION_COLORS[log.action] || "text-[var(--fg-muted)] bg-[var(--fg)]/5 border-[var(--border)]";
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02, duration: 0.3 }}
                className="flex flex-col sm:flex-row sm:items-center gap-3 py-4"
              >
                <span className={`inline-flex items-center shrink-0 text-[10px] px-2.5 py-1 rounded-full font-mono border w-fit ${c}`}>
                  {log.action.replace(/_/g, " ")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-[var(--fg)] truncate">{log.details}</p>
                  <p className="font-mono text-[10px] text-[var(--fg-muted)] mt-0.5">
                    {log.user_name} · {log.user_role}
                  </p>
                </div>
                <span className="font-mono text-[10px] text-[var(--fg-muted)] shrink-0">{fmtDt(log.created_at)}</span>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.main>
  );
}
