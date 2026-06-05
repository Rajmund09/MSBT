"use client";

import { motion } from "framer-motion";

export default function Payments() {
  return (
    <motion.main 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="container mx-auto px-6 md:px-12 flex flex-col items-center justify-center min-h-[60vh]"
    >
      <h1 className="text-title mb-6">Payments</h1>
      <p className="font-mono text-white/40 uppercase tracking-widest text-xs">Ledger & Transactions</p>
    </motion.main>
  );
}
