"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Wallet, Plus, Search, Trash2, CreditCard, Banknote, Smartphone, Receipt, Download } from "lucide-react";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  PageHeader, AddButton, EmptyState, Skeleton,
  FormField, Input, Select, Textarea, SubmitButton
} from "@/components/ui/index";
import { AdaptiveActions, AdaptiveTooltip } from "@/components/ui/AdaptiveUI";
import { exportToExcel, exportToCSV, formatPaymentsForExport } from "@/utils/export";
import { usePermission } from "@/hooks/usePermission";

const fmt = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const MODE_CONFIG = {
  Cash: { icon: <Banknote size={12} />, color: "text-green-400 bg-green-500/10 border-green-500/20" },
  UPI: { icon: <Smartphone size={12} />, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  "Bank Transfer": { icon: <CreditCard size={12} />, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  Cheque: { icon: <Receipt size={12} />, color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
};

function TableSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-[72px] w-full" />)}
    </div>
  );
}

function PaymentForm({ onSubmit, loading }) {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [form, setForm] = useState({
    customerId: "", seasonId: "", amount: "",
    paymentMode: "Cash", referenceNo: "", notes: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api.getSeasons()
      .then(s => setSeasons(s.filter(x => x.status !== "Archived")))
      .catch(() => toast("Failed to load seasons", "error"));
  }, [toast]);

  useEffect(() => {
    if (!form.seasonId) {
      setCustomers([]);
      setForm(prev => ({ ...prev, customerId: "" }));
      return;
    }
    api.getCustomers(form.seasonId)
      .then(c => {
        const activeCusts = c.filter(x => x.status === "active");
        setCustomers(activeCusts);
        if (form.customerId && !activeCusts.some(x => x.id === form.customerId)) {
          setForm(prev => ({ ...prev, customerId: "" }));
        }
      })
      .catch(() => toast("Failed to load customers for the selected season", "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.seasonId, toast]);

  const validate = () => {
    const e = {};
    if (!form.customerId) e.customerId = "Select a customer";
    if (!form.seasonId) e.seasonId = "Select a season";
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) e.amount = "Valid amount required";
    if (!form.paymentDate) e.paymentDate = "Date is required";
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormField label="Customer" error={errors.customerId} required>
          <Select value={form.customerId} onChange={set("customerId")}>
            <option value="">Select customer…</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.village}</option>)}
          </Select>
        </FormField>
        <FormField label="Season" error={errors.seasonId} required>
          <Select value={form.seasonId} onChange={set("seasonId")}>
            <option value="">Select season…</option>
            {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormField label="Amount (₹)" error={errors.amount} required>
          <Input type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={set("amount")} />
        </FormField>
        <FormField label="Payment Date" error={errors.paymentDate} required>
          <Input type="date" value={form.paymentDate} onChange={set("paymentDate")} />
        </FormField>
      </div>

      <FormField label="Payment Mode" required>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.keys(MODE_CONFIG).map(m => {
            const c = MODE_CONFIG[m];
            return (
              <button
                key={m}
                type="button"
                onClick={() => setForm(p => ({ ...p, paymentMode: m }))}
                className={`min-h-10 py-2 h-auto rounded-xl text-[10px] font-mono uppercase tracking-widest border transition-all flex items-center justify-center gap-1.5 text-center ${form.paymentMode === m ? c.color : "border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--fg)]/5"}`}
              >
                {c.icon} {m}
              </button>
            );
          })}
        </div>
      </FormField>

      {(form.paymentMode === "UPI" || form.paymentMode === "Bank Transfer" || form.paymentMode === "Cheque") && (
        <FormField label="Reference No.">
          <Input placeholder="UTR / Cheque / Txn number" value={form.referenceNo} onChange={set("referenceNo")} />
        </FormField>
      )}

      <FormField label="Notes">
        <Textarea placeholder="Optional notes about this payment" value={form.notes} onChange={set("notes")} rows={2} />
      </FormField>

      <SubmitButton loading={loading}>Record Payment</SubmitButton>
    </form>
  );
}

const rowVariants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

function PaymentRow({ payment, onDelete, index, checkPerm }) {
  const mode = MODE_CONFIG[payment.payment_mode] || { icon: null, color: "text-[var(--fg-muted)] bg-[var(--fg)]/5 border-[var(--border)]" };

  return (
    <motion.div
      variants={rowVariants}
      layout
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-[var(--fg)]/[0.025] border border-[var(--border)] hover:bg-[var(--fg)]/[0.05] transition-all"
    >
      <div className="flex items-center gap-4 min-w-0">
        <span className="font-mono text-xs text-[var(--fg-muted)] w-6 shrink-0">{String(index + 1).padStart(2, "0")}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full font-mono border ${mode.color}`}>
              {mode.icon} {payment.payment_mode}
            </span>
            <span className="font-display text-base truncate">{payment.customer_name}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="font-mono text-xs text-[var(--fg-muted)]">{payment.season_name}</span>
            <span className="font-mono text-xs text-[var(--fg-muted)]">{fmtDate(payment.payment_date)}</span>
            {payment.reference_no && (
              <span className="font-mono text-xs text-[var(--fg-muted)]">Ref: {payment.reference_no}</span>
            )}
            {payment.notes && (
              <span className="font-mono text-xs text-[var(--fg-muted)] hidden sm:inline truncate max-w-[200px]">{payment.notes}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 ml-10 sm:ml-0 shrink-0">
        <div className="text-right">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--fg-muted)]">Amount</p>
          <p className="font-mono text-xs sm:text-sm text-green-400">{fmt(payment.amount)}</p>
        </div>
        <AdaptiveActions>
          <AdaptiveTooltip content="Delete Payment">
            <button
              onClick={() => { if (checkPerm('payments', 'delete')) onDelete(payment); }}
              aria-label="Delete payment"
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-500/5 hover:bg-red-500/15 active:bg-red-500/20 text-red-400/60 hover:text-red-400 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </AdaptiveTooltip>
        </AdaptiveActions>
      </div>
    </motion.div>
  );
}

export default function Payments() {
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const checkPerm = usePermission();

  const fetchPayments = useCallback(async () => {
    try {
      const data = await api.getPayments();
      setPayments(data);
    } catch (err) {
      toast(err.message || "Failed to load payments", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleCreate = async (form) => {
    setSubmitting(true);
    try {
      await api.createPayment({
        customerId: form.customerId,
        seasonId: form.seasonId,
        amount: parseFloat(form.amount),
        paymentMode: form.paymentMode,
        referenceNo: form.referenceNo,
        paymentDate: form.paymentDate,
        notes: form.notes,
      });
      toast("Payment recorded", "success");
      setCreateOpen(false);
      setLoading(true);
      await fetchPayments();
    } catch (err) {
      toast(err.message || "Failed to record payment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deletePayment(deleteTarget.id);
      toast("Payment deleted", "warning");
      setDeleteTarget(null);
      await fetchPayments();
    } catch (err) {
      toast(err.message || "Failed to delete payment", "error");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return payments;
    const q = search.toLowerCase();
    return payments.filter(p =>
      p.customer_name?.toLowerCase().includes(q) ||
      p.season_name?.toLowerCase().includes(q) ||
      p.payment_mode?.toLowerCase().includes(q) ||
      p.reference_no?.toLowerCase().includes(q) ||
      p.notes?.toLowerCase().includes(q)
    );
  }, [payments, search]);

  const totalCollected = useMemo(() => payments.reduce((s, p) => s + (Number(p.amount) || 0), 0), [payments]);

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 sm:px-6 md:px-12"
    >
      <PageHeader
        title="Payments"
        description={`${payments.length} transactions · ${fmt(totalCollected)} collected`}
        action={
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <button onClick={() => exportToCSV(formatPaymentsForExport(payments), "MSBT_Payments")} className="h-9 px-3 rounded-xl border border-[var(--border)] font-mono text-xs uppercase tracking-widest text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--fg)]/5 transition-all inline-flex items-center gap-1.5">
                <Download size={13} /> CSV
              </button>
              <button onClick={() => exportToExcel(formatPaymentsForExport(payments), "MSBT_Payments")} className="h-9 px-3 rounded-xl border border-[var(--border)] font-mono text-xs uppercase tracking-widest text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--fg)]/5 transition-all inline-flex items-center gap-1.5">
                <Download size={13} /> Excel
              </button>
            </div>
            <AddButton onClick={() => { if (checkPerm('payments', 'create')) setCreateOpen(true); }}>
              <Plus size={14} />
              Record Payment
            </AddButton>
          </div>
        }
      />

      <div className="relative mb-8">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          placeholder="Search by customer, mode, reference…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-sm h-11 pl-10 pr-4 rounded-xl bg-[var(--fg)]/[0.04] border border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-muted)] text-sm font-mono focus:outline-none focus:border-[var(--fg)]/20 transition-all"
        />
      </div>

      {loading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Wallet size={48} />}
          title={search ? "No results found" : "No payments recorded"}
          description={search ? "Try a different search" : "Record the first payment to start tracking collections"}
          action={!search && <AddButton onClick={() => { if (checkPerm('payments', 'create')) setCreateOpen(true); }}><Plus size={14} /> Record Payment</AddButton>}
        />
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-3">
          {filtered.map((p, i) => (
            <PaymentRow key={p.id} payment={p} index={i} onDelete={setDeleteTarget} checkPerm={checkPerm} />
          ))}
        </motion.div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Record Payment" maxWidth="max-w-2xl">
        <PaymentForm onSubmit={handleCreate} loading={submitting} />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Payment?"
        message={`This will permanently delete the ${deleteTarget?.payment_mode} payment of ${fmt(deleteTarget?.amount)} from ${deleteTarget?.customer_name}. This cannot be undone.`}
        confirmLabel="Delete"
      />
    </motion.main>
  );
}
