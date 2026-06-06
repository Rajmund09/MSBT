"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Search, X, Users, FileText, Wallet, CalendarDays, ArrowRight } from "lucide-react";
import { api } from "@/utils/api";

const ICONS = {
  customer: <Users size={14} />,
  entry: <FileText size={14} />,
  payment: <Wallet size={14} />,
  season: <CalendarDays size={14} />,
};

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const router = useRouter();

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(v => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
    else { setQuery(""); setResults([]); setSelected(0); }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const q = query.toLowerCase();
        const [customers, entries, payments, seasons] = await Promise.all([
          api.getCustomers(),
          api.getEntries(),
          api.getPayments(),
          api.getSeasons(),
        ]);

        const items = [
          ...customers.filter(c => c.name.toLowerCase().includes(q) || c.village.toLowerCase().includes(q) || c.phone.includes(q))
            .slice(0, 3).map(c => ({
              type: "customer", id: c.id, label: c.name,
              sub: `${c.village} · ${fmt(c.outstanding || 0)} due`,
              href: "/customers",
            })),
          ...seasons.filter(s => s.name.toLowerCase().includes(q))
            .slice(0, 2).map(s => ({
              type: "season", id: s.id, label: s.name,
              sub: `${s.status} · ${fmt(s.revenue)} revenue`,
              href: "/seasons",
            })),
          ...entries.filter(e => e.customer_name?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q))
            .slice(0, 3).map(e => ({
              type: "entry", id: e.id, label: `${e.entry_type}: ${e.customer_name}`,
              sub: `${fmt(e.total_amount)} · ${e.season_name}`,
              href: "/entries",
            })),
          ...payments.filter(p => p.customer_name?.toLowerCase().includes(q) || p.payment_mode?.toLowerCase().includes(q))
            .slice(0, 2).map(p => ({
              type: "payment", id: p.id, label: `${p.payment_mode} — ${p.customer_name}`,
              sub: `${fmt(p.amount)} · ${p.season_name}`,
              href: "/payments",
            })),
        ];

        setResults(items);
        setSelected(0);
      } catch (_) {}
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const navigate = useCallback((href) => {
    setOpen(false);
    router.push(href);
  }, [router]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(v => Math.min(v + 1, results.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected(v => Math.max(v - 1, 0)); }
      if (e.key === "Enter" && results[selected]) navigate(results[selected].href);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, results, selected, navigate]);

  return (
    <>
      {/* Trigger button */}
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed top-6 right-6 z-[8000] hidden md:flex items-center gap-2 h-9 px-4 rounded-xl bg-[var(--fg)]/[0.04] border border-[var(--border)] text-[var(--fg-muted)] text-xs font-mono hover:bg-[var(--fg)]/[0.08] transition-all"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <Search size={13} />
        <span>Search</span>
        <span className="ml-1 text-[10px] opacity-50">⌘K</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[99000] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -10 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-xl bg-[#0f0f0f] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
                {loading ? (
                  <div className="w-4 h-4 border border-white/20 border-t-white/60 rounded-full animate-spin shrink-0" />
                ) : (
                  <Search size={16} className="text-white/30 shrink-0" />
                )}
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search customers, seasons, entries, payments…"
                  className="flex-1 bg-transparent text-white text-sm font-mono placeholder-white/20 focus:outline-none"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="text-white/30 hover:text-white/60">
                    <X size={14} />
                  </button>
                )}
                <kbd className="text-[10px] px-2 py-1 rounded border border-white/10 text-white/30 font-mono ml-2">Esc</kbd>
              </div>

              {/* Results */}
              {results.length > 0 && (
                <div className="py-2 max-h-96 overflow-y-auto">
                  {results.map((item, i) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => navigate(item.href)}
                      className={`w-full flex items-center gap-4 px-5 py-3 text-left transition-colors ${
                        i === selected ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="text-white/30">{ICONS[item.type]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{item.label}</p>
                        <p className="text-[10px] text-white/40 font-mono">{item.sub}</p>
                      </div>
                      <ArrowRight size={12} className="text-white/20 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {query && !loading && results.length === 0 && (
                <div className="py-10 text-center">
                  <p className="font-mono text-xs text-white/30">No results for "{query}"</p>
                </div>
              )}

              {!query && (
                <div className="py-6 px-5 flex items-center gap-6">
                  <span className="font-mono text-[10px] text-white/20 uppercase tracking-widest">Quick:</span>
                  {[
                    { label: "Customers", href: "/customers" },
                    { label: "Billing", href: "/billing" },
                    { label: "Analytics", href: "/analytics" },
                  ].map(q => (
                    <button key={q.href} onClick={() => navigate(q.href)} className="font-mono text-xs text-white/40 hover:text-white/80 transition-colors">
                      {q.label}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
