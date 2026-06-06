"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Plus, Archive } from "lucide-react";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  PageHeader, AddButton, EmptyState, Skeleton,
  FormField, Input, SubmitButton
} from "@/components/ui/index";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const STATUS_CONFIG = {
  Active: { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
  Closed: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  Archived: { color: "text-white/30", bg: "bg-white/5", border: "border-white/10" },
};

function TableSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
    </div>
  );
}

function SeasonForm({ onSubmit, loading }) {
  const [form, setForm] = useState({ name: "", startDate: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Season name is required";
    if (!form.startDate) e.startDate = "Start date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <FormField label="Season Name" error={errors.name} required>
        <Input placeholder="e.g. Harvest Season 2026 (Rice)" value={form.name} onChange={set("name")} />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Start Date" error={errors.startDate} required>
          <Input type="date" value={form.startDate} onChange={set("startDate")} />
        </FormField>
        <FormField label="End Date">
          <Input type="date" value={form.endDate} onChange={set("endDate")} />
        </FormField>
      </div>
      <SubmitButton loading={loading}>Create Season</SubmitButton>
    </form>
  );
}

function SeasonCard({ season, onStatusChange, index }) {
  const config = STATUS_CONFIG[season.status] || STATUS_CONFIG.Closed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      layout
      className="group relative flex flex-col gap-5 p-6 rounded-2xl bg-[var(--fg)]/[0.025] border border-[var(--border)] hover:bg-[var(--fg)]/[0.05] transition-all overflow-hidden"
    >
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full font-mono uppercase tracking-widest border ${config.color} ${config.bg} ${config.border}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {season.status}
        </span>
        <span className="font-mono text-xs text-[var(--fg-muted)]">#{String(index + 1).padStart(2, "0")}</span>
      </div>

      {/* Name */}
      <div>
        <h3 className="font-display text-xl leading-tight group-hover:italic transition-all">{season.name}</h3>
        <p className="font-mono text-xs text-[var(--fg-muted)] mt-1">
          {fmtDate(season.start_date)} → {fmtDate(season.end_date)}
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 border-t border-[var(--border)] pt-5">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--fg-muted)]">Revenue</p>
          <p className="font-mono text-sm mt-1">{fmt(season.revenue)}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--fg-muted)]">Collected</p>
          <p className="font-mono text-sm mt-1 text-green-400">{fmt(season.payments)}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--fg-muted)]">Due</p>
          <p className={`font-mono text-sm mt-1 ${season.outstanding > 0 ? "text-red-400" : ""}`}>{fmt(season.outstanding)}</p>
        </div>
      </div>

      {/* Actions */}
      {season.status !== "Archived" && (
        <div className="flex gap-2 mt-1">
          {season.status === "Active" && (
            <button
              onClick={() => onStatusChange(season, "Closed")}
              className="flex-1 h-9 rounded-xl text-[11px] font-mono uppercase tracking-widest border border-yellow-500/20 text-yellow-400/70 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all"
            >
              Close Season
            </button>
          )}
          {season.status === "Closed" && (
            <>
              <button
                onClick={() => onStatusChange(season, "Active")}
                className="flex-1 h-9 rounded-xl text-[11px] font-mono uppercase tracking-widest border border-green-500/20 text-green-400/70 hover:text-green-400 hover:bg-green-500/10 transition-all"
              >
                Re-Activate
              </button>
              <button
                onClick={() => onStatusChange(season, "Archived")}
                className="h-9 px-3 rounded-xl text-[11px] font-mono uppercase tracking-widest border border-white/10 text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
              >
                <Archive size={13} />
              </button>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function Seasons() {
  const toast = useToast();
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null); // { season, newStatus }

  const fetchSeasons = useCallback(async () => {
    try {
      const data = await api.getSeasons();
      setSeasons(data);
    } catch (err) {
      toast(err.message || "Failed to load seasons", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchSeasons(); }, [fetchSeasons]);

  const handleCreate = async (form) => {
    setSubmitting(true);
    try {
      await api.createSeason({ name: form.name, startDate: form.startDate, endDate: form.endDate });
      toast("Season created", "success");
      setCreateOpen(false);
      setLoading(true);
      await fetchSeasons();
    } catch (err) {
      toast(err.message || "Failed to create season", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async () => {
    if (!statusTarget) return;
    try {
      await api.updateSeasonStatus(statusTarget.season.id, { status: statusTarget.newStatus });
      toast(`Season ${statusTarget.newStatus.toLowerCase()}`, "success");
      setStatusTarget(null);
      await fetchSeasons();
    } catch (err) {
      toast(err.message || "Failed to update season", "error");
    }
  };

  const confirmMsg = statusTarget?.newStatus === "Archived"
    ? `"${statusTarget?.season?.name}" will be permanently archived and cannot accept new entries or payments.`
    : `"${statusTarget?.season?.name}" status will be changed to ${statusTarget?.newStatus}.`;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 sm:px-6 md:px-12"
    >
      <PageHeader
        title="Seasons"
        description={`${seasons.length} periods · Financial Calendar`}
        action={
          <AddButton onClick={() => setCreateOpen(true)}>
            <Plus size={14} />
            New Season
          </AddButton>
        }
      />

      {loading ? (
        <TableSkeleton />
      ) : seasons.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={48} />}
          title="No seasons yet"
          description="Create a season to start tracking entries and payments"
          action={<AddButton onClick={() => setCreateOpen(true)}><Plus size={14} /> New Season</AddButton>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {seasons.map((s, i) => (
            <SeasonCard
              key={s.id}
              season={s}
              index={i}
              onStatusChange={(season, newStatus) => setStatusTarget({ season, newStatus })}
            />
          ))}
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New Season">
        <SeasonForm onSubmit={handleCreate} loading={submitting} />
      </Modal>

      <ConfirmDialog
        isOpen={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleStatusChange}
        title={`${statusTarget?.newStatus} Season?`}
        message={confirmMsg}
        confirmLabel={statusTarget?.newStatus || "Confirm"}
      />
    </motion.main>
  );
}
