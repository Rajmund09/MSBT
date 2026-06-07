"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInteraction } from "@/contexts/InteractionContext";
export { default as AdaptiveTooltip } from "./AdaptiveTooltip";

/**
 * AdaptiveActions — wraps row action buttons (edit/delete) and adapts behavior:
 *
 * Desktop:  Shows actions on hover (opacity transition, `group-hover` pattern)
 * Touch:    Actions are always visible at full opacity, larger touch targets
 * Hybrid:   Always visible
 *
 * This replaces the manual `opacity-0 group-hover:opacity-100` pattern
 * with a behavior-aware wrapper.
 */
export function AdaptiveActions({ children, className = "" }) {
  const { hasHover, isTouch } = useInteraction();

  if (isTouch || !hasHover) {
    // Always visible on touch
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {children}
      </div>
    );
  }

  // Desktop: opacity-0 group-hover:opacity-100
  return (
    <div className={`flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 ${className}`}>
      {children}
    </div>
  );
}

/**
 * AdaptiveExpandCard — card that shows extra content on hover (desktop)
 * or on tap (touch).
 */
export function AdaptiveExpandCard({ preview, expanded, className = "" }) {
  const { hasHover, isTouch } = useInteraction();
  const [isExpanded, setIsExpanded] = useState(false);

  if (hasHover && !isTouch) {
    // Desktop: expand on hover via CSS group
    return (
      <div className={`group ${className}`}>
        <div>{preview}</div>
        <AnimatePresence>
          <motion.div
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            whileHover={{ height: "auto", opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {expanded}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Touch: tap to expand/collapse
  return (
    <div className={className}>
      <button
        onClick={() => setIsExpanded(v => !v)}
        className="w-full text-left"
      >
        {preview}
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="inline-block ml-2 text-[var(--fg-muted)]"
        >
          ›
        </motion.span>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {expanded}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * AdaptiveContextMenu — Right-click on desktop, long press on mobile.
 */
export function AdaptiveContextMenu({ items, children }) {
  const { hasHover, isTouch } = useInteraction();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const longPressTimer = useState(null)[0];

  const onContextMenu = (e) => {
    if (!hasHover) return;
    e.preventDefault();
    setPos({ x: e.clientX, y: e.clientY });
    setOpen(true);
  };

  let touchTimer = null;
  const onTouchStart = (e) => {
    if (!isTouch) return;
    touchTimer = setTimeout(() => {
      setOpen(true);
    }, 500);
  };
  const onTouchEnd = () => clearTimeout(touchTimer);
  const onTouchMove = () => clearTimeout(touchTimer);

  return (
    <>
      <div
        onContextMenu={onContextMenu}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchMove={onTouchMove}
      >
        {children}
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[300]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* Desktop: floating context menu */}
            {hasHover && !isTouch && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="fixed z-[301] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 min-w-[160px]"
                style={{ left: pos.x, top: pos.y }}
              >
                {items.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => { item.action(); setOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 font-mono text-xs flex items-center gap-3 hover:bg-white/5 transition-colors ${item.danger ? "text-red-400" : "text-white/70"}`}
                  >
                    {item.icon && <span>{item.icon}</span>}
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}

            {/* Mobile: bottom sheet */}
            {isTouch && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                className="fixed bottom-0 left-0 right-0 z-[301] bg-[#111] border-t border-white/10 rounded-t-3xl overflow-hidden"
                style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
              >
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-4" />
                {items.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => { item.action(); setOpen(false); }}
                    className={`w-full text-left px-6 py-4 font-mono text-sm flex items-center gap-4 border-b border-white/5 active:bg-white/5 transition-colors ${item.danger ? "text-red-400" : "text-white/70"}`}
                  >
                    {item.icon && <span className="text-lg">{item.icon}</span>}
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={() => setOpen(false)}
                  className="w-full px-6 py-4 font-mono text-xs uppercase tracking-widest text-white/30 text-center"
                >
                  Cancel
                </button>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </>
  );
}
