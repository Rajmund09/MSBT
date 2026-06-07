"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Edit2, Trash2, ShieldAlert, Crown, User, Search, Filter, ArrowUpDown, Download, Activity, Check } from "lucide-react";
import { api } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  PageHeader, AddButton, EmptyState, Skeleton,
  FormField, Input, Select, SubmitButton
} from "@/components/ui/index";
import { AdaptiveActions, AdaptiveTooltip } from "@/components/ui/AdaptiveUI";
import PermissionGrid from "@/components/staff/PermissionGrid";

const ROLE_CONFIG = {
  Owner: { color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: <Crown size={11} /> },
  "Co-Owner": { color: "text-orange-400 bg-orange-500/10 border-orange-500/20", icon: <Crown size={11} /> },
  Manager: { color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: <User size={11} /> },
  Accountant: { color: "text-purple-400 bg-purple-500/10 border-purple-500/20", icon: <User size={11} /> },
  Employee: { color: "text-[var(--fg)] bg-[var(--fg)]/5 border-[var(--border)]", icon: <User size={11} /> },
};

function StaffSlideOver({ isOpen, onClose, initial = null, onSubmit, loading, currentUser }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    username: "",
    fullName: "",
    phone: "",
    role: "Employee",
    status: "active",
    password: "",
    permissions: {},
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm({
        username: initial?.username || "",
        fullName: initial?.full_name || initial?.fullName || "",
        phone: initial?.phone || "",
        role: initial?.role || "Employee",
        status: initial?.status || "active",
        password: "",
        permissions: initial?.permissions || {},
      });
      setErrors({});
    }
  }, [isOpen, initial]);

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name required";
    if (!form.username.trim()) e.username = "Username required";
    if (!isEdit && !form.password.trim()) e.password = "Password required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[9990] bg-black/60 pointer-events-auto"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:max-w-2xl bg-[var(--bg)] border-l border-[var(--border)] z-[9999] shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-white dark:bg-[#050505]">
              <div>
                <h2 className="font-display text-2xl">{isEdit ? "Edit Staff Member" : "Add Staff Member"}</h2>
                <p className="font-mono text-xs text-[var(--fg-muted)] mt-1">Manage profile and granular access control.</p>
              </div>
              <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--fg)]/5 transition-colors">
                <Plus size={20} className="rotate-45 text-[var(--fg-muted)]" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-[var(--bg)]">
              <form id="staff-form" onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-xl mx-auto">
                {/* Profile Section */}
                <div className="flex flex-col gap-5">
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-muted)] border-b border-[var(--border)] pb-2">Profile Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField label="Full Name" error={errors.fullName} required>
                      <Input placeholder="e.g. Rakesh Kumar" value={form.fullName} onChange={set("fullName")} error={!!errors.fullName} />
                    </FormField>
                    <FormField label="Username" error={errors.username} required>
                      <Input placeholder="e.g. rakesh123" value={form.username} onChange={set("username")} disabled={isEdit} error={!!errors.username} />
                    </FormField>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField label="Phone">
                      <Input placeholder="+91 98765 43210" value={form.phone} onChange={set("phone")} />
                    </FormField>
                    <FormField label="Role" required>
                      <Select value={form.role} onChange={set("role")}>
                        {["Owner","Co-Owner","Manager","Accountant","Employee"].map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </Select>
                    </FormField>
                  </div>
                  {!isEdit && (
                    <FormField label="Temporary Password" error={errors.password} required>
                      <Input type="password" placeholder="Min 6 characters" value={form.password} onChange={set("password")} error={!!errors.password} />
                    </FormField>
                  )}
                  {isEdit && (
                    <FormField label="Account Status">
                      <Select value={form.status} onChange={set("status")}>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                      </Select>
                    </FormField>
                  )}
                </div>

                {/* Permissions Section */}
                <div className="flex flex-col gap-5">
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-muted)] border-b border-[var(--border)] pb-2">Access Control</h3>
                  <PermissionGrid 
                    permissions={form.permissions} 
                    onChange={(perms) => setForm(p => ({ ...p, permissions: perms }))}
                    currentUserRole={currentUser?.role}
                    currentUserPermissions={currentUser?.permissions}
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[var(--border)] bg-white dark:bg-[#050505] flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl border border-[var(--border)] font-mono text-xs uppercase tracking-widest hover:bg-[var(--fg)]/5 transition-all"
              >
                Cancel
              </button>
              <SubmitButton form="staff-form" loading={loading} className="px-8">
                {isEdit ? "Save Changes" : "Create Staff"}
              </SubmitButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StaffRow({ u, currentUser, onEdit, onDelete, index }) {
  const config = ROLE_CONFIG[u.role] || ROLE_CONFIG.Employee;
  const isSelf = u.id === currentUser?.id;
  const createdDate = new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#111] shadow-sm border border-[var(--border)] hover:shadow-md transition-all cursor-pointer"
      onClick={() => !isSelf && onEdit(u)}
    >
      {/* Identity Col */}
      <div className="flex items-center gap-4 w-full sm:w-1/3">
        <div className="w-12 h-12 rounded-full bg-[var(--fg)]/5 border border-[var(--border)] flex items-center justify-center font-display text-xl text-[var(--fg)]">
          {u.full_name?.[0] || u.username[0]}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-display text-lg group-hover:italic transition-all">{u.full_name || u.username}</p>
            {isSelf && <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[var(--fg)]/10 text-[var(--fg)] uppercase">You</span>}
          </div>
          <p className="font-mono text-xs text-[var(--fg-muted)]">@{u.username} · {u.phone || "No phone"}</p>
        </div>
      </div>

      {/* Role Col */}
      <div className="hidden md:flex flex-col gap-1.5 w-1/4">
        <span className={`inline-flex self-start items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-mono border ${config.color}`}>
          {config.icon} {u.role}
        </span>
        <span className="font-mono text-[10px] text-[var(--fg-muted)] flex items-center gap-1">
          <Activity size={10} /> Joined {createdDate}
        </span>
      </div>

      {/* Status Col */}
      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto flex-1">
        <div className="flex flex-col items-start sm:items-end gap-1">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase tracking-widest border ${u.status === "active" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}`}>
            {u.status}
          </span>
          <span className="font-mono text-[10px] text-[var(--fg-muted)]">
            {Object.keys(u.permissions || {}).length} Modules Access
          </span>
        </div>

        {!isSelf && (
          <AdaptiveActions>
            <AdaptiveTooltip content="Suspend Staff">
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(u); }} 
                aria-label="Suspend user" 
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/15 text-yellow-500 transition-all shadow-sm"
              >
                <Trash2 size={16} />
              </button>
            </AdaptiveTooltip>
            <AdaptiveTooltip content="Permanently Delete">
              <button 
                onClick={(e) => { e.stopPropagation(); u.onHardDelete && u.onHardDelete(u); }} 
                aria-label="Delete user" 
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-500 transition-all shadow-sm"
              >
                <Trash2 size={16} />
              </button>
            </AdaptiveTooltip>
          </AdaptiveActions>
        )}
      </div>
    </motion.div>
  );
}

export default function StaffManagementPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");

  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState(null);
  const [hardDeleting, setHardDeleting] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleCreate = async (form) => {
    setSubmitting(true);
    try {
      await api.createUser({ 
        username: form.username, 
        password: form.password, 
        role: form.role, 
        fullName: form.fullName, 
        phone: form.phone,
        permissions: form.permissions
      });
      toast("Staff member created", "success");
      setSlideOverOpen(false);
      await fetch();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (form) => {
    setSubmitting(true);
    try {
      await api.updateUser(editTarget.id, { 
        role: form.role, 
        fullName: form.fullName, 
        phone: form.phone, 
        status: form.status,
        permissions: form.permissions
      });
      toast("Staff member updated", "success");
      setSlideOverOpen(false);
      setEditTarget(null);
      await fetch();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteUser(deleteTarget.id);
      toast("Staff member suspended", "warning");
      setDeleteTarget(null);
      await fetch();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleHardDelete = async () => {
    setHardDeleting(true);
    try {
      await api.hardDeleteUser(hardDeleteTarget.id);
      toast("Staff member permanently deleted", "success");
      setHardDeleteTarget(null);
      await fetch();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setHardDeleting(false);
    }
  };

  const openAdd = () => {
    setEditTarget(null);
    setSlideOverOpen(true);
  };

  const openEdit = (u) => {
    setEditTarget(u);
    setSlideOverOpen(true);
  };

  // Filtering
  const filtered = useMemo(() => {
    let result = users;
    if (filterRole !== "All") result = result.filter(u => u.role === filterRole);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(u => 
        u.full_name?.toLowerCase().includes(q) || 
        u.username.toLowerCase().includes(q) || 
        u.phone?.includes(q)
      );
    }
    return result;
  }, [users, search, filterRole]);

  if (!["Owner", "Co-Owner"].includes(user?.role)) {
    return (
      <main className="container mx-auto px-4 sm:px-6 md:px-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={48} className="text-red-500" />
          </div>
          <p className="font-display text-3xl mb-2">Access Restricted</p>
          <p className="font-mono text-sm text-[var(--fg-muted)] leading-relaxed">Staff management and permission control are strictly restricted to the organization Owner and Co-Owner.</p>
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
      className="container mx-auto px-4 sm:px-6 md:px-12 pb-24"
    >
      <PageHeader
        title="Staff Management"
        description={`${users.length} active team members`}
        action={<AddButton onClick={openAdd}><Plus size={14} /> Add Staff</AddButton>}
      />

      {/* Advanced Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
          <input
            type="text"
            placeholder="Search team members by name, username or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-white dark:bg-[#111] border border-[var(--border)] shadow-sm text-[var(--fg)] placeholder-[var(--fg-muted)] text-sm font-mono focus:outline-none focus:border-[var(--fg)]/30 focus:shadow-md transition-all"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="relative">
            <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] pointer-events-none" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="h-12 pl-10 pr-10 rounded-xl bg-white dark:bg-[#111] border border-[var(--border)] shadow-sm text-[var(--fg)] text-xs font-mono uppercase tracking-widest focus:outline-none focus:border-[var(--fg)]/30 hover:shadow-md transition-all appearance-none cursor-pointer"
            >
              <option value="All">All Roles</option>
              <option value="Owner">Owner</option>
              <option value="Co-Owner">Co-Owner</option>
              <option value="Manager">Manager</option>
              <option value="Accountant">Accountant</option>
              <option value="Employee">Employee</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users size={48} />} title="No staff found" description="Try adjusting your search or filters." action={!search && <AddButton onClick={openAdd}><Plus size={14} /> Add Staff</AddButton>} />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((u, i) => (
            <StaffRow key={u.id} u={{...u, onHardDelete: setHardDeleteTarget}} currentUser={user} index={i} onEdit={openEdit} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {/* SlideOver for Add/Edit */}
      <StaffSlideOver 
        isOpen={slideOverOpen} 
        onClose={() => setSlideOverOpen(false)} 
        initial={editTarget} 
        onSubmit={editTarget ? handleUpdate : handleCreate} 
        loading={submitting}
        currentUser={user}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Suspend Staff Member?"
        message={`"${deleteTarget?.full_name || deleteTarget?.username}" will be suspended, instantly revoking all ERP access and active sessions.`}
        confirmLabel="Suspend Access"
      />

      <ConfirmDialog
        isOpen={!!hardDeleteTarget}
        onClose={() => setHardDeleteTarget(null)}
        onConfirm={handleHardDelete}
        loading={hardDeleting}
        title="Permanently Delete Staff?"
        message={`"${hardDeleteTarget?.full_name || hardDeleteTarget?.username}" will be permanently deleted and completely removed from the system. This cannot be undone.`}
        confirmLabel="Delete Permanently"
      />
    </motion.main>
  );
}
