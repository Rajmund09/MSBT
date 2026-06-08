"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Users, Plus, Search, Edit2, Trash2, ChevronRight, Phone, MapPin, TrendingUp, Download, Filter } from "lucide-react";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  PageHeader, AddButton, EmptyState, Skeleton,
  FormField, Input, Textarea, SubmitButton, Select
} from "@/components/ui/index";
import { AdaptiveActions, AdaptiveTooltip } from "@/components/ui/AdaptiveUI";
import { exportToExcel, exportToCSV, formatCustomersForExport } from "@/utils/export";
import { useAuth } from "@/contexts/AuthContext";


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
          <Select
            value={form.status}
            onChange={set("status")}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
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

function CustomerRow({ customer, onEdit, onDelete, index, canEdit }) {
  const outstanding = customer.outstanding || 0;

  return (
    <Link href={`/customers/${customer.id}`}>
      <motion.div
        variants={rowVariants}
        layout
        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-6 rounded-2xl bg-white dark:bg-[#111] shadow-sm border border-[var(--border)] hover:shadow-md transition-all cursor-pointer"
      >
      {/* Left: Identity */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <span className="font-mono text-xs text-[var(--fg-muted)] w-6 shrink-0">
          {String(index + 1).padStart(2, "00")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base sm:text-lg text-[var(--fg)] group-hover:italic transition-all truncate">
            {customer.name}
          </p>
          <div className="flex items-center gap-2 sm:gap-3 mt-0.5 flex-wrap">
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
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pl-9 sm:pl-0">
        <div className="flex gap-3 sm:gap-6">
          <div className="text-right">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--fg-muted)]">Revenue</p>
            <p className="font-mono font-medium text-xs sm:text-sm text-[var(--fg)]">{fmt(customer.totalRevenue)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--fg-muted)]">Paid</p>
            <p className="font-mono font-medium text-xs sm:text-sm text-green-500">{fmt(customer.totalPaid)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--fg-muted)]">Due</p>
            <p className={`font-mono font-medium text-xs sm:text-sm ${outstanding > 0 ? "text-red-500" : "text-[var(--fg)]"}`}>
              {fmt(outstanding)}
            </p>
          </div>
        </div>

        <AdaptiveActions>
          {canEdit && (
            <AdaptiveTooltip content="Edit Customer">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(customer); }}
                aria-label="Edit customer"
                className="w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--fg)]/5 hover:bg-[var(--fg)]/10 active:bg-[var(--fg)]/15 text-[var(--fg)]/50 hover:text-[var(--fg)] transition-all"
              >
                <Edit2 size={14} />
              </button>
            </AdaptiveTooltip>
          )}
          {canEdit && (
            <AdaptiveTooltip content="Permanently Delete">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(customer); }}
                aria-label="Delete customer"
                className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-500/5 hover:bg-red-500/15 active:bg-red-500/20 text-red-400/50 hover:text-red-400 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </AdaptiveTooltip>
          )}
        </AdaptiveActions>
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
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [selectedSort, setSelectedSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const { hasPermission } = useAuth();
  const canCreate = hasPermission('customers', 'create');
  const canEdit = hasPermission('customers', 'edit');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      const data = await api.getCustomers(selectedSeasonId);
      setCustomers(data);
    } catch (err) {
      toast(err.message || "Failed to load customers", "error");
    } finally {
      setLoading(false);
    }
  }, [toast, selectedSeasonId]);

  useEffect(() => { 
    api.getSeasons().then(s => setSeasons(s)).catch(() => {});
  }, []);

  useEffect(() => { 
    setLoading(true);
    fetchCustomers(); 
  }, [fetchCustomers]);

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

  // Delete — permanently removes customer from database
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteCustomer(deleteTarget.id);
      toast("Customer permanently deleted", "success");
      setDeleteTarget(null);
      await fetchCustomers();
    } catch (err) {
      toast(err.message || "Failed to delete customer", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Filtered list
  const filtered = useMemo(() => {
    let result = [...customers];
    
    // Apply payment status filter
    if (paymentStatus === "outstanding") {
      result = result.filter(c => c.outstanding > 0);
    } else if (paymentStatus === "paid") {
      result = result.filter(c => c.outstanding <= 0 && c.totalRevenue > 0);
    }

    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.village.toLowerCase().includes(q) ||
        c.phone.includes(q)
      );
    }

    // Apply sort
    result.sort((a, b) => {
      if (selectedSort === "name_asc") return a.name.localeCompare(b.name);
      if (selectedSort === "name_desc") return b.name.localeCompare(a.name);
      
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      
      if (selectedSort === "oldest") return dateA - dateB;
      // Default newest
      return dateB - dateA;
    });

    return result;
  }, [customers, search, paymentStatus, selectedSort]);

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
              <button onClick={() => {
                const selectedSeason = seasons.find(s => s.id === selectedSeasonId);
                const seasonName = selectedSeason ? selectedSeason.name : "All Seasons";
                exportToCSV(formatCustomersForExport(filtered, seasonName), "MSBT_Customers");
              }} className="h-9 px-3 rounded-xl border border-[var(--border)] font-mono text-xs uppercase tracking-widest text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--fg)]/5 transition-all inline-flex items-center gap-1.5">
                <Download size={13} /> CSV
              </button>
              <button onClick={() => {
                const selectedSeason = seasons.find(s => s.id === selectedSeasonId);
                const seasonName = selectedSeason ? selectedSeason.name : "All Seasons";
                exportToExcel(formatCustomersForExport(filtered, seasonName), "MSBT_Customers");
              }} className="h-9 px-3 rounded-xl border border-[var(--border)] font-mono text-xs uppercase tracking-widest text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--fg)]/5 transition-all inline-flex items-center gap-1.5">
                <Download size={13} /> Excel
              </button>
            </div>
            {canCreate && (
              <AddButton onClick={() => setCreateOpen(true)}>
                <Plus size={14} />
                Add Customer
              </AddButton>
            )}
          </div>
        }
      />

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
            <input
              type="text"
              placeholder="Search by name, village or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-white dark:bg-[var(--fg)]/[0.04] border border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-muted)] text-sm font-mono focus:outline-none focus:border-[var(--fg)]/20 shadow-sm transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-11 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all shrink-0 ${showFilters ? "bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]" : "bg-white dark:bg-[var(--fg)]/[0.04] border-[var(--border)] text-[var(--fg)] hover:border-[var(--fg)]/30"}`}
          >
            <Filter size={15} />
            <span className="text-xs font-mono uppercase tracking-widest hidden sm:inline">Filters</span>
          </button>
        </div>
        
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex gap-4 flex-wrap p-4 rounded-2xl bg-[var(--fg)]/[0.02] border border-[var(--border)]"
          >
            <Select
              value={selectedSeasonId}
              onChange={(e) => setSelectedSeasonId(e.target.value)}
              className="w-full sm:w-48 shrink-0 h-11"
            >
              <option value="">All Seasons</option>
              {seasons.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
            <Select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="w-full sm:w-48 shrink-0 h-11"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </Select>
            <Select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full sm:w-48 shrink-0 h-11"
            >
              <option value="all">All Status</option>
              <option value="outstanding">Outstanding Due</option>
              <option value="paid">Fully Paid</option>
            </Select>
          </motion.div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={48} />}
          title={search ? "No results found" : "No customers yet"}
          description={search ? "Try a different search term" : "Add your first customer to get started"}
          action={(!search && canCreate) && <AddButton onClick={() => setCreateOpen(true)}><Plus size={14} /> Add Customer</AddButton>}
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
              canEdit={canEdit}
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

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Permanently Delete Customer?"
        message={`"${deleteTarget?.name}" and all their related ledger entries will be permanently erased. This action cannot be undone.`}
        confirmLabel="Delete Permanently"
      />
    </motion.main>
  );
}
