"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-xl" }) {
  const overlayRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { 
      document.body.style.overflow = ""; 
    };
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          onClick={handleOverlayClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9000] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 60, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 60, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className={`relative w-full ${maxWidth} bg-white dark:bg-[#0f0f0f] border border-[var(--border)] dark:border-white/[0.08] 
              rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden
              max-h-[92dvh] sm:max-h-[85vh]
              flex flex-col`}
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {/* Glass highlight strip at top */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/20 to-transparent" />

            {/* Drag handle indicator (mobile only) */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-black/20 dark:bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-8 pt-4 sm:pt-8 pb-4 sm:pb-6 border-b border-[var(--border)] dark:border-white/[0.06] shrink-0">
              <h2 className="font-display text-xl sm:text-2xl tracking-tight text-[var(--fg)]">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--fg)]/5 hover:bg-[var(--fg)]/10 text-[var(--fg)]/50 hover:text-[var(--fg)] transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div data-lenis-prevent="true" className="px-5 sm:px-8 py-5 sm:py-6 overflow-y-auto overscroll-contain flex-1">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return mounted ? createPortal(content, document.body) : null;
}
