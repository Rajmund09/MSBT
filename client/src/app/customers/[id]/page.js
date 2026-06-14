"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Phone, MapPin, FileText, Wallet, Calendar, Download, Plus, Edit2, Trash2 } from "lucide-react";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  PageHeader, Skeleton, EmptyState,
  FormField, Input, Select, Textarea, SubmitButton
} from "@/components/ui/index";
import { exportToExcel, exportToCSV } from "@/utils/export";
import { usePermission } from "@/hooks/usePermission";

const fmt = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;
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

// ─── Sub-form for Adding Entries ────────────────────────────────────────────
function CustomerEntryForm({ seasons, onSubmit, onCancel, loading, initial = {} }) {
  const [form, setForm] = useState({
    seasonId: initial.season_id || initial.seasonId || "",
    entryType: initial.entry_type || initial.entryType || "Trip",
    rate: initial.rate !== undefined ? initial.rate : "",
    quantity: initial.quantity !== undefined ? initial.quantity : "",
    description: initial.description || "",
    entryDate: initial.entry_date || initial.entryDate || new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState({});

  const TYPE_COLORS = {
    Trip: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    Minute: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    Trade: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  };

  const totalAmount = useMemo(() => {
    const r = parseFloat(form.rate) || 0;
    const q = parseFloat(form.quantity) || 0;
    return r * q;
  }, [form.rate, form.quantity]);

  const validate = () => {
    const e = {};
    if (!form.seasonId) e.seasonId = "Select a season";
    if (!form.rate || isNaN(form.rate)) e.rate = "Valid rate required";
    if (!form.quantity || isNaN(form.quantity)) e.quantity = "Valid quantity required";
    if (!form.entryDate) e.entryDate = "Date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      const ok = await onSubmit(form);
      if (ok) {
        setForm(p => ({
          ...p,
          quantity: "",
          description: ""
        }));
      }
    }
  };

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const quantityLabel = form.entryType === "Trip" ? "No. of Trips" : form.entryType === "Minute" ? "Minutes" : "Quintals / Units";
  const rateLabel = form.entryType === "Trip" ? "Rate per Trip (₹)" : form.entryType === "Minute" ? "Rate per Minute (₹)" : "Rate per Unit (₹)";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-2">
      <FormField label="Season" error={errors.seasonId} required>
        <Select value={form.seasonId} onChange={set("seasonId")}>
          <option value="">Select season…</option>
          {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </FormField>

      <FormField label="Entry Type" required>
        <div className="flex gap-2">
          {["Trip", "Minute", "Trade"].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setForm(p => ({ ...p, entryType: t }))}
              className={`flex-1 h-11 rounded-xl text-xs font-mono uppercase tracking-widest border transition-all ${form.entryType === t ? TYPE_COLORS[t] : "border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)]"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label={rateLabel} error={errors.rate} required>
          <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.rate} onChange={set("rate")} />
        </FormField>
        <FormField label={quantityLabel} error={errors.quantity} required>
          <Input type="number" min="0.01" step="0.01" placeholder="0" value={form.quantity} onChange={set("quantity")} />
        </FormField>
      </div>

      {totalAmount > 0 && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--fg)]/[0.04] border border-[var(--border)]">
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--fg-muted)]">Total Amount</span>
          <span className="font-mono text-lg text-[var(--fg)]">₹{totalAmount.toLocaleString("en-IN")}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Date" error={errors.entryDate} required>
          <Input type="date" value={form.entryDate} onChange={set("entryDate")} />
        </FormField>
        <FormField label="Description">
          <Input placeholder="Optional notes" value={form.description} onChange={set("description")} />
        </FormField>
      </div>

      <div className="flex gap-3 mt-2">
        <button type="button" onClick={onCancel} className="flex-1 h-12 rounded-xl border border-[var(--border)] font-mono text-sm uppercase tracking-widest hover:bg-[var(--fg)]/5 transition-all">
          Cancel
        </button>
        <SubmitButton loading={loading}>Add Entry</SubmitButton>
      </div>
    </form>
  );
}

// ─── Sub-form for Recording Payments ────────────────────────────────────────
function CustomerPaymentForm({ seasons, onSubmit, onCancel, loading, initial = {} }) {
  const [form, setForm] = useState({
    seasonId: initial.season_id || initial.seasonId || "",
    amount: initial.amount !== undefined ? initial.amount : "",
    paymentMode: initial.payment_mode || initial.paymentMode || "Cash",
    referenceNo: initial.reference_no || initial.referenceNo || "",
    notes: initial.notes || "",
    paymentDate: initial.payment_date || initial.paymentDate || new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState({});

  const MODE_CONFIG = {
    Cash: { color: "text-green-400 bg-green-500/10 border-green-500/20" },
    UPI: { color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    "Bank Transfer": { color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
    Cheque: { color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  };

  const validate = () => {
    const e = {};
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-2">
      <FormField label="Season" error={errors.seasonId} required>
        <Select value={form.seasonId} onChange={set("seasonId")}>
          <option value="">Select season…</option>
          {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </FormField>

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
                {m}
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

      <div className="flex gap-3 mt-2">
        <button type="button" onClick={onCancel} className="flex-1 h-12 rounded-xl border border-[var(--border)] font-mono text-sm uppercase tracking-widest hover:bg-[var(--fg)]/5 transition-all">
          Cancel
        </button>
        <SubmitButton loading={loading}>Record Payment</SubmitButton>
      </div>
    </form>
  );
}

// ─── Customer Details Ledger Main Component ─────────────────────────────────
export default function CustomerLedger() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const checkPerm = usePermission();
  
  const [customer, setCustomer] = useState(null);
  const [entries, setEntries] = useState([]);
  const [payments, setPayments] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal open states
  const [entryOpen, setEntryOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editEntryTarget, setEditEntryTarget] = useState(null);
  const [editPaymentTarget, setEditPaymentTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [cRes, eRes, pRes, sRes] = await Promise.all([
        api.getCustomer(id),
        api.getEntries({ customerId: id }),
        api.getPayments({ customerId: id }),
        api.getSeasons()
      ]);
      setCustomer(cRes.customer);
      setEntries(eRes);
      setPayments(pRes);
      setSeasons(sRes.filter(x => x.status !== "Archived"));
    } catch (err) {
      toast("Failed to load customer data", "error");
      router.push("/customers");
    } finally {
      setLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalRevenue = entries.reduce((s, e) => s + (Number(e.total_amount) || 0), 0);
  const totalPaid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
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
      Amount: Number(t.amount) || 0,
      Season: t.season_name
    }));
    
    if (type === "csv") exportToCSV(data, `MSBT_${customer.name}_Ledger`);
    else exportToExcel(data, `MSBT_${customer.name}_Ledger`);
  };

  const handleAddEntry = async (form) => {
    setSubmitting(true);
    try {
      await api.createEntry({
        customerId: id,
        seasonId: form.seasonId,
        entryType: form.entryType,
        rate: parseFloat(form.rate),
        quantity: parseFloat(form.quantity),
        description: form.description,
        entryDate: form.entryDate,
      });
      toast("Entry added successfully", "success");
      setLoading(true);
      await fetchData();
      return true;
    } catch (err) {
      toast(err.message || "Failed to add entry", "error");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateEntry = async (form) => {
    setSubmitting(true);
    try {
      await api.updateEntry(editEntryTarget.id, {
        seasonId: form.seasonId,
        entryType: form.entryType,
        rate: parseFloat(form.rate),
        quantity: parseFloat(form.quantity),
        description: form.description,
        entryDate: form.entryDate,
      });
      toast("Entry updated successfully", "success");
      setEditEntryTarget(null);
      setLoading(true);
      await fetchData();
    } catch (err) {
      toast(err.message || "Failed to update entry", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePayment = async (form) => {
    setSubmitting(true);
    try {
      await api.updatePayment(editPaymentTarget.id, {
        seasonId: form.seasonId,
        amount: parseFloat(form.amount),
        paymentMode: form.paymentMode,
        referenceNo: form.referenceNo,
        paymentDate: form.paymentDate,
        notes: form.notes,
      });
      toast("Payment updated successfully", "success");
      setEditPaymentTarget(null);
      setLoading(true);
      await fetchData();
    } catch (err) {
      toast(err.message || "Failed to update payment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransaction = async () => {
    setDeleting(true);
    try {
      if (deleteTarget.type === "entry") {
        await api.deleteEntry(deleteTarget.id);
        toast("Entry deleted successfully", "success");
      } else {
        await api.deletePayment(deleteTarget.id);
        toast("Payment deleted successfully", "success");
      }
      setDeleteTarget(null);
      setLoading(true);
      await fetchData();
    } catch (err) {
      toast(err.message || "Failed to delete transaction", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleRecordPayment = async (form) => {
    setSubmitting(true);
    try {
      await api.createPayment({
        customerId: id,
        seasonId: form.seasonId,
        amount: parseFloat(form.amount),
        paymentMode: form.paymentMode,
        referenceNo: form.referenceNo,
        paymentDate: form.paymentDate,
        notes: form.notes,
      });
      toast("Payment recorded successfully", "success");
      setPaymentOpen(false);
      setLoading(true);
      await fetchData();
    } catch (err) {
      toast(err.message || "Failed to record payment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 sm:px-6 md:px-12">
        <LedgerSkeleton />
      </main>
    );
  }

  if (!customer) return null;

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

        <div className="flex flex-wrap gap-2">
          {checkPerm('entries', 'create') && (
            <button 
              onClick={() => setEntryOpen(true)}
              className="h-10 px-3 sm:px-4 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 font-mono text-xs uppercase tracking-widest transition-all inline-flex items-center gap-1.5 sm:gap-2"
            >
              <Plus size={14} /> <span className="hidden sm:inline">Add</span> Entry
            </button>
          )}
          {checkPerm('payments', 'create') && (
            <button 
              onClick={() => setPaymentOpen(true)}
              className="h-10 px-3 sm:px-4 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 font-mono text-xs uppercase tracking-widest transition-all inline-flex items-center gap-1.5 sm:gap-2"
            >
              <Plus size={14} /> <span className="hidden sm:inline">Record</span> Payment
            </button>
          )}
          <button onClick={() => handleExport("csv")} className="h-10 px-3 sm:px-4 rounded-xl border border-[var(--border)] font-mono text-xs uppercase tracking-widest text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--fg)]/5 transition-all inline-flex items-center gap-1.5 sm:gap-2">
            <Download size={14} /> <span className="hidden sm:inline">CSV</span>
          </button>
          <button onClick={() => handleExport("excel")} className="h-10 px-3 sm:px-4 rounded-xl border border-[var(--border)] font-mono text-xs uppercase tracking-widest text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--fg)]/5 transition-all inline-flex items-center gap-1.5 sm:gap-2">
            <Download size={14} /> <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 sm:p-6 rounded-3xl bg-[var(--fg)]/[0.02] border border-[var(--border)] flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">Total Revenue</span>
          <span className="font-display text-2xl sm:text-3xl">{fmt(totalRevenue)}</span>
        </div>
        <div className="p-4 sm:p-6 rounded-3xl bg-[var(--fg)]/[0.02] border border-[var(--border)] flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">Total Paid</span>
          <span className="font-display text-2xl sm:text-3xl text-green-400">{fmt(totalPaid)}</span>
        </div>
        <div className={`p-4 sm:p-6 rounded-3xl border flex flex-col gap-2 ${outstanding > 0 ? "bg-red-500/5 border-red-500/20" : "bg-[var(--fg)]/[0.02] border-[var(--border)]"}`}>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">Balance Due</span>
          <span className={`font-display text-2xl sm:text-3xl ${outstanding > 0 ? "text-red-400" : ""}`}>{fmt(outstanding)}</span>
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
                    <p className="font-mono text-xs sm:text-sm text-[var(--fg)] break-words leading-snug">{t.desc}</p>
                    <p className="font-mono text-[10px] text-[var(--fg-muted)] mt-1">{fmtDate(t.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right ml-14 sm:ml-0 self-end sm:self-auto shrink-0">
                  <div className="text-right">
                    <p className={`font-mono text-sm sm:text-base ${t.type === "entry" ? "" : "text-green-400"}`}>
                      {t.type === "entry" ? "+" : "-"}{fmt(t.amount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 border-l border-[var(--border)] pl-3">
                    {((t.type === "entry" && checkPerm('entries', 'edit')) || (t.type === "payment" && checkPerm('payments', 'edit'))) && (
                      <button
                        onClick={() => {
                          if (t.type === "entry") {
                            setEditEntryTarget(t);
                          } else {
                            setEditPaymentTarget(t);
                          }
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--fg)]/5 hover:bg-[var(--fg)]/10 active:bg-[var(--fg)]/15 text-[var(--fg)]/50 hover:text-[var(--fg)] transition-all"
                        aria-label="Edit transaction"
                      >
                        <Edit2 size={13} />
                      </button>
                    )}
                    {((t.type === "entry" && checkPerm('entries', 'delete')) || (t.type === "payment" && checkPerm('payments', 'delete'))) && (
                      <button
                        onClick={() => {
                          setDeleteTarget(t);
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/5 hover:bg-red-500/15 active:bg-red-500/20 text-red-400/50 hover:text-red-400 transition-all"
                        aria-label="Delete transaction"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={entryOpen} onClose={() => setEntryOpen(false)} title={`Add Entry for ${customer.name}`}>
        <CustomerEntryForm seasons={seasons} onSubmit={handleAddEntry} onCancel={() => setEntryOpen(false)} loading={submitting} />
      </Modal>

      <Modal isOpen={paymentOpen} onClose={() => setPaymentOpen(false)} title={`Record Payment from ${customer.name}`}>
        <CustomerPaymentForm seasons={seasons} onSubmit={handleRecordPayment} onCancel={() => setPaymentOpen(false)} loading={submitting} />
      </Modal>

      {/* Edit Entry Modal */}
      <Modal isOpen={!!editEntryTarget} onClose={() => setEditEntryTarget(null)} title={`Edit Entry for ${customer.name}`}>
        {editEntryTarget && (
          <CustomerEntryForm seasons={seasons} initial={editEntryTarget} onSubmit={handleUpdateEntry} onCancel={() => setEditEntryTarget(null)} loading={submitting} />
        )}
      </Modal>

      {/* Edit Payment Modal */}
      <Modal isOpen={!!editPaymentTarget} onClose={() => setEditPaymentTarget(null)} title={`Edit Payment from ${customer.name}`}>
        {editPaymentTarget && (
          <CustomerPaymentForm seasons={seasons} initial={editPaymentTarget} onSubmit={handleUpdatePayment} onCancel={() => setEditPaymentTarget(null)} loading={submitting} />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteTransaction}
        loading={deleting}
        title="Permanently Delete Transaction?"
        message={`Are you sure you want to permanently delete this ${deleteTarget?.type === "entry" ? "entry" : "payment"} of ${deleteTarget ? fmt(deleteTarget.amount) : ""}? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
      />
    </motion.main>
  );
}
