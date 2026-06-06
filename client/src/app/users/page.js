"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Edit2, Trash2, ShieldAlert, Crown, User } from "lucide-react";
import { api } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  PageHeader, AddButton, EmptyState, Skeleton,
  FormField, Input, Select, SubmitButton
} from "@/components/ui/index";

const ROLE_CONFIG = {
  Owner: { color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: <Crown size={11} /> },
  "Co-Owner": { color: "text-orange-400 bg-orange-500/10 border-orange-500/20", icon: <Crown size={11} /> },
  Manager: { color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: <User size={11} /> },
  Accountant: { color: "text-purple-400 bg-purple-500/10 border-purple-500/20", icon: <User size={11} /> },
  Employee: { color: "text-white/40 bg-white/5 border-white/10", icon: <User size={11} /> },
};

function UserForm({ initial = {}, onSubmit, loading, isEdit = false }) {
  const [form, setForm] = useState({
    username: initial.username || "",
    fullName: initial.full_name || initial.fullName || "",
    phone: initial.phone || "",
    role: initial.role || "Employee",
    status: initial.status || "active",
    password: "",
  });
  const [errors, setErrors] = useState({});

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormField label="Full Name" error={errors.fullName} required>
          <Input placeholder="e.g. Rakesh Kumar" value={form.fullName} onChange={set("fullName")} />
        </FormField>
        <FormField label="Username" error={errors.username} required>
          <Input placeholder="e.g. rakesh123" value={form.username} onChange={set("username")} disabled={isEdit} />
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
        <FormField label="Password" error={errors.password} required>
          <Input type="password" placeholder="Min 6 characters" value={form.password} onChange={set("password")} />
        </FormField>
      )}
      {isEdit && (
        <FormField label="Status">
          <Select value={form.status} onChange={set("status")}>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </Select>
        </FormField>
      )}
      <SubmitButton loading={loading}>
        {isEdit ? "Save Changes" : "Create User"}
      </SubmitButton>
    </form>
  );
}

function UserRow({ u, currentUser, onEdit, onDelete, index }) {
  const config = ROLE_CONFIG[u.role] || ROLE_CONFIG.Employee;
  const isSelf = u.id === currentUser?.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--fg)]/[0.025] border border-[var(--border)] hover:bg-[var(--fg)]/5 transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[var(--fg)]/10 flex items-center justify-center font-display text-lg">
          {u.full_name?.[0] || u.username[0]}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-display text-base">{u.full_name || u.username}</p>
            {isSelf && <span className="font-mono text-[10px] text-white/30">(you)</span>}
          </div>
          <p className="font-mono text-xs text-[var(--fg-muted)]">@{u.username} · {u.phone || "—"}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 ml-14 sm:ml-0">
        <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-mono border ${config.color}`}>
          {config.icon} {u.role}
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${u.status === "active" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
          {u.status}
        </span>
        {!isSelf && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(u)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all">
              <Edit2 size={14} />
            </button>
            <button onClick={() => onDelete(u)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/5 hover:bg-red-500/15 text-red-400/50 hover:text-red-400 transition-all">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function UsersPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

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
      await api.createUser({ username: form.username, password: form.password, role: form.role, fullName: form.fullName, phone: form.phone });
      toast("User created", "success");
      setCreateOpen(false);
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
      await api.updateUser(editTarget.id, { role: form.role, fullName: form.fullName, phone: form.phone, status: form.status });
      toast("User updated", "success");
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
      toast("User suspended", "warning");
      setDeleteTarget(null);
      await fetch();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  if (!["Owner", "Co-Owner"].includes(user?.role)) {
    return (
      <main className="container mx-auto px-4 sm:px-6 md:px-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ShieldAlert size={48} className="mx-auto mb-4 text-red-400/30" />
          <p className="font-display text-2xl text-[var(--fg-muted)]">Access Restricted</p>
          <p className="font-mono text-xs text-[var(--fg-muted)] mt-2">User management is restricted to Owner / Co-Owner.</p>
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
      <PageHeader
        title="Users"
        description={`${users.length} system accounts`}
        action={<AddButton onClick={() => setCreateOpen(true)}><Plus size={14} /> Add User</AddButton>}
      />

      {loading ? (
        <div className="flex flex-col gap-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : users.length === 0 ? (
        <EmptyState icon={<Users size={40} />} title="No users found" action={<AddButton onClick={() => setCreateOpen(true)}><Plus size={14} /> Add User</AddButton>} />
      ) : (
        <div className="flex flex-col gap-3">
          {users.map((u, i) => (
            <UserRow key={u.id} u={u} currentUser={user} index={i} onEdit={setEditTarget} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create User">
        <UserForm onSubmit={handleCreate} loading={submitting} />
      </Modal>

      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit User">
        {editTarget && <UserForm initial={editTarget} onSubmit={handleUpdate} loading={submitting} isEdit />}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Suspend User?"
        message={`"${deleteTarget?.full_name || deleteTarget?.username}" will be suspended and lose all system access.`}
        confirmLabel="Suspend"
      />
    </motion.main>
  );
}
