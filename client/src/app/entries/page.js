"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Search, Trash2, Truck, Clock, ShoppingCart, Download, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  PageHeader, AddButton, EmptyState, Skeleton,
  FormField, Input, Select, Textarea, SubmitButton
} from "@/components/ui/index";
import { AdaptiveActions, AdaptiveTooltip } from "@/components/ui/AdaptiveUI";
import { exportToExcel, exportToCSV, formatEntriesForExport } from "@/utils/export";
import { usePermission } from "@/hooks/usePermission";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const TYPE_ICONS = {
  Trip: <Truck size={13} />,
  Hour: <Clock size={13} />,
  Trade: <ShoppingCart size={13} />,
};
const TYPE_COLORS = {
  Trip: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  Hour: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  Trade: "text-orange-400 bg-orange-500/10 border-orange-500/20",
};

function TableSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[72px] w-full" />)}
    </div>
  );
}

function EntryForm({ onSubmit, loading }) {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [form, setForm] = useState({
    customerId: "", seasonId: "", entryType: "Trip",
    rate: "", quantity: "", description: "",
    entryDate: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState({});

  // Inline New Customer State
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", village: "" });
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.village) {
      toast("Please fill name and village.", "error");
      return;
    }
    setCreatingCustomer(true);
    try {
      const res = await api.createCustomer(newCustomer);
      setCustomers(prev => [...prev, res]);
      setForm(p => ({ ...p, customerId: res.id }));
      setShowNewCustomer(false);
      setNewCustomer({ name: "", phone: "", village: "" });
      toast("Customer created and selected!", "success");
    } catch (err) {
      toast(err.message || "Failed to create customer", "error");
    } finally {
      setCreatingCustomer(false);
    }
  };

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

  const totalAmount = useMemo(() => {
    const r = parseFloat(form.rate) || 0;
    const q = parseFloat(form.quantity) || 0;
    if (form.entryType === "Hour") {
      return r * q * 60;
    }
    return r * q;
  }, [form.rate, form.quantity, form.entryType]);

  const validate = () => {
    const e = {};
    if (!form.customerId) e.customerId = "Select a customer";
    if (!form.seasonId) e.seasonId = "Select a season";
    if (!form.rate || isNaN(form.rate)) e.rate = "Valid rate required";
    if (!form.quantity || isNaN(form.quantity)) e.quantity = "Valid quantity required";
    if (!form.entryDate) e.entryDate = "Date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const quantityLabel = form.entryType === "Trip" ? "No. of Trips" : form.entryType === "Hour" ? "Hours" : "Quintals / Units";
  const rateLabel = form.entryType === "Trip" ? "Rate per Trip (₹)" : form.entryType === "Hour" ? "Rate per Minute (₹)" : "Rate per Unit (₹)";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="font-mono text-xs uppercase tracking-widest text-[var(--fg-muted)]">Customer <span className="text-red-400">*</span></label>
            <button
              type="button"
              onClick={() => setShowNewCustomer(!showNewCustomer)}
              className="text-[10px] font-mono uppercase tracking-widest text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              {showNewCustomer ? <X size={12} /> : <Plus size={12} />}
              {showNewCustomer ? "Cancel" : "New Customer"}
            </button>
          </div>
          
          <AnimatePresence mode="wait">
            {showNewCustomer ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 overflow-hidden"
              >
                <Input placeholder="Full Name" value={newCustomer.name} onChange={e => setNewCustomer(p => ({...p, name: e.target.value}))} />
                <Input placeholder="Phone Number" value={newCustomer.phone} onChange={e => setNewCustomer(p => ({...p, phone: e.target.value}))} />
                <Input placeholder="Village / Town" value={newCustomer.village} onChange={e => setNewCustomer(p => ({...p, village: e.target.value}))} />
                <button
                  type="button"
                  onClick={handleCreateCustomer}
                  disabled={creatingCustomer}
                  className="mt-1 h-9 rounded-lg bg-blue-500 text-white font-mono text-xs uppercase tracking-widest hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {creatingCustomer ? "Saving..." : "Save & Select Customer"}
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Select value={form.customerId} onChange={set("customerId")} className={errors.customerId ? "border-red-500/50" : ""}>
                  <option value="">Select customer…</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.village}</option>)}
                </Select>
                {errors.customerId && <span className="text-[10px] text-red-400 mt-1 block">{errors.customerId}</span>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <FormField label="Season" error={errors.seasonId} required>
          <Select value={form.seasonId} onChange={set("seasonId")}>
            <option value="">Select season…</option>
            {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </FormField>
      </div>

      <FormField label="Entry Type" required>
        <div className="flex gap-2">
          {["Trip", "Hour", "Trade"].map(t => (
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

      {/* Live Total */}
      {totalAmount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--fg)]/[0.04] border border-[var(--border)]"
        >
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--fg-muted)]">Total Amount</span>
          <span className="font-mono text-lg text-[var(--fg)]">{fmt(totalAmount)}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Date" error={errors.entryDate} required>
          <Input type="date" value={form.entryDate} onChange={set("entryDate")} />
        </FormField>
        <FormField label="Description">
          <Input placeholder="Optional notes" value={form.description} onChange={set("description")} />
        </FormField>
      </div>

      <SubmitButton loading={loading}>Add Entry</SubmitButton>
    </form>
  );
}

