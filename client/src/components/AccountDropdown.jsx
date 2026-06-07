"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, Settings, Camera, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import MagneticButton from "./MagneticButton";
import { api } from "@/utils/api";

export default function AccountDropdown() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const photoUrl = user.profile_photo || null;
  const initial = user.full_name?.[0] || user.username[0];

  return (
    <>
      <div className="fixed top-6 right-6 z-[8000]">
        <MagneticButton strength={0.2}>
          <motion.button
            onClick={() => setOpen(!open)}
            className="w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--bg)] shadow-sm hover:shadow-md overflow-hidden flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[var(--fg)]/20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="font-display text-[var(--fg)]">{initial}</span>
            )}
          </motion.button>
        </MagneticButton>

        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[8001]"
                onClick={() => setOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-12 right-0 w-64 bg-[#0f0f0f] border border-[var(--border)] rounded-2xl shadow-xl z-[8002] overflow-hidden"
              >
                <div className="p-4 border-b border-[var(--border)]">
                  <p className="font-display text-[var(--fg)] truncate">{user.full_name || user.username}</p>
                  <p className="text-xs font-mono text-[var(--fg-muted)] truncate">@{user.username}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-[var(--fg)]/10 text-[var(--fg)] text-[10px] font-mono uppercase tracking-widest border border-[var(--border)]">
                    {user.role}
                  </span>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => { setOpen(false); window.location.href = '/account'; }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors text-sm"
                  >
                    <Settings size={14} /> Account Settings
                  </button>
                  <button
                    onClick={() => { setOpen(false); logout(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-colors text-sm"
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
