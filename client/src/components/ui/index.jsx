"use client";

import { motion } from "framer-motion";

// Form field wrapper
export function FormField({ label, error, children, required }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-mono text-[11px] uppercase tracking-widest text-white/40">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[11px] text-red-400 font-mono"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

// Text input
export function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 text-sm font-mono focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all ${className}`}
    />
  );
}

// Textarea
export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={`w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 text-sm font-mono focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all resize-none ${className}`}
    />
  );
}

// Select dropdown
export function Select({ className = "", children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full h-11 px-4 rounded-xl bg-[#0f0f0f] border border-white/[0.08] text-white text-sm font-mono focus:outline-none focus:border-white/20 transition-all appearance-none cursor-pointer ${className}`}
    >
      {children}
    </select>
  );
}

// Submit button
export function SubmitButton({ loading, children, className = "" }) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={!loading ? { scale: 1.01 } : {}}
      whileTap={!loading ? { scale: 0.99 } : {}}
      className={`w-full h-12 rounded-xl bg-white text-black font-mono text-sm uppercase tracking-widest font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:bg-white/90 ${className}`}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          Saving…
        </span>
      ) : children}
    </motion.button>
  );
}

// Skeleton shimmer
export function Skeleton({ className = "" }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-white/[0.04] ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
    </div>
  );
}

// Page Header
export function PageHeader({ title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 border-b border-[var(--border)] pb-8"
    >
      <div>
        <h1 className="text-4xl md:text-5xl font-display tracking-tight text-[var(--fg)] mb-2">{title}</h1>
        {description && (
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--fg-muted)]">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </motion.div>
  );
}

// Empty state
export function EmptyState({ icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center gap-4"
    >
      {icon && <div className="text-white/10 mb-2">{icon}</div>}
      <h3 className="font-display text-2xl text-white/30">{title}</h3>
      {description && <p className="text-sm font-mono text-white/20 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}

// Add button (shared style)
export function AddButton({ onClick, children }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-white text-black font-mono text-xs uppercase tracking-widest font-medium hover:bg-white/90 transition-colors"
    >
      {children}
    </motion.button>
  );
}
