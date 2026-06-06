"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Users, Plus, Search, Edit2, Trash2, ChevronRight, Phone, MapPin, TrendingUp, Download } from "lucide-react";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  PageHeader, AddButton, EmptyState, Skeleton,
  FormField, Input, Textarea, SubmitButton
} from "@/components/ui/index";
import { exportToExcel, exportToCSV, formatCustomersForExport } from "@/utils/export";


// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// ─── Skeleton loader ─────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

// ─── Customer Form ───────────────────────────────────────────────────────────
function CustomerForm({ initial = {}, onSubmit, loading }) {
  const [form, setForm] = useState({
    name: initial.name || "",
    phone: initial.phone || "",
    village: initial.village || "",
    address: initial.address || "",
    notes: initial.notes || "",
    status: initial.status || "active",
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    if (!form.village.trim()) e.village = "Village is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <FormField label="Full Name" error={errors.name} required>
        <Input placeholder="e.g. Niranjan Swain" value={form.name} onChange={set("name")} />
      </FormField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormField label="Phone" error={errors.phone} required>
          <Input placeholder="+91 94380 12345" value={form.phone} onChange={set("phone")} />
        </FormField>
        <FormField label="Village / Town" error={errors.village} required>
          <Input placeholder="e.g. Bahanaga" value={form.village} onChange={set("village")} />
        </FormField>
      </div>
      <FormField label="Address">
        <Textarea placeholder="Full address (optional)" value={form.address} onChange={set("address")} rows={2} />
      </FormField>
      <FormField label="Notes">
        <Textarea placeholder="Any notes about this customer" value={form.notes} onChange={set("notes")} rows={2} />
      </FormField>
      {initial.id && (
        <FormField label="Status">
          <select
            value={form.status}
            onChange={set("status")}
            className="w-full h-11 px-4 rounded-xl bg-[#0f0f0f] border border-white/[0.08] text-white text-sm font-mono focus:outline-none focus:border-white/20 transition-all appearance-none"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </FormField>
      )}
      <SubmitButton loading={loading}>
        {initial.id ? "Save Changes" : "Create Customer"}
      </SubmitButton>
    </form>
  );
}

// ─── Customer Row ─────────────────────────────────────────────────────────────
const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function CustomerRow({ customer, onEdit, onDelete, index }) {
  const outstanding = customer.outstanding || 0;

  return (
    <Link href={`/customers/${customer.id}`}>
      <motion.div
        variants={rowVariants}
        layout
        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-[var(--fg)]/[0.025] border border-[var(--border)] hover:bg-[var(--fg)]/[0.05] transition-all cursor-pointer"
      >
      {/* Left: Identity */}
      <div className="flex items-center gap-4 min-w-0">
        <span className="font-mono text-xs text-[var(--fg-muted)] w-6 shrink-0">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <p className="font-display text-lg text-[var(--fg)] group-hover:italic transition-all truncate">
            {customer.name}
          </p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="flex items-center gap-1 text-xs font-mono text-[var(--fg-muted)]">
              <Phone size={11} /> {customer.phone}
            </span>
            <span className="flex items-center gap-1 text-xs font-mono text-[var(--fg-muted)]">
              <MapPin size={11} /> {customer.village}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider ${customer.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {customer.status}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Financials + Actions */}
      <div className="flex items-center gap-4 sm:gap-6 ml-10 sm:ml-0">
        <div className="flex gap-4 sm:gap-6">
          <div className="text-right">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--fg-muted)]">Revenue</p>
            <p className="font-mono text-sm text-[var(--fg)]">{fmt(customer.totalRevenue)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--fg-muted)]">Paid</p>
            <p className="font-mono text-sm text-green-400">{fmt(customer.totalPaid)}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--fg-muted)]">Due</p>
            <p className={`font-mono text-sm ${outstanding > 0 ? "text-red-400" : "text-[var(--fg)]"}`}>
              {fmt(outstanding)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(customer); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(customer); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/5 hover:bg-red-500/15 text-red-400/50 hover:text-red-400 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      </motion.div>
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Customers() {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      toast(err.message || "Failed to load customers", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  // Create
  const handleCreate = async (form) => {
    setSubmitting(true);
    try {
      await api.createCustomer(form);
      toast("Customer created successfully", "success");
      setCreateOpen(false);
      setLoading(true);
      await fetchCustomers();
    } catch (err) {
      toast(err.message || "Failed to create customer", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Update
  const handleUpdate = async (form) => {
    setSubmitting(true);
    try {
      await api.updateCustomer(editTarget.id, form);
      toast("Customer updated successfully", "success");
      setEditTarget(null);
      setLoading(true);
      await fetchCustomers();
    } catch (err) {
      toast(err.message || "Failed to update customer", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete — note: API has no delete endpoint for customers (only updateStatus). We'll set inactive.
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.updateCustomer(deleteTarget.id, {
        name: deleteTarget.name,
        phone: deleteTarget.phone,
        village: deleteTarget.village,
        address: deleteTarget.address || "",
        notes: deleteTarget.notes || "",
        status: "inactive",
      });
      toast("Customer deactivated", "warning");
      setDeleteTarget(null);
      await fetchCustomers();
    } catch (err) {
      toast(err.message || "Failed to deactivate customer", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Filtered list
  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.village.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  }, [customers, search]);

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
        title="Customers"
        description={`${customers.length} accounts · Directory & Ledger`}
        action={
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <button onClick={() => exportToCSV(formatCustomersForExport(customers), "MSBT_Customers")} className="h-9 px-3 rounded-xl border border-[var(--border)] font-mono text-xs uppercase tracking-widest text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--fg)]/5 transition-all inline-flex items-center gap-1.5">
                <Download size={13} /> CSV
              </button>
              <button onClick={() => exportToExcel(formatCustomersForExport(customers), "MSBT_Customers")} className="h-9 px-3 rounded-xl border border-[var(--border)] font-mono text-xs uppercase tracking-widest text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--fg)]/5 transition-all inline-flex items-center gap-1.5">
                <Download size={13} /> Excel
              </button>
            </div>
            <AddButton onClick={() => setCreateOpen(true)}>
              <Plus size={14} />
              Add Customer
            </AddButton>
          </div>
        }
      />

      {/* Search bar */}
      <div className="relative mb-8">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          placeholder="Search by name, village or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-sm h-11 pl-10 pr-4 rounded-xl bg-[var(--fg)]/[0.04] border border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-muted)] text-sm font-mono focus:outline-none focus:border-[var(--fg)]/20 transition-all"
        />
      </div>

      {/* Content */}
      {loading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={48} />}
          title={search ? "No results found" : "No customers yet"}
          description={search ? "Try a different search term" : "Add your first customer to get started"}
          action={!search && <AddButton onClick={() => setCreateOpen(true)}><Plus size={14} /> Add Customer</AddButton>}
        />
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-3"
        >
          {filtered.map((c, i) => (
            <CustomerRow
              key={c.id}
              customer={c}
              index={i}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
          ))}
        </motion.div>
      )}

      {/* Create Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New Customer">
        <CustomerForm onSubmit={handleCreate} loading={submitting} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Customer">
        {editTarget && (
          <CustomerForm initial={editTarget} onSubmit={handleUpdate} loading={submitting} />
        )}
      </Modal>

      {/* Deactivate Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Deactivate Customer?"
        message={`"${deleteTarget?.name}" will be marked as inactive. Their ledger history will be preserved.`}
        confirmLabel="Deactivate"
      />
    </motion.main>
  );
}
