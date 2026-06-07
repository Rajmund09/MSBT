"use client";

import { motion } from "framer-motion";

// Form field wrapper
export function FormField({ label, error, children, required }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-mono text-[11px] uppercase tracking-widest text-[var(--fg-muted)]">
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

// Text input — min-height 44px for WCAG touch targets
export function Input({ className = "", error, ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-4 rounded-xl bg-[var(--fg)]/[0.04] border ${error ? 'border-red-400 focus:border-red-500' : 'border-[var(--border)] focus:border-[var(--fg)]/30'} text-[var(--fg)] placeholder-[var(--fg)]/30 text-sm font-mono focus:outline-none focus:bg-[var(--fg)]/[0.06] transition-all ${className}`}
      style={{ minHeight: '44px', ...props.style }}
    />
  );
}

// Textarea
export function Textarea({ className = "", error, ...props }) {
  return (
    <textarea
      {...props}
      className={`w-full px-4 py-3 rounded-xl bg-[var(--fg)]/[0.04] border ${error ? 'border-red-400 focus:border-red-500' : 'border-[var(--border)] focus:border-[var(--fg)]/30'} text-[var(--fg)] placeholder-[var(--fg)]/30 text-sm font-mono focus:outline-none focus:bg-[var(--fg)]/[0.06] transition-all resize-none ${className}`}
    />
  );
}

// Select dropdown — min-height 44px for touch targets
export function Select({ className = "", error, children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full px-4 rounded-xl bg-[var(--bg)] border ${error ? 'border-red-400 focus:border-red-500' : 'border-[var(--border)] focus:border-[var(--fg)]/30'} text-[var(--fg)] text-sm font-mono focus:outline-none transition-all appearance-none cursor-pointer ${className}`}
      style={{ minHeight: '44px', ...props.style }}
    >
      {children}
    </select>
  );
}

// Submit button
export function SubmitButton({ loading, children, className = "", ...props }) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      {...props}
      whileHover={!loading ? { scale: 1.01 } : {}}
      whileTap={!loading ? { scale: 0.99 } : {}}
      className={`w-full rounded-xl bg-[var(--fg)] text-[var(--bg)] font-mono text-sm uppercase tracking-widest font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-90 ${className}`}
      style={{ minHeight: '48px' }}
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

// Page Header — fully responsive
export function PageHeader({ title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-4 mb-8 sm:mb-12 border-b border-[var(--border)] pb-6 sm:pb-8"
    >
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
        <div className="min-w-0">
          <h1
            className="font-display tracking-tight text-[var(--fg)] mb-1 sm:mb-2 leading-tight"
            style={{ fontSize: 'clamp(1.75rem, 6vw, 3rem)' }}
          >
            {title}
          </h1>
          {description && (
            <p className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-[var(--fg-muted)]">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </motion.div>
  );
}

// Empty state
export function EmptyState({ icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 sm:py-24 text-center gap-4"
    >
      {icon && <div className="text-[var(--fg-muted)] mb-2 opacity-50">{icon}</div>}
      <h3 className="font-display text-xl sm:text-2xl text-[var(--fg)] opacity-80">{title}</h3>
      {description && <p className="text-sm font-mono text-[var(--fg-muted)] max-w-xs">{description}</p>}
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
      className="inline-flex items-center gap-2 px-4 sm:px-5 rounded-xl bg-[var(--fg)] text-[var(--bg)] font-mono text-xs uppercase tracking-widest font-medium hover:opacity-90 transition-opacity"
      style={{ minHeight: '44px' }}
    >
      {children}
    </motion.button>
  );
}