function ExportModal({ entries, onClose }) {
  const toast = useToast();
  const [exportType, setExportType] = useState("full"); // full, customer, season
  const [selectedId, setSelectedId] = useState("");
  const [format, setFormat] = useState("csv"); // csv, excel

  const customers = useMemo(() => {
    const map = new Map();
    entries.forEach(e => e.customer_id && map.set(e.customer_id, e.customer_name));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [entries]);

  const seasons = useMemo(() => {
    const map = new Map();
    entries.forEach(e => e.season_id && map.set(e.season_id, e.season_name));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [entries]);

  // Reset selected id when type changes
  useEffect(() => { setSelectedId(""); }, [exportType]);

  const handleExport = () => {
    let dataToExport = entries;
    let fileName = "MSBT_Entries_Full";

    if (exportType === "customer") {
      if (!selectedId) return toast("Please select a customer", "error");
      dataToExport = entries.filter(e => String(e.customer_id) === String(selectedId));
      const cName = customers.find(c => String(c.id) === String(selectedId))?.name || "Customer";
      fileName = `MSBT_Entries_${cName.replace(/\s+/g, "_")}`;
    } else if (exportType === "season") {
      if (!selectedId) return toast("Please select a season", "error");
      dataToExport = entries.filter(e => String(e.season_id) === String(selectedId));
      const sName = seasons.find(s => String(s.id) === String(selectedId))?.name || "Season";
      fileName = `MSBT_Entries_${sName.replace(/\s+/g, "_")}`;
    }

    if (dataToExport.length === 0) {
      return toast("No entries found for this selection", "warning");
    }

    const formatted = formatEntriesForExport(dataToExport);
    if (format === "csv") exportToCSV(formatted, fileName);
    else exportToExcel(formatted, fileName);

    onClose();
  };

  return (
    <div className="flex flex-col gap-6">
      <FormField label="Export Type">
        <div className="flex gap-2">
          {[
            { id: "full", label: "Full Export" },
            { id: "customer", label: "Customer-wise" },
            { id: "season", label: "Season-wise" }
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setExportType(t.id)}
              className={`flex-1 h-11 rounded-xl text-[10px] font-mono uppercase tracking-widest border transition-all ${exportType === t.id ? "bg-[var(--fg)]/10 border-[var(--fg)]/20 text-[var(--fg)]" : "border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)]"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </FormField>

      <AnimatePresence mode="wait">
        {exportType === "customer" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <FormField label="Select Customer" required>
              <Select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                <option value="">Choose a customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </FormField>
          </motion.div>
        )}
        {exportType === "season" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <FormField label="Select Season" required>
              <Select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                <option value="">Choose a season...</option>
                {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </FormField>
          </motion.div>
        )}
      </AnimatePresence>

      <FormField label="Export Format">
        <div className="flex gap-2">
          {["csv", "excel"].map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={`flex-1 h-11 rounded-xl text-xs font-mono uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${format === f ? "bg-green-500/10 border-green-500/30 text-green-500" : "border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)]"}`}
            >
              <Download size={14} /> {f}
            </button>
          ))}
        </div>
      </FormField>

      <button
        onClick={handleExport}
        className="h-12 w-full rounded-xl bg-[var(--fg)] text-[var(--bg)] font-mono text-sm uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 mt-2"
      >
        <Download size={16} /> Generate Export
      </button>
    </div>
  );
}

const rowVariants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

function EntryRow({ entry, onDelete, index, checkPerm }) {
  const typeColor = TYPE_COLORS[entry.entry_type] || "";
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
            <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full font-mono border ${typeColor}`}>
              {TYPE_ICONS[entry.entry_type]} {entry.entry_type}
            </span>
            <span className="font-display text-base truncate">{entry.customer_name}</span>
            <span className="font-mono text-xs text-[var(--fg-muted)] hidden sm:inline">{entry.customer_village}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="font-mono text-xs text-[var(--fg-muted)]">{entry.season_name}</span>
            <span className="font-mono text-xs text-[var(--fg-muted)]">{fmtDate(entry.entry_date)}</span>
            <span className="font-mono text-xs text-[var(--fg-muted)]">{entry.quantity} @ {fmt(entry.rate)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 ml-10 sm:ml-0 shrink-0">
        <div className="text-right">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--fg-muted)]">Total</p>
          <p className="font-mono text-xs sm:text-sm">{fmt(entry.total_amount)}</p>
        </div>
        <AdaptiveActions>
          <AdaptiveTooltip content="Delete Entry">
            <button
              onClick={() => { if (checkPerm('entries', 'delete')) onDelete(entry); }}
              aria-label="Delete entry"
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

export default function Entries() {
  const toast = useToast();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const checkPerm = usePermission();

  const fetchEntries = useCallback(async () => {
    try {
      const data = await api.getEntries();
      setEntries(data);
    } catch (err) {
      toast(err.message || "Failed to load entries", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleCreate = async (form) => {
    setSubmitting(true);
    try {
      await api.createEntry({
        customerId: form.customerId,
        seasonId: form.seasonId,
        entryType: form.entryType,
        rate: parseFloat(form.rate),
        quantity: parseFloat(form.quantity),
        description: form.description,
        entryDate: form.entryDate,
      });
      toast("Entry added", "success");
      setCreateOpen(false);
      setLoading(true);
      await fetchEntries();
    } catch (err) {
      toast(err.message || "Failed to add entry", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteEntry(deleteTarget.id);
      toast("Entry deleted", "warning");
      setDeleteTarget(null);
      await fetchEntries();
    } catch (err) {
      toast(err.message || "Failed to delete entry", "error");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(e =>
      e.customer_name?.toLowerCase().includes(q) ||
      e.season_name?.toLowerCase().includes(q) ||
      e.entry_type?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q)
    );
  }, [entries, search]);

  const totalRevenue = useMemo(() => entries.reduce((s, e) => s + (e.total_amount || 0), 0), [entries]);

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
        title="Entries"
        description={`${entries.length} records · ${fmt(totalRevenue)} total`}
        action={
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <button onClick={() => setExportOpen(true)} className="h-9 px-4 rounded-xl border border-[var(--border)] font-mono text-xs uppercase tracking-widest text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--fg)]/5 transition-all inline-flex items-center gap-2">
                <Download size={13} /> Export Data
              </button>
            </div>
            <AddButton onClick={() => { if (checkPerm('entries', 'create')) setCreateOpen(true); }}>
              <Plus size={14} />
              Add Entry
            </AddButton>
          </div>
        }
      />

      <div className="relative mb-8">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          placeholder="Search by customer, season, type…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-sm h-11 pl-10 pr-4 rounded-xl bg-[var(--fg)]/[0.04] border border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-muted)] text-sm font-mono focus:outline-none focus:border-[var(--fg)]/20 transition-all"
        />
      </div>

      {loading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText size={48} />}
          title={search ? "No results found" : "No entries yet"}
          description={search ? "Try a different search" : "Add trip, hour or trade entries to begin"}
          action={!search && <AddButton onClick={() => { if (checkPerm('entries', 'create')) setCreateOpen(true); }}><Plus size={14} /> Add Entry</AddButton>}
        />
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-3">
          {filtered.map((e, i) => (
            <EntryRow key={e.id} entry={e} index={i} onDelete={setDeleteTarget} checkPerm={checkPerm} />
          ))}
        </motion.div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New Entry">
        <EntryForm onSubmit={handleCreate} loading={submitting} />
      </Modal>

      <Modal isOpen={exportOpen} onClose={() => setExportOpen(false)} title="Export Entries">
        <ExportModal entries={entries} onClose={() => setExportOpen(false)} />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Entry?"
        message={`This will permanently delete the ${deleteTarget?.entry_type} entry of ${fmt(deleteTarget?.total_amount)} for ${deleteTarget?.customer_name}. This cannot be undone.`}
        confirmLabel="Delete"
      />
    </motion.main>
  );
}
