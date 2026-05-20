import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Shield, Users, CalendarDays, FileText, IndianRupee, PieChart, Receipt, Check } from "lucide-react";

const MODULES = [
  {
    id: "customers",
    label: "Customer Management",
    icon: <Users size={16} />,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    actions: ["view", "create", "edit", "delete", "export"],
  },
  {
    id: "seasons",
    label: "Season Management",
    icon: <CalendarDays size={16} />,
    color: "text-green-400",
    bg: "bg-green-400/10",
    actions: ["view", "create", "edit", "delete", "archive"],
  },
  {
    id: "entries",
    label: "Entry Management",
    icon: <FileText size={16} />,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    id: "payments",
    label: "Payment Management",
    icon: <IndianRupee size={16} />,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    actions: ["view", "create", "edit", "delete", "approve"],
  },
  {
    id: "billing",
    label: "Billing System",
    icon: <Receipt size={16} />,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    actions: ["generate", "edit", "delete", "print", "export"],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: <PieChart size={16} />,
    color: "text-pink-400",
    bg: "bg-pink-400/10",
    actions: ["view", "export"],
  },
  {
    id: "calendar",
    label: "Calendar & Tasks",
    icon: <CalendarDays size={16} />,
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    id: "users",
    label: "User Management",
    icon: <Shield size={16} />,
    color: "text-red-400",
    bg: "bg-red-400/10",
    actions: ["view", "create", "edit", "delete", "assign_permissions"],
  },
];

export default function PermissionGrid({ permissions = {}, onChange, currentUserRole, currentUserPermissions = {} }) {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (modId) => {
    setExpanded((p) => ({ ...p, [modId]: !p[modId] }));
  };

  const handleActionToggle = (modId, action) => {
    const current = permissions[modId] || [];
    const next = current.includes(action)
      ? current.filter((a) => a !== action)
      : [...current, action];
    onChange({ ...permissions, [modId]: next });
  };

  const handleModuleToggle = (modId, allActions) => {
    const current = permissions[modId] || [];
    const next = current.length === allActions.length ? [] : [...allActions];
    onChange({ ...permissions, [modId]: next });
  };

  const handleGlobalToggle = () => {
    let allSelected = true;
    for (const mod of MODULES) {
      if ((permissions[mod.id] || []).length !== mod.actions.length) {
        allSelected = false;
        break;
      }
    }

    if (allSelected) {
      onChange({});
    } else {
      const full = {};
      MODULES.forEach((mod) => {
        full[mod.id] = [...mod.actions];
      });
      onChange(full);
    }
  };

  // Calculate global state
  let totalActions = 0;
  let selectedActions = 0;
  MODULES.forEach(mod => {
    totalActions += mod.actions.length;
    selectedActions += (permissions[mod.id] || []).length;
  });
  const globalState = selectedActions === 0 ? 'none' : (selectedActions === totalActions ? 'all' : 'indeterminate');

  const canToggleAction = (modId, action) => {
    if (currentUserRole === "Owner") return true;
    const myPerms = currentUserPermissions[modId] || [];
    return myPerms.includes(action);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Global Select All */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--fg)]/[0.02] border border-[var(--border)]">
        <div>
          <p className="font-display text-lg">Global Access</p>
          <p className="font-mono text-xs text-[var(--fg-muted)] mt-1">Select all permissions across all modules</p>
        </div>
        <button
          type="button"
          onClick={handleGlobalToggle}
          className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${globalState === 'all' || globalState === 'indeterminate' ? 'bg-[var(--fg)] border-[var(--fg)] text-[var(--bg)]' : 'border-[var(--border)] text-transparent hover:border-[var(--fg)]/30'}`}
        >
          {globalState === 'all' ? <Check size={12} /> : globalState === 'indeterminate' ? <div className="w-2.5 h-0.5 bg-current rounded-full" /> : null}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {MODULES.map((mod) => {
          const currentActions = permissions[mod.id] || [];
          const isAll = currentActions.length === mod.actions.length;
          const isSome = currentActions.length > 0 && !isAll;
          const isExpanded = expanded[mod.id];

          return (
            <motion.div
              layout
              key={mod.id}
              className="flex flex-col border border-[var(--border)] bg-white dark:bg-[#0c0c0c] rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-[var(--fg)]/[0.02] transition-colors"
                onClick={() => toggleExpand(mod.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mod.bg} ${mod.color}`}>
                    {mod.icon}
                  </div>
                  <div>
                    <h4 className="font-display text-base leading-tight">{mod.label}</h4>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-muted)] mt-1">
                      {currentActions.length} / {mod.actions.length} Permissions
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Module Toggle */}
                  <div
                    onClick={(e) => { e.stopPropagation(); handleModuleToggle(mod.id, mod.actions); }}
                    className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${isAll ? 'bg-[var(--fg)] border-[var(--fg)] text-[var(--bg)]' : isSome ? 'bg-[var(--fg)] border-[var(--fg)] text-[var(--bg)]' : 'border-[var(--border)] text-transparent hover:border-[var(--fg)]/30'}`}
                  >
                    {isAll ? <Check size={12} /> : isSome ? <div className="w-2.5 h-0.5 bg-current rounded-full" /> : null}
                  </div>
                  
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    className="text-[var(--fg-muted)]"
                  >
                    <ChevronDown size={16} />
                  </motion.div>
                </div>
              </div>

              {/* Actions Grid */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {mod.actions.map((action) => {
                        const isSelected = currentActions.includes(action);
                        const allowed = canToggleAction(mod.id, action);
                        
                        return (
                          <div
                            key={action}
                            title={!allowed ? "Not Allowed: You do not have this permission" : ""}
                            onClick={() => allowed && handleActionToggle(mod.id, action)}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                              !allowed 
                                ? 'opacity-50 cursor-not-allowed border-[var(--border)] bg-[var(--fg)]/[0.01]'
                                : isSelected 
                                  ? 'border-[var(--fg)]/20 bg-[var(--fg)]/5 cursor-pointer' 
                                  : 'border-[var(--border)] bg-[var(--fg)]/[0.01] hover:bg-[var(--fg)]/[0.03] cursor-pointer'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${
                              !allowed
                                ? 'border-[var(--border)] text-transparent'
                                : isSelected 
                                  ? 'bg-[var(--fg)] border-[var(--fg)] text-[var(--bg)]' 
                                  : 'border-[var(--border)] text-transparent'
                            }`}>
                              <Check size={10} strokeWidth={3} />
                            </div>
                            <span className="font-mono text-xs capitalize text-[var(--fg)]">
                              {action.replace('_', ' ')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
