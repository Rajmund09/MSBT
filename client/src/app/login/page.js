"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

const PREMIUM_EASE = [0.22, 1, 0.36, 1];

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ username: "", password: "", remember: true });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError("Please enter your username and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(form.username, form.password, form.remember);
      router.replace("/");
    } catch (err) {
      setError(err.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const set = (f) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm(p => ({ ...p, [f]: v }));
    if (error) setError("");
  };

  const letters = ["M", "S", "B", "T"];

  return (
    <div
      className="fixed inset-0 bg-[#050505] flex items-center justify-center overflow-hidden"
      style={{ padding: 'max(1rem, env(safe-area-inset-top, 1rem)) 1rem max(1rem, env(safe-area-inset-bottom, 1rem)) 1rem' }}
    >

      {/* Background grain */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white/[0.015] rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, filter: "blur(20px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1.2, ease: PREMIUM_EASE }}
        className="relative w-full max-w-md"
      >
        {/* Glass card */}
        <div className="relative bg-white/[0.03] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl">
          {/* Top glass highlight */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="px-5 sm:px-10 pt-8 sm:pt-12 pb-6 sm:pb-10">
            {/* MSBT Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: PREMIUM_EASE, delay: 0.2 }}
              className="flex items-center justify-center mb-10"
            >
              <div className="flex items-end gap-1">
                {letters.map((l, i) => (
                  <motion.span
                    key={l}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.07, duration: 0.6, ease: PREMIUM_EASE }}
                    className="font-display text-4xl sm:text-5xl tracking-tighter text-white leading-none"
                  >
                    {l}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.7, ease: PREMIUM_EASE }}
              className="text-center mb-8"
            >
              <h1 className="font-display text-2xl text-white mb-1">Welcome back</h1>
              <p className="font-mono text-xs uppercase tracking-widest text-white/30">
                Sign in to your account
              </p>
            </motion.div>

            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="flex flex-col gap-4"
            >
              {/* Username */}
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[11px] uppercase tracking-widest text-white/40">
                  Username
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  autoFocus
                  placeholder="admin"
                  value={form.username}
                  onChange={set("username")}
                  className="w-full h-12 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 text-sm font-mono focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[11px] uppercase tracking-widest text-white/40">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={set("password")}
                    className="w-full h-12 px-4 pr-12 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 text-sm font-mono focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={form.remember}
                    onChange={set("remember")}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border transition-all ${form.remember ? 'bg-white border-white' : 'border-white/20 bg-white/[0.03]'}`}>
                    {form.remember && (
                      <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 16 16">
                        <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 8l4 4 6-6" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="font-mono text-[11px] text-white/40 group-hover:text-white/60 uppercase tracking-widest transition-colors">
                  Keep me signed in
                </span>
              </label>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono"
                  >
                    <AlertCircle size={14} className="shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.01 } : {}}
                whileTap={!loading ? { scale: 0.99 } : {}}
                className="w-full h-12 mt-2 rounded-xl bg-white text-black font-mono text-sm uppercase tracking-widest font-medium disabled:opacity-50 hover:bg-white/90 transition-all"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2 justify-center">
                    <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : "Sign In"}
              </motion.button>
            </motion.form>
          </div>

          {/* Footer */}
          <div className="px-5 sm:px-10 py-4 sm:py-5 border-t border-white/[0.05] text-center">
            <p className="font-mono text-[10px] text-white/20 uppercase tracking-widest">
              MSBT Business Operating System © 2026
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
