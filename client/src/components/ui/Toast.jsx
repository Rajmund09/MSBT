"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";

const ToastContext = createContext(null);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    setToasts(prev => {
      // Deduplicate toasts with the exact same message
      if (prev.some(t => t.message === message)) return prev;
      
      const id = ++toastIdCounter;
      setTimeout(() => {
        setToasts(p => p.filter(t => t.id !== id));
      }, 4000);
      
      return [...prev, { id, message, type }];
    });
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <Toast key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const ICONS = {
  success: <CheckCircle size={16} className="shrink-0 text-green-400" />,
  error: <XCircle size={16} className="shrink-0 text-red-400" />,
  warning: <AlertTriangle size={16} className="shrink-0 text-yellow-400" />,
};

function Toast({ toast, onRemove }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-2xl min-w-[280px] max-w-[380px] backdrop-blur-2xl relative overflow-hidden group
        ${toast.type === "error" ? "bg-red-950/40 border-red-500/20 shadow-red-500/10 text-red-50" : 
          toast.type === "warning" ? "bg-yellow-950/40 border-yellow-500/20 shadow-yellow-500/10 text-yellow-50" : 
          "bg-green-950/40 border-green-500/20 shadow-green-500/10 text-green-50"}`}
    >
      <div className={`absolute inset-0 opacity-20 bg-gradient-to-br pointer-events-none ${
        toast.type === "error" ? "from-red-500 to-transparent" :
        toast.type === "warning" ? "from-yellow-500 to-transparent" :
        "from-green-500 to-transparent"
      }`} />
      
      <div className="relative z-10 shrink-0 mt-0.5">
        {ICONS[toast.type] || ICONS.success}
      </div>
      
      <div className="relative z-10 flex-1 flex flex-col gap-0.5 pr-2">
        <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">
          {toast.type === "error" ? "Access Denied" : toast.type === "warning" ? "Notice" : "Success"}
        </span>
        <span className="text-sm font-medium leading-snug">{toast.message.replace(/^Access Denied:\s*/i, "")}</span>
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        className="relative z-10 shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white/50 hover:text-white border border-white/5 hover:border-white/10"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
